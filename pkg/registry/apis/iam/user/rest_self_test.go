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
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/org/orgtest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/user/usertest"
)

func TestUserContextRESTSwitchesOrg(t *testing.T) {
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 5, UID: "u5"}}
	orgs := orgtest.NewOrgServiceFake()
	orgs.ExpectedUserOrgDTO = []*org.UserOrgDTO{{OrgID: 12, Name: "Ops"}}
	connector := NewUserContextREST(users, orgs)
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

func TestUserContextRESTRejectsUnknownOrg(t *testing.T) {
	users := &usertest.FakeUserService{ExpectedUser: &user.User{ID: 5, UID: "u5"}}
	orgs := orgtest.NewOrgServiceFake()
	orgs.ExpectedUserOrgDTO = []*org.UserOrgDTO{{OrgID: 1, Name: "Main"}}
	connector := NewUserContextREST(users, orgs)
	responder := &selfTestResponder{}

	handler, err := connector.Connect(context.Background(), "u5", nil, responder)
	require.NoError(t, err)

	body, _ := json.Marshal(map[string]int64{"orgId": 12})
	req := httptest.NewRequest(http.MethodPost, "/context", bytes.NewReader(body))
	handler.ServeHTTP(httptest.NewRecorder(), req)

	require.Error(t, responder.err)
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
		return []*auth.UserToken{{
			Id:        9,
			UserId:    userID,
			UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			CreatedAt: 1700000000,
			SeenAt:    1700000100,
		}}, nil
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
	require.NotEmpty(t, list.Items[0].Browser)
	require.False(t, list.Items[0].CreatedAt.IsZero())
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
