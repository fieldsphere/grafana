package user

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	iamv0 "github.com/grafana/grafana/apps/iam/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/apimachinery/utils"
	legacyiamv0 "github.com/grafana/grafana/pkg/apis/iam/v0alpha1"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/org/orgtest"
)

type fakeUserGetter struct {
	obj runtime.Object
	err error
}

func (f *fakeUserGetter) Get(_ context.Context, _ string, _ *metav1.GetOptions) (runtime.Object, error) {
	return f.obj, f.err
}

func testUserObject(t *testing.T, name string, internalID int64) runtime.Object {
	t.Helper()
	u := &iamv0.User{}
	u.SetName(name)
	meta, err := utils.MetaAccessor(u)
	require.NoError(t, err)
	meta.SetDeprecatedInternalID(internalID) // nolint:staticcheck
	return u
}

type capturingResponder struct {
	obj  runtime.Object
	code int
	err  error
}

func (c *capturingResponder) Object(code int, obj runtime.Object) {
	c.code = code
	c.obj = obj
}

func (c *capturingResponder) Error(err error) {
	c.err = err
}

func TestUserOrgREST_Connect(t *testing.T) {
	orgService := &orgtest.FakeOrgService{
		ExpectedUserOrgDTO: []*org.UserOrgDTO{
			{OrgID: 1, Name: "Main", Role: org.RoleAdmin},
			{OrgID: 2, Name: "Other", Role: org.RoleViewer},
		},
	}
	handler := NewUserOrgREST(&fakeUserGetter{obj: testUserObject(t, "u1", 42)}, orgService)
	responder := &capturingResponder{}

	h, err := handler.Connect(context.Background(), "u1", nil, responder)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/users/u1/orgs", nil)
	h.ServeHTTP(httptest.NewRecorder(), req)
	require.NoError(t, responder.err)
	require.Equal(t, http.StatusOK, responder.code)

	list, ok := responder.obj.(*legacyiamv0.UserOrgList)
	require.True(t, ok)
	require.Len(t, list.Items, 2)
	require.Equal(t, int64(1), list.Items[0].OrgID)
	require.Equal(t, "Main", list.Items[0].Name)
}

func TestParseUsingOrgID(t *testing.T) {
	id, err := parseUsingOrgID("/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u1/using/7")
	require.NoError(t, err)
	require.Equal(t, int64(7), id)
}

// Ensure rest.Responder compile-time usage stays intentional for fake getters.
var _ rest.Getter = (*fakeUserGetter)(nil)

func TestUserOrgListJSONShape(t *testing.T) {
	raw, err := json.Marshal(&legacyiamv0.UserOrgList{
		Items: []legacyiamv0.UserOrg{{OrgID: 1, Name: "Main", Role: "Admin"}},
	})
	require.NoError(t, err)
	require.Contains(t, string(raw), `"orgId":1`)
}
