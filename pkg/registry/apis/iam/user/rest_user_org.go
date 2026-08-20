package user

import (
	"context"
	"errors"
	"net/http"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"github.com/grafana/grafana/pkg/apimachinery/utils"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
)

var (
	_ rest.Storage         = (*UserOrgREST)(nil)
	_ rest.StorageMetadata = (*UserOrgREST)(nil)
	_ rest.Connecter       = (*UserOrgREST)(nil)
)

// UserOrgREST serves GET users/{name}/orgs — membership list for the signed-in-user
// migration. Backed by the legacy org_user table (IAM User has no multi-org field).
type UserOrgREST struct {
	userGetter rest.Getter
	orgService org.Service
}

func NewUserOrgREST(userGetter rest.Getter, orgService org.Service) *UserOrgREST {
	return &UserOrgREST{userGetter: userGetter, orgService: orgService}
}

func (s *UserOrgREST) New() runtime.Object {
	return &legacyiamv0.UserOrgList{}
}

func (s *UserOrgREST) Destroy() {}

func (s *UserOrgREST) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (s *UserOrgREST) ProducesObject(verb string) interface{} {
	return s.New()
}

func (s *UserOrgREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			responder.Error(apierrors.NewMethodNotSupported(legacyiamv0.Resource("users"), r.Method))
			return
		}

		userID, err := resolveUserInternalID(r.Context(), s.userGetter, name)
		if err != nil {
			responder.Error(err)
			return
		}

		result, err := s.orgService.GetUserOrgList(r.Context(), &org.GetUserOrgListQuery{UserID: userID})
		if err != nil {
			responder.Error(apierrors.NewInternalError(err))
			return
		}

		items := make([]legacyiamv0.UserOrg, 0, len(result))
		for _, o := range result {
			items = append(items, legacyiamv0.UserOrg{
				OrgID: o.OrgID,
				Name:  o.Name,
				Role:  string(o.Role),
			})
		}

		responder.Object(http.StatusOK, &legacyiamv0.UserOrgList{Items: items})
	}), nil
}

func (s *UserOrgREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (s *UserOrgREST) ConnectMethods() []string {
	return []string{http.MethodGet}
}

func resolveUserInternalID(ctx context.Context, getter rest.Getter, name string) (int64, error) {
	obj, err := getter.Get(ctx, name, &metav1.GetOptions{})
	if err != nil {
		return 0, err
	}
	meta, err := utils.MetaAccessor(obj)
	if err != nil {
		return 0, apierrors.NewInternalError(err)
	}
	id := meta.GetDeprecatedInternalID() // nolint:staticcheck
	if id == 0 {
		return 0, apierrors.NewInternalError(errors.New("user object missing internal id"))
	}
	return id, nil
}
