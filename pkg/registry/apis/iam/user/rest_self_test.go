package user

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime"

	"github.com/grafana/grafana/pkg/services/auth"
	"github.com/grafana/grafana/pkg/services/auth/authtest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/user/usertest"
)

func TestUserContextRESTSwitchesOrg(t *testing.T) {
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 5, UID: "u5"}}
	connector := NewUserContextREST(users)
	responder := &selfTestResponder{}

	handler, err := connector.Connect(context.Background(), "u5", nil, responder)
	require.NoError(t, err)

	body, _ := json.Marshal(map[string]int64{"orgId": 12})
	req := httptest.NewRequest(http.MethodPost, "/context", bytes.NewReader(body))
	handler.ServeHTTP(httptest.NewRecorder(), req)

	require.NoError(t, responder.err)
	require.Equal(t, http.StatusOK, responder.status)
	got := responder.obj.(*UserContext)
	require.Equal(t, int64(12), got.OrgID)
}

func TestUserPasswordRESTRequiresNewPassword(t *testing.T) {
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 5, UID: "u5"}}
	connector := NewUserPasswordREST(users)
	responder := &selfTestResponder{}

	handler, err := connector.Connect(context.Background(), "u5", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPut, "/password", bytes.NewReader([]byte(`{"oldPassword":"x"}`)))
	handler.ServeHTTP(httptest.NewRecorder(), req)

	require.Error(t, responder.err)
}

func TestUserSessionsRESTListsTokens(t *testing.T) {
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 5, UID: "u5"}}
	tokens := authtest.NewFakeUserAuthTokenService()
	tokens.GetUserTokensProvider = func(ctx context.Context, userID int64) ([]*auth.UserToken, error) {
		return []*auth.UserToken{{Id: 9, UserId: userID, UserAgent: "test"}}, nil
	}
	connector := NewUserSessionsREST(users, tokens)
	responder := &selfTestResponder{}

	handler, err := connector.Connect(context.Background(), "u5", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/sessions", nil)
	handler.ServeHTTP(httptest.NewRecorder(), req)

	require.NoError(t, responder.err)
	list := responder.obj.(*UserSessionList)
	require.Len(t, list.Items, 1)
	require.Equal(t, int64(9), list.Items[0].ID)
}

type selfTestResponder struct {
	status int
	obj    runtime.Object
	err    error
}

func (r *selfTestResponder) Object(status int, obj runtime.Object) {
	r.status = status
	r.obj = obj
}

func (r *selfTestResponder) Error(err error) {
	r.err = err
}
