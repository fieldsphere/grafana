package user

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	claims "github.com/grafana/authlib/types"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
	legacyuser "github.com/grafana/grafana/pkg/services/user"
)

var (
	_ rest.Storage         = (*UserUsingREST)(nil)
	_ rest.StorageMetadata = (*UserUsingREST)(nil)
	_ rest.Connecter       = (*UserUsingREST)(nil)
)

// UserUsingREST serves POST users/{name}/using/{orgId} — active-org switch for the
// signed-in-user migration. Active org lives on the legacy user row, not IAM User.spec.
type UserUsingREST struct {
	userGetter  rest.Getter
	orgService  org.Service
	userService legacyuser.Service
}

func NewUserUsingREST(userGetter rest.Getter, orgService org.Service, userService legacyuser.Service) *UserUsingREST {
	return &UserUsingREST{
		userGetter:  userGetter,
		orgService:  orgService,
		userService: userService,
	}
}

func (s *UserUsingREST) New() runtime.Object {
	return &legacyiamv0.UserUsingStatus{}
}

func (s *UserUsingREST) Destroy() {}

func (s *UserUsingREST) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (s *UserUsingREST) ProducesObject(verb string) interface{} {
	return s.New()
}

func (s *UserUsingREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			responder.Error(apierrors.NewMethodNotSupported(legacyiamv0.Resource("users"), r.Method))
			return
		}

		requester, err := identity.GetRequester(r.Context())
		if err != nil || !claims.IsIdentityType(requester.GetIdentityType(), claims.TypeUser) {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("entity not allowed to change active organization")))
			return
		}

		orgID, err := parseUsingOrgID(r.URL.Path)
		if err != nil {
			responder.Error(apierrors.NewBadRequest(err.Error()))
			return
		}

		userID, err := resolveUserInternalID(r.Context(), s.userGetter, name)
		if err != nil {
			responder.Error(err)
			return
		}

		callerID, err := requester.GetInternalID()
		if err != nil || callerID != userID {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("can only change own active organization")))
			return
		}

		orgs, err := s.orgService.GetUserOrgList(r.Context(), &org.GetUserOrgListQuery{UserID: userID})
		if err != nil {
			responder.Error(apierrors.NewInternalError(err))
			return
		}
		valid := false
		for _, o := range orgs {
			if o.OrgID == orgID {
				valid = true
				break
			}
		}
		if !valid {
			responder.Error(apierrors.NewUnauthorized("Not a valid organization"))
			return
		}

		if err := s.userService.Update(r.Context(), &legacyuser.UpdateUserCommand{UserID: userID, OrgID: &orgID}); err != nil {
			responder.Error(apierrors.NewInternalError(err))
			return
		}

		responder.Object(http.StatusOK, &legacyiamv0.UserUsingStatus{
			Message: "Active organization changed",
			OrgID:   orgID,
		})
	}), nil
}

func (s *UserUsingREST) NewConnectOptions() (runtime.Object, bool, string) {
	// Trailing subpath carries the org id: .../using/{orgId}
	return nil, true, ""
}

func (s *UserUsingREST) ConnectMethods() []string {
	return []string{http.MethodPost}
}

func parseUsingOrgID(path string) (int64, error) {
	// Path ends with /using/<id> or /using/<id>/
	trimmed := strings.TrimSuffix(path, "/")
	idx := strings.LastIndex(trimmed, "/")
	if idx < 0 {
		return 0, errors.New("org id is required")
	}
	return strconv.ParseInt(trimmed[idx+1:], 10, 64)
}
