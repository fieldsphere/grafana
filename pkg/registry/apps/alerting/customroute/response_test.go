package customroute

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestWithAPIStatusErrorResponse(t *testing.T) {
	call := func(handlerErr error) (*httptest.ResponseRecorder, error) {
		rec := httptest.NewRecorder()
		err := WithAPIStatusErrorResponse(func(context.Context, app.CustomRouteResponseWriter, *app.CustomRouteRequest) error {
			return handlerErr
		})(context.Background(), rec, &app.CustomRouteRequest{})
		return rec, err
	}

	t.Run("writes a client error and stops returning it", func(t *testing.T) {
		rec, err := call(apierrors.NewBadRequest("invalid query"))
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))
		assert.Contains(t, rec.Body.String(), "invalid query")
		assert.Contains(t, rec.Body.String(), `"code":400`)
	})

	t.Run("writes unauthorized instead of returning it", func(t *testing.T) {
		rec, err := call(apierrors.NewUnauthorized("authentication required"))
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":401`)
	})

	t.Run("unwraps a wrapped client error", func(t *testing.T) {
		rec, err := call(fmt.Errorf("context: %w", apierrors.NewNotFound(schema.GroupResource{Resource: "receivers"}, "x")))
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})

	t.Run("returns a server error untouched", func(t *testing.T) {
		in := apierrors.NewInternalError(errors.New("boom"))
		rec, err := call(in)
		require.Equal(t, in, err)
		assert.Equal(t, http.StatusOK, rec.Code, "nothing should be written")
	})

	t.Run("returns a non-status error untouched", func(t *testing.T) {
		in := errors.New("plain")
		_, err := call(in)
		require.Equal(t, in, err)
	})

	t.Run("passes success through", func(t *testing.T) {
		_, err := call(nil)
		require.NoError(t, err)
	})
}
