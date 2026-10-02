package integrationtypeschema

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana-app-sdk/resource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
)

type fakeAccessControl struct {
	err error
}

func (f fakeAccessControl) AuthorizeReadSome(context.Context, identity.Requester) error {
	return f.err
}

func TestHandleGetSchemas_clientErrorsKeepStatus(t *testing.T) {
	req := &app.CustomRouteRequest{
		ResourceIdentifier: resource.FullIdentifier{Namespace: "default"},
	}

	t.Run("unauthorized when no user in context", func(t *testing.T) {
		h := New(fakeAccessControl{}, nil)
		rec := httptest.NewRecorder()

		err := h.HandleGetSchemas(context.Background(), rec, req)

		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":401`)
		assert.Contains(t, rec.Body.String(), "authentication required")
	})

	t.Run("unauthorized when read is denied", func(t *testing.T) {
		h := New(fakeAccessControl{err: errors.New("denied")}, nil)
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgID: 1})
		rec := httptest.NewRecorder()

		err := h.HandleGetSchemas(ctx, rec, req)

		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":401`)
	})
}

func TestHandleGetSchemas_success(t *testing.T) {
	h := New(fakeAccessControl{}, nil)
	ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgID: 1})
	rec := httptest.NewRecorder()

	err := h.HandleGetSchemas(ctx, rec, &app.CustomRouteRequest{
		ResourceIdentifier: resource.FullIdentifier{Namespace: "default"},
	})

	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "IntegrationTypeSchemaList")
}
