package user

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	claims "github.com/grafana/authlib/types"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/models/usertoken"
	"github.com/grafana/grafana/pkg/services/auth"
	"github.com/grafana/grafana/pkg/services/auth/authtest"
	"github.com/grafana/grafana/pkg/services/contexthandler/ctxkey"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/login/authinfotest"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/org/orgtest"
	legacyuser "github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/user/usertest"
)

func withSignedInUser(req *http.Request, userID int64) *http.Request {
	ctx := identity.WithRequester(req.Context(), &identity.StaticRequester{
		Type:   claims.TypeUser,
		UserID: userID,
	})
	return req.WithContext(ctx)
}

func TestUserUsingREST_rejectsOtherUser(t *testing.T) {
	orgService := &orgtest.FakeOrgService{
		ExpectedUserOrgDTO: []*org.UserOrgDTO{{OrgID: 1, Name: "Main", Role: org.RoleAdmin}},
	}
	userService := usertest.NewUserServiceFake()
	updated := false
	userService.UpdateFn = func(ctx context.Context, cmd *legacyuser.UpdateUserCommand) error {
		updated = true
		return nil
	}
	handler := NewUserUsingREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, orgService, userService)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/users/u1/using/1", nil)
	req = withSignedInUser(req, 99)
	h.ServeHTTP(httptest.NewRecorder(), req)

	require.Error(t, responder.err)
	require.True(t, apierrors.IsForbidden(responder.err))
	require.False(t, updated)
}

func TestUserUsingREST_allowsSelf(t *testing.T) {
	orgService := &orgtest.FakeOrgService{
		ExpectedUserOrgDTO: []*org.UserOrgDTO{{OrgID: 1, Name: "Main", Role: org.RoleAdmin}},
	}
	userService := usertest.NewUserServiceFake()
	handler := NewUserUsingREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, orgService, userService)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/users/u1/using/1", nil)
	req = withSignedInUser(req, 42)
	h.ServeHTTP(httptest.NewRecorder(), req)

	require.NoError(t, responder.err)
	require.Equal(t, http.StatusOK, responder.code)
	status, ok := responder.obj.(*legacyiamv0.UserUsingStatus)
	require.True(t, ok)
	require.Equal(t, int64(1), status.OrgID)
}

func TestUserTokenREST_marksCurrentSessionActive(t *testing.T) {
	tokenService := authtest.NewFakeUserAuthTokenService()
	tokenService.GetUserTokensProvider = func(ctx context.Context, userID int64) ([]*auth.UserToken, error) {
		return []*auth.UserToken{
			{Id: 1, UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
			{Id: 2, UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0"},
		}, nil
	}
	handler := NewUserTokenREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, tokenService)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/users/u1/tokens", nil)
	req = withSignedInUser(req, 42)
	req = req.WithContext(context.WithValue(req.Context(), ctxkey.Key{}, &contextmodel.ReqContext{
		UserToken: &usertoken.UserToken{Id: 1},
	}))
	h.ServeHTTP(httptest.NewRecorder(), req)

	require.NoError(t, responder.err)
	list, ok := responder.obj.(*legacyiamv0.UserAuthTokenList)
	require.True(t, ok)
	require.Len(t, list.Items, 2)
	require.True(t, list.Items[0].IsActive)
	require.False(t, list.Items[1].IsActive)
	require.Equal(t, "Chrome", list.Items[0].Browser)
	require.NotEmpty(t, list.Items[0].OS)
}

func TestUserPasswordREST_rejectsExternalUser(t *testing.T) {
	userService := usertest.NewUserServiceFake()
	updated := false
	userService.UpdateFn = func(ctx context.Context, cmd *legacyuser.UpdateUserCommand) error {
		updated = true
		return nil
	}
	authInfo := &authinfotest.FakeService{
		ExpectedUserAuth: &login.UserAuth{UserId: 42, AuthModule: login.LDAPAuthModule},
	}
	handler := NewUserPasswordREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, userService, authInfo)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	body, _ := json.Marshal(changePasswordBody{OldPassword: "old", NewPassword: "new"})
	req := httptest.NewRequest(http.MethodPost, "/users/u1/password", bytes.NewReader(body))
	req = withSignedInUser(req, 42)
	h.ServeHTTP(httptest.NewRecorder(), req)

	require.Error(t, responder.err)
	require.True(t, apierrors.IsForbidden(responder.err))
	require.False(t, updated)
}

func TestUserPasswordREST_allowsLocalUser(t *testing.T) {
	userService := usertest.NewUserServiceFake()
	authInfo := &authinfotest.FakeService{
		ExpectedError: legacyuser.ErrUserNotFound,
	}
	handler := NewUserPasswordREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, userService, authInfo)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	body, _ := json.Marshal(changePasswordBody{OldPassword: "old", NewPassword: "new"})
	req := httptest.NewRequest(http.MethodPost, "/users/u1/password", bytes.NewReader(body))
	req = withSignedInUser(req, 42)
	h.ServeHTTP(httptest.NewRecorder(), req)

	require.NoError(t, responder.err)
	require.Equal(t, http.StatusOK, responder.code)
}
