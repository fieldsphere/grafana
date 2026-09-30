package receiver

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana-app-sdk/resource"

	"github.com/grafana/grafana/apps/alerting/notifications/pkg/apis/alertingnotifications/v1beta1"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/notifier"
	"github.com/grafana/grafana/pkg/services/user"
)

func TestValidateCreateReceiverIntegrationTestRequestBody(t *testing.T) {
	testCases := []struct {
		name        string
		receiverUID string
		body        v1beta1.CreateReceiverIntegrationTestRequestBody
		expectError string
	}{
		{
			name:        "new receiver with integration UID should fail",
			receiverUID: "",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Uid:      new("integration-uid"),
					Type:     "slack",
					Settings: map[string]any{},
				},
			},
			expectError: "integration UID must be empty when testing a new receiver",
		},
		{
			name:        "new receiver with secure fields should fail",
			receiverUID: "",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:         "slack",
					Settings:     map[string]any{},
					SecureFields: map[string]bool{"token": true},
				},
			},
			expectError: "integration must not have secure fields when testing a new receiver",
		},
		{
			name:        "new integration without UID but with secure fields should fail",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:         "slack",
					Settings:     map[string]any{},
					SecureFields: map[string]bool{"token": true},
				},
			},
			expectError: "integration must have a UID to be tested with patched secure settings",
		},
		{
			name:        "new integration with empty UID and secure fields should fail",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Uid:          new(""),
					Type:         "slack",
					Settings:     map[string]any{},
					SecureFields: map[string]bool{"token": true},
				},
			},
			expectError: "integration must have a UID to be tested with patched secure settings",
		},
		{
			name:        "valid new receiver with full integration",
			receiverUID: "",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:     "slack",
					Settings: map[string]any{"url": "https://slack.com/webhook"},
				},
			},
			expectError: "",
		},
		{
			name:        "valid existing receiver with new integration",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:     "slack",
					Settings: map[string]any{"url": "https://slack.com/webhook"},
				},
			},
			expectError: "",
		},
		{
			name:        "valid existing receiver with patched integration (has UID and secure fields)",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Uid:          new("integration-uid"),
					Type:         "slack",
					Settings:     map[string]any{"url": "https://slack.com/webhook"},
					SecureFields: map[string]bool{"token": true},
				},
			},
			expectError: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateCreateReceiverIntegrationTestRequestBody(tc.receiverUID, tc.body)
			if tc.expectError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectError)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestTestReceiver(t *testing.T) {
	uid := func(s string) *string { return &s }

	testCases := []struct {
		name              string
		receiverUID       string
		body              v1beta1.CreateReceiverIntegrationTestRequestBody
		expectedMethod    string
		expectedAssertion func(t *testing.T, call testingServiceCall)
		expectError       bool
	}{
		{
			name:        "uses TestNewReceiverIntegration when new receiver and integration provided",
			receiverUID: "",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:     "slack",
					Settings: map[string]any{"url": "https://slack.com/webhook"},
				},
				Alert: v1beta1.CreateReceiverIntegrationTestRequestAlert{
					Labels: map[string]string{"alertname": "test"},
				},
			},
			expectedMethod: "TestNewReceiverIntegration",
			expectedAssertion: func(t *testing.T, call testingServiceCall) {
				assert.Equal(t, "slack", string(call.integration.Config.Type()))
				assert.Equal(t, map[string]string{"alertname": "test"}, call.alert.Labels)
			},
		},
		{
			name:        "uses TestNewReceiverIntegration with placeholder receiver UID",
			receiverUID: newReceiverNamePlaceholder,
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:     "slack",
					Settings: map[string]any{"url": "https://slack.com/webhook"},
				},
				Alert: v1beta1.CreateReceiverIntegrationTestRequestAlert{
					Labels: map[string]string{"alertname": "test"},
				},
			},
			expectedMethod: "TestNewReceiverIntegration",
			expectedAssertion: func(t *testing.T, call testingServiceCall) {
				assert.Equal(t, "slack", string(call.integration.Config.Type()))
			},
		},
		{
			name:        "uses PatchIntegrationAndTest when existing receiver with integration provided",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Uid:          uid("integration-uid"),
					Type:         "slack",
					Settings:     map[string]any{"url": "https://slack.com/webhook"},
					SecureFields: map[string]bool{"token": true},
				},
				Alert: v1beta1.CreateReceiverIntegrationTestRequestAlert{
					Labels: map[string]string{"alertname": "test"},
				},
			},
			expectedMethod: "PatchIntegrationAndTest",
			expectedAssertion: func(t *testing.T, call testingServiceCall) {
				assert.Equal(t, "receiver-uid", call.receiverUID)
				assert.Equal(t, "integration-uid", call.integration.UID)
				assert.Equal(t, "slack", string(call.integration.Config.Type()))
				assert.Equal(t, []string{"token"}, call.requiredSecret)
			},
		},
		{
			name:        "uses PatchIntegrationAndTest when existing receiver with new integration (no UID)",
			receiverUID: "receiver-uid",
			body: v1beta1.CreateReceiverIntegrationTestRequestBody{
				Integration: v1beta1.CreateReceiverIntegrationTestRequestIntegration{
					Type:     "slack",
					Settings: map[string]any{"url": "https://slack.com/webhook"},
				},
				Alert: v1beta1.CreateReceiverIntegrationTestRequestAlert{
					Labels: map[string]string{"alertname": "test"},
				},
			},
			expectedMethod: "PatchIntegrationAndTest",
			expectedAssertion: func(t *testing.T, call testingServiceCall) {
				assert.Equal(t, "receiver-uid", call.receiverUID)
				assert.Empty(t, call.integration.UID)
				assert.Equal(t, "slack", string(call.integration.Config.Type()))
				assert.Empty(t, call.requiredSecret)
			},
		},
		{
			name:        "returns error when validation fails",
			receiverUID: "receiver-uid",
			body:        v1beta1.CreateReceiverIntegrationTestRequestBody{},
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			fake := &fakeTestingService{}
			handler := New(fake)

			testUser := &user.SignedInUser{OrgID: 1, UserID: 1}
			_, err := handler.TestReceiver(context.Background(), testUser, tc.receiverUID, tc.body)

			if tc.expectError {
				require.Error(t, err)
				assert.Empty(t, fake.calls)
				return
			}

			require.NoError(t, err)
			require.Len(t, fake.calls, 1)
			assert.Equal(t, tc.expectedMethod, fake.calls[0].method)
			if tc.expectedAssertion != nil {
				tc.expectedAssertion(t, fake.calls[0])
			}
		})
	}
}

type fakeTestingService struct {
	calls []testingServiceCall
}

type testingServiceCall struct {
	method         string
	receiverUID    string
	integration    models.Integration
	requiredSecret []string
	alert          notifier.Alert
}

func (f *fakeTestingService) TestNewReceiverIntegration(_ context.Context, _ identity.Requester, alert notifier.Alert, integration models.Integration) (notifier.IntegrationTestResult, error) {
	f.calls = append(f.calls, testingServiceCall{
		method:      "TestNewReceiverIntegration",
		integration: integration,
		alert:       alert,
	})
	return notifier.IntegrationTestResult{}, nil
}

func (f *fakeTestingService) PatchIntegrationAndTest(_ context.Context, _ identity.Requester, alert notifier.Alert, receiverUID string, integration models.Integration, requiredSecrets []string) (notifier.IntegrationTestResult, error) {
	f.calls = append(f.calls, testingServiceCall{
		method:         "PatchIntegrationAndTest",
		receiverUID:    receiverUID,
		integration:    integration,
		requiredSecret: requiredSecrets,
		alert:          alert,
	})
	return notifier.IntegrationTestResult{}, nil
}

func TestHandleReceiverTestingRequest_clientErrorsKeepStatus(t *testing.T) {
	handler := New(&fakeTestingService{})

	t.Run("unauthorized when no user in context", func(t *testing.T) {
		rec := httptest.NewRecorder()
		err := handler.HandleReceiverTestingRequest(context.Background(), rec, &app.CustomRouteRequest{
			ResourceIdentifier: resource.FullIdentifier{Name: newReceiverNamePlaceholder},
			Body:               io.NopCloser(strings.NewReader(`{}`)),
		})
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":401`)
		assert.Contains(t, rec.Body.String(), "authentication required")
	})

	t.Run("bad request for invalid json", func(t *testing.T) {
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgID: 1})
		rec := httptest.NewRecorder()
		err := handler.HandleReceiverTestingRequest(ctx, rec, &app.CustomRouteRequest{
			ResourceIdentifier: resource.FullIdentifier{Name: newReceiverNamePlaceholder},
			Body:               io.NopCloser(strings.NewReader(`{`)),
		})
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":400`)
	})

	t.Run("bad request for invalid integration", func(t *testing.T) {
		ctx := identity.WithRequester(context.Background(), &identity.StaticRequester{OrgID: 1})
		rec := httptest.NewRecorder()
		body := `{"integration":{"uid":"integration-uid","type":"slack","settings":{}},"alert":{"labels":{"alertname":"test"}}}`
		err := handler.HandleReceiverTestingRequest(ctx, rec, &app.CustomRouteRequest{
			ResourceIdentifier: resource.FullIdentifier{Name: newReceiverNamePlaceholder},
			Body:               io.NopCloser(strings.NewReader(body)),
		})
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), `"code":400`)
		assert.Contains(t, rec.Body.String(), "integration UID must be empty")
	})
}
