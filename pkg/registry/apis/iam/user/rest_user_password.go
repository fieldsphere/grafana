package user

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	claims "github.com/grafana/authlib/types"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	legacyuser "github.com/grafana/grafana/pkg/services/user"
)

var (
	_ rest.Storage         = (*UserPasswordREST)(nil)
	_ rest.StorageMetadata = (*UserPasswordREST)(nil)
	_ rest.Connecter       = (*UserPasswordREST)(nil)
)

type changePasswordBody struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

// UserPasswordREST serves POST users/{name}/password. Password hashes stay in legacy SQL.
type UserPasswordREST struct {
	userGetter  rest.Getter
	userService legacyuser.Service
}

func NewUserPasswordREST(userGetter rest.Getter, userService legacyuser.Service) *UserPasswordREST {
	return &UserPasswordREST{userGetter: userGetter, userService: userService}
}

func (s *UserPasswordREST) New() runtime.Object {
	return &legacyiamv0.UserPasswordStatus{}
}

func (s *UserPasswordREST) Destroy() {}

func (s *UserPasswordREST) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (s *UserPasswordREST) ProducesObject(verb string) interface{} {
	return s.New()
}

func (s *UserPasswordREST) Connect(ctx context.Context, name string, _ runtime.Object, responder rest.Responder) (http.Handler, error) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			responder.Error(apierrors.NewMethodNotSupported(legacyiamv0.Resource("users"), r.Method))
			return
		}

		requester, err := identity.GetRequester(r.Context())
		if err != nil || !claims.IsIdentityType(requester.GetIdentityType(), claims.TypeUser) {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("entity not allowed to change password")))
			return
		}

		userID, err := resolveUserInternalID(r.Context(), s.userGetter, name)
		if err != nil {
			responder.Error(err)
			return
		}

		callerID, err := requester.GetInternalID()
		if err != nil || callerID != userID {
			responder.Error(apierrors.NewForbidden(legacyiamv0.Resource("users"), name, errors.New("can only change own password")))
			return
		}

		var body changePasswordBody
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			responder.Error(apierrors.NewBadRequest("bad request data"))
			return
		}
		if body.NewPassword == "" {
			responder.Error(apierrors.NewBadRequest("newPassword is required"))
			return
		}

		oldPassword := legacyuser.Password(body.OldPassword)
		newPassword := legacyuser.Password(body.NewPassword)
		if err := s.userService.Update(r.Context(), &legacyuser.UpdateUserCommand{
			UserID:      userID,
			Password:    &newPassword,
			OldPassword: &oldPassword,
		}); err != nil {
			responder.Error(apierrors.NewBadRequest(err.Error()))
			return
		}

		responder.Object(http.StatusOK, &legacyiamv0.UserPasswordStatus{Message: "User password changed"})
	}), nil
}

func (s *UserPasswordREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (s *UserPasswordREST) ConnectMethods() []string {
	return []string{http.MethodPost, http.MethodPut}
}
