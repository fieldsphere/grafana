package clients

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	claims "github.com/grafana/authlib/types"
	"github.com/grafana/grafana/pkg/components/satokengen"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/apikey"
	"github.com/grafana/grafana/pkg/services/apikey/apikeytest"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/org"
)

var (
	revoked      = true
	secret, hash = genApiKey()
)

const (
	asyncHookWaitTimeout = 200 * time.Millisecond

	maxInt64APIKeyIDString                      = "9223372036854775807"
	maxInt64APIKeyIDWithWhitespace              = " " + maxInt64APIKeyIDString + " "
	maxInt64APIKeyIDWithControlWhitespace       = "\n" + maxInt64APIKeyIDString + "\t"
	overflowInt64APIKeyIDString                 = "9223372036854775808"
	signedAPIKeyIDString                        = "+123"
	signedAPIKeyIDWithWhitespace                = " " + signedAPIKeyIDString + " "
	signedAPIKeyIDWithControlWhitespace         = "\n" + signedAPIKeyIDString + "\t"
	arabicIndicAPIKeyIDString                   = "١٢٣"
	fullwidthAPIKeyIDString                     = "１２３"
	leadingZeroAPIKeyIDString                   = "000123"
	internalWhitespaceAPIKeyIDString            = "12 3"
	baseAPIKeyIDString                          = "123"
	parsedAPIKeyIDValue                   int64 = 123
	maxInt64APIKeyIDValue                 int64 = 9223372036854775807
)

func waitForUpdateCall(t *testing.T, service *updateLastUsedService) {
	t.Helper()

	select {
	case <-service.calledCh:
	case <-time.After(asyncHookWaitTimeout):
		t.Fatal("expected UpdateAPIKeyLastUsedDate to be called")
	}
}

func assertNoUpdateCall(t *testing.T, service *updateLastUsedService) {
	t.Helper()

	select {
	case <-service.calledCh:
		t.Fatal("expected UpdateAPIKeyLastUsedDate to not be called")
	case <-time.After(asyncHookWaitTimeout):
	}
}

func assertUpdatedID(t *testing.T, service *updateLastUsedService, expectedID int64) {
	t.Helper()
	assert.Equal(t, expectedID, service.updatedAPIKeyID)
}

func assertHookUpdate(t *testing.T, hookCtx context.Context, client *APIKey, req *authn.Request, service *updateLastUsedService, expectedID int64) {
	t.Helper()

	err := client.Hook(hookCtx, nil, req)
	assert.NoError(t, err)
	waitForUpdateCall(t, service)
	assertUpdatedID(t, service, expectedID)
}

func assertHookNoUpdate(t *testing.T, hookCtx context.Context, client *APIKey, req *authn.Request, service *updateLastUsedService) {
	t.Helper()

	err := client.Hook(hookCtx, nil, req)
	assert.NoError(t, err)
	assertNoUpdateCall(t, service)
}

func assertHookNoUpdateForKeyID(t *testing.T, hookCtx context.Context, client *APIKey, keyID string, shouldSkipLastUsed bool, service *updateLastUsedService) {
	t.Helper()

	assertHookNoUpdate(t, hookCtx, client, newHookRequestWithMeta(keyID, shouldSkipLastUsed), service)
}

func newHookRequestWithMeta(keyID string, shouldSkipLastUsed bool) *authn.Request {
	req := &authn.Request{}
	if keyID != "" {
		req.SetMeta(metaKeyID, keyID)
	}
	if shouldSkipLastUsed {
		req.SetMeta(metaKeySkipLastUsed, "true")
	}

	return req
}

func mustParseAPIKeyID(t *testing.T, keyID string) int64 {
	t.Helper()

	parsedAPIKeyID, err := strconv.ParseInt(strings.TrimSpace(keyID), 10, 64)
	if err != nil {
		t.Fatalf("expected parseable API key ID %q: %v", keyID, err)
	}

	return parsedAPIKeyID
}

func assertHookUpdateForKeyID(t *testing.T, hookCtx context.Context, client *APIKey, keyID string, service *updateLastUsedService) {
	t.Helper()

	assertHookUpdate(t, hookCtx, client, newHookRequestWithMeta(keyID, false), service, mustParseAPIKeyID(t, keyID))
}

func TestAPIKey_Authenticate(t *testing.T) {
	type TestCase struct {
		desc             string
		req              *authn.Request
		expectedKey      *apikey.APIKey
		expectedErr      error
		expectedIdentity *authn.Identity
	}

	tests := []TestCase{
		{
			desc: "should fail for valid token that is not connected to a service account",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"Bearer " + secret},
				},
			}},
			expectedKey: &apikey.APIKey{
				ID:    1,
				OrgID: 1,
				Key:   hash,
				Role:  org.RoleAdmin,
			},
			expectedErr: errAPIKeyInvalid,
		},
		{
			desc: "should success for valid token that is connected to service account",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"Bearer " + secret},
				},
			}},
			expectedKey: &apikey.APIKey{
				ID:               1,
				OrgID:            1,
				Key:              hash,
				ServiceAccountId: intPtr(1),
			},
			expectedIdentity: &authn.Identity{
				ID:    "1",
				Type:  claims.TypeServiceAccount,
				OrgID: 1,
				ClientParams: authn.ClientParams{
					FetchSyncedUser: true,
					SyncPermissions: true,
				},
				AuthenticatedBy: login.APIKeyAuthModule,
			},
		},
		{
			desc: "should fail for expired api key",
			req:  &authn.Request{HTTPRequest: &http.Request{Header: map[string][]string{"Authorization": {"Bearer " + secret}}}},
			expectedKey: &apikey.APIKey{
				Key:     hash,
				Expires: intPtr(0),
			},
			expectedErr: errAPIKeyExpired,
		},
		{
			desc: "should fail for revoked api key",
			req:  &authn.Request{HTTPRequest: &http.Request{Header: map[string][]string{"Authorization": {"Bearer " + secret}}}},
			expectedKey: &apikey.APIKey{
				Key:       hash,
				IsRevoked: &revoked,
			},
			expectedErr: errAPIKeyRevoked,
		},
		{
			desc: "should fail for api key in another organization",
			req:  &authn.Request{OrgID: 1, HTTPRequest: &http.Request{Header: map[string][]string{"Authorization": {"Bearer " + secret}}}},
			expectedKey: &apikey.APIKey{
				ID:               1,
				OrgID:            2,
				Key:              hash,
				ServiceAccountId: intPtr(1),
			},
			expectedErr: errAPIKeyOrgMismatch,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			c := ProvideAPIKey(&apikeytest.Service{ExpectedAPIKey: tt.expectedKey}, tracing.InitializeTracerForTest())

			identity, err := c.Authenticate(context.Background(), tt.req)
			if tt.expectedErr != nil {
				assert.Nil(t, identity)
				assert.ErrorIs(t, err, tt.expectedErr)
				return
			}

			assert.NoError(t, err)
			assert.EqualValues(t, *tt.expectedIdentity, *identity)
			assert.Equal(t, tt.req.OrgID, tt.expectedIdentity.OrgID, "the request organization should match the identity's one")
		})
	}
}

func TestAPIKey_AuthenticateWithNilRequest(t *testing.T) {
	client := ProvideAPIKey(&apikeytest.Service{}, tracing.InitializeTracerForTest())

	identity, err := client.Authenticate(context.Background(), nil)
	assert.Nil(t, identity)
	assert.Error(t, err)
	assert.ErrorContains(t, err, errorMessageAPIKeyRequestIsNil)
}

func TestAPIKey_AuthenticateWithNilTracerAndNilRequest(t *testing.T) {
	client := ProvideAPIKey(&apikeytest.Service{}, nil)

	identity, err := client.Authenticate(context.Background(), nil)
	assert.Nil(t, identity)
	assert.Error(t, err)
	assert.ErrorContains(t, err, errorMessageAPIKeyRequestIsNil)
}

func TestAPIKey_AuthenticateWithNilContextAndNilRequest(t *testing.T) {
	client := ProvideAPIKey(&apikeytest.Service{}, nil)

	identity, err := client.Authenticate(nil, nil)
	assert.Nil(t, identity)
	assert.Error(t, err)
	assert.ErrorContains(t, err, errorMessageAPIKeyRequestIsNil)
}

func TestAPIKey_AuthenticateWithNilContextAndEmptyRequest(t *testing.T) {
	client := ProvideAPIKey(&apikeytest.Service{}, nil)

	identity, err := client.Authenticate(nil, &authn.Request{})
	assert.Nil(t, identity)
	assert.Error(t, err)
}

func TestAPIKey_AuthenticateWithNilTracer(t *testing.T) {
	client := ProvideAPIKey(&apikeytest.Service{
		ExpectedAPIKey: &apikey.APIKey{
			ID:               1,
			OrgID:            1,
			Key:              hash,
			ServiceAccountId: intPtr(1),
		},
	}, nil)

	req := &authn.Request{
		HTTPRequest: &http.Request{
			Header: map[string][]string{
				"Authorization": {"Bearer " + secret},
			},
		},
	}

	identity, err := client.Authenticate(context.Background(), req)
	assert.NoError(t, err)
	if assert.NotNil(t, identity) {
		assert.Equal(t, "1", identity.ID)
		assert.Equal(t, claims.TypeServiceAccount, identity.Type)
		assert.Equal(t, int64(1), identity.OrgID)
		assert.Equal(t, login.APIKeyAuthModule, identity.AuthenticatedBy)
	}
}

func TestAPIKey_Test(t *testing.T) {
	type TestCase struct {
		desc     string
		req      *authn.Request
		expected bool
	}

	tests := []TestCase{
		{
			desc: "should succeed when api key is provided in Authorization header as bearer token",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"Bearer 123123"},
				},
			}},
			expected: true,
		},
		{
			desc: "should succeed when api key is provided in Authorization header as basic auth and api_key as username",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {encodeBasicAuth("api_key", "test")},
				},
			}},
			expected: true,
		},
		{
			desc:     "should fail when no http request is passed",
			req:      &authn.Request{},
			expected: false,
		},
		{
			desc:     "should fail when request is nil",
			req:      nil,
			expected: false,
		},
		{
			desc: "should fail when no there is no Authorization header",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{},
			}},
			expected: false,
		},
		{
			desc: "should fail when Authorization header is not prefixed with Basic or Bearer",
			req: &authn.Request{HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"test"},
				},
			}},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			c := ProvideAPIKey(&apikeytest.Service{}, tracing.InitializeTracerForTest())
			assert.Equal(t, tt.expected, c.Test(context.Background(), tt.req))
		})
	}
}

func TestAPIKey_getTokenFromRequest(t *testing.T) {
	t.Run("should return empty token for nil request", func(t *testing.T) {
		assert.Equal(t, "", getTokenFromRequest(nil))
	})

	t.Run("should return empty token for request without http request", func(t *testing.T) {
		assert.Equal(t, "", getTokenFromRequest(&authn.Request{}))
	})

	t.Run("should return bearer token when present", func(t *testing.T) {
		req := &authn.Request{
			HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"Bearer token123"},
				},
			},
		}

		assert.Equal(t, "token123", getTokenFromRequest(req))
	})

	t.Run("should return token from basic auth when username is api_key", func(t *testing.T) {
		req := &authn.Request{
			HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {encodeBasicAuth("api_key", "basicToken")},
				},
			},
		}

		assert.Equal(t, "basicToken", getTokenFromRequest(req))
	})

	t.Run("should return empty token from basic auth when username is not api_key", func(t *testing.T) {
		req := &authn.Request{
			HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {encodeBasicAuth("user", "basicToken")},
				},
			},
		}

		assert.Equal(t, "", getTokenFromRequest(req))
	})

	t.Run("should return empty token for malformed basic auth header", func(t *testing.T) {
		req := &authn.Request{
			HTTPRequest: &http.Request{
				Header: map[string][]string{
					"Authorization": {"Basic not-base64"},
				},
			},
		}

		assert.Equal(t, "", getTokenFromRequest(req))
	})
}

func TestAPIKey_syncAPIKeyLastUsed(t *testing.T) {
	t.Run("should update last used for valid key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(baseAPIKeyIDString)

		assert.True(t, service.called)
		assertUpdatedID(t, service, parsedAPIKeyIDValue)
	})

	t.Run("should update last used for valid key id with surrounding whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(" 123 ")

		assert.True(t, service.called)
		assertUpdatedID(t, service, parsedAPIKeyIDValue)
	})

	t.Run("should update last used for valid key id with surrounding control whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("\n123\t")

		assert.True(t, service.called)
		assertUpdatedID(t, service, parsedAPIKeyIDValue)
	})

	t.Run("should update last used for valid key id with leading zeros", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(leadingZeroAPIKeyIDString)

		assert.True(t, service.called)
		assertUpdatedID(t, service, parsedAPIKeyIDValue)
	})

	t.Run("should update last used for max int64 key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(maxInt64APIKeyIDString)

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should update last used for max int64 key id with surrounding whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(maxInt64APIKeyIDWithWhitespace)

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should update last used for max int64 key id with surrounding control whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(maxInt64APIKeyIDWithControlWhitespace)

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should update last used for max int64 key id with control-character whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("\n" + maxInt64APIKeyIDString + "\t")

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should still attempt update when service returns error", func(t *testing.T) {
		service := &updateLastUsedService{
			Service: apikeytest.Service{
				ExpectedError: errors.New("update failed"),
			},
		}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(" 123 ")

		assert.True(t, service.called)
		assertUpdatedID(t, service, parsedAPIKeyIDValue)
	})

	t.Run("should still attempt update when service returns error for max int64 key id with surrounding whitespace", func(t *testing.T) {
		service := &updateLastUsedService{
			Service: apikeytest.Service{ExpectedError: errors.New("update failed")},
		}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(maxInt64APIKeyIDWithWhitespace)

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should still attempt update when service returns error for max int64 key id with surrounding control whitespace", func(t *testing.T) {
		service := &updateLastUsedService{
			Service: apikeytest.Service{ExpectedError: errors.New("update failed")},
		}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(maxInt64APIKeyIDWithControlWhitespace)

		assert.True(t, service.called)
		assertUpdatedID(t, service, maxInt64APIKeyIDValue)
	})

	t.Run("should skip update for invalid key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("bad-id")

		assert.False(t, service.called)
	})

	t.Run("should skip update for signed key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(signedAPIKeyIDString)

		assert.False(t, service.called)
	})

	t.Run("should skip update for signed key id with surrounding whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(signedAPIKeyIDWithWhitespace)

		assert.False(t, service.called)
	})

	t.Run("should skip update for signed key id with surrounding control whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(signedAPIKeyIDWithControlWhitespace)

		assert.False(t, service.called)
	})

	t.Run("should skip update for arabic-indic digit key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(arabicIndicAPIKeyIDString)

		assert.False(t, service.called)
	})

	t.Run("should skip update for fullwidth digit key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(fullwidthAPIKeyIDString)

		assert.False(t, service.called)
	})

	t.Run("should skip update for key id with internal whitespace", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(internalWhitespaceAPIKeyIDString)

		assert.False(t, service.called)
	})

	t.Run("should skip update for overflow key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed(overflowInt64APIKeyIDString)

		assert.False(t, service.called)
	})

	t.Run("should skip update for non-positive key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("-1")

		assert.False(t, service.called)
	})

	t.Run("should skip update for missing key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("")

		assert.False(t, service.called)
	})

	t.Run("should skip update for whitespace-only key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("   ")

		assert.False(t, service.called)
	})

	t.Run("should skip update for zero key id", func(t *testing.T) {
		service := &updateLastUsedService{}
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		client.syncAPIKeyLastUsed("0")

		assert.False(t, service.called)
	})
}

func TestAPIKey_parseAndValidateAPIKeyID(t *testing.T) {
	client := ProvideAPIKey(&updateLastUsedService{}, tracing.InitializeTracerForTest())

	testCases := []struct {
		name       string
		rawKeyID   string
		expectedID int64
		expectedOK bool
	}{
		{
			name:       "valid numeric id",
			rawKeyID:   baseAPIKeyIDString,
			expectedID: 123,
			expectedOK: true,
		},
		{
			name:       "valid numeric id with leading zeros",
			rawKeyID:   leadingZeroAPIKeyIDString,
			expectedID: 123,
			expectedOK: true,
		},
		{
			name:       "valid numeric id with surrounding whitespace",
			rawKeyID:   " 123 ",
			expectedID: 123,
			expectedOK: true,
		},
		{
			name:       "valid numeric id with control-character whitespace",
			rawKeyID:   "\n123\t",
			expectedID: 123,
			expectedOK: true,
		},
		{
			name:       "valid max int64 id",
			rawKeyID:   maxInt64APIKeyIDString,
			expectedID: maxInt64APIKeyIDValue,
			expectedOK: true,
		},
		{
			name:       "valid max int64 id with surrounding whitespace",
			rawKeyID:   maxInt64APIKeyIDWithWhitespace,
			expectedID: maxInt64APIKeyIDValue,
			expectedOK: true,
		},
		{
			name:       "valid max int64 id with surrounding control whitespace",
			rawKeyID:   maxInt64APIKeyIDWithControlWhitespace,
			expectedID: maxInt64APIKeyIDValue,
			expectedOK: true,
		},
		{
			name:       "valid max int64 id with control-character whitespace",
			rawKeyID:   "\n" + maxInt64APIKeyIDString + "\t",
			expectedID: maxInt64APIKeyIDValue,
			expectedOK: true,
		},
		{
			name:       "empty id",
			rawKeyID:   "",
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "whitespace-only id",
			rawKeyID:   "   ",
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "signed id",
			rawKeyID:   signedAPIKeyIDString,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "signed id with surrounding whitespace",
			rawKeyID:   signedAPIKeyIDWithWhitespace,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "signed id with surrounding control whitespace",
			rawKeyID:   signedAPIKeyIDWithControlWhitespace,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "overflow id",
			rawKeyID:   overflowInt64APIKeyIDString,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "non-ascii id",
			rawKeyID:   arabicIndicAPIKeyIDString,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "fullwidth digit id",
			rawKeyID:   fullwidthAPIKeyIDString,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "internal whitespace id",
			rawKeyID:   internalWhitespaceAPIKeyIDString,
			expectedID: 0,
			expectedOK: false,
		},
		{
			name:       "non-positive id",
			rawKeyID:   "0",
			expectedID: 0,
			expectedOK: false,
		},
	}

	validationSources := []string{validationSourceSync, validationSourceHook}
	for _, validationSource := range validationSources {
		validationSource := validationSource
		t.Run("validationSource="+validationSource, func(t *testing.T) {
			for _, tc := range testCases {
				tc := tc
				t.Run(tc.name, func(t *testing.T) {
					apiKeyID, ok := client.parseAndValidateAPIKeyID(tc.rawKeyID, validationSource)
					assert.Equal(t, tc.expectedOK, ok)
					assert.Equal(t, tc.expectedID, apiKeyID)
				})
			}
		})
	}
}

func TestAPIKey_Hook(t *testing.T) {
	t.Run("should call update when skip marker is absent", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, "456", service)
	})

	t.Run("should call update when tracer is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookUpdateForKeyID(t, context.Background(), client, "456", service)
	})

	t.Run("should call update when tracer and context are nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookUpdateForKeyID(t, nil, client, "456", service)
	})

	t.Run("should handle nil context when skip marker is absent", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, nil, client, "457", service)
	})

	t.Run("should trim key id metadata before update", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, " 458 ", service)
	})

	t.Run("should trim control whitespace in key id metadata before update", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, "\n459\t", service)
	})

	t.Run("should update when key id metadata has leading zeros", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, leadingZeroAPIKeyIDString, service)
	})

	t.Run("should update when key id is max int64", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, maxInt64APIKeyIDString, service)
	})

	t.Run("should update when key id is max int64 with surrounding whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, maxInt64APIKeyIDWithWhitespace, service)
	})

	t.Run("should update when key id is max int64 with surrounding control whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, maxInt64APIKeyIDWithControlWhitespace, service)
	})

	t.Run("should update when key id is max int64 with surrounding control whitespace and nil tracer/context", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookUpdateForKeyID(t, nil, client, maxInt64APIKeyIDWithControlWhitespace, service)
	})

	t.Run("should update when key id is max int64 with control-character whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, "\n"+maxInt64APIKeyIDString+"\t", service)
	})

	t.Run("should skip update when skip marker is present", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "456", true, service)
	})

	t.Run("should skip update when skip marker is present and context is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, nil, client, "456", true, service)
	})

	t.Run("should skip update when skip marker is present with nil tracer and context", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookNoUpdateForKeyID(t, nil, client, "456", true, service)
	})

	t.Run("should skip update when key id is invalid", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "bad-id", false, service)
	})

	t.Run("should skip update when key id is invalid and tracer is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookNoUpdateForKeyID(t, context.Background(), client, "bad-id", false, service)
	})

	t.Run("should skip update when key id is invalid and context is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, nil, client, "bad-id", false, service)
	})

	t.Run("should skip update when key id contains a sign", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, signedAPIKeyIDString, false, service)
	})

	t.Run("should skip update when key id contains a sign with surrounding whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, signedAPIKeyIDWithWhitespace, false, service)
	})

	t.Run("should skip update when key id contains a sign with surrounding control whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, signedAPIKeyIDWithControlWhitespace, false, service)
	})

	t.Run("should skip update when key id contains a sign with surrounding control whitespace and nil tracer/context", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)
		assertHookNoUpdateForKeyID(t, nil, client, signedAPIKeyIDWithControlWhitespace, false, service)
	})

	t.Run("should skip update when key id uses arabic-indic digits", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, arabicIndicAPIKeyIDString, false, service)
	})

	t.Run("should skip update when key id uses fullwidth digits", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, fullwidthAPIKeyIDString, false, service)
	})

	t.Run("should skip update when key id metadata has internal whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, internalWhitespaceAPIKeyIDString, false, service)
	})

	t.Run("should skip update when key id overflows int64", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, overflowInt64APIKeyIDString, false, service)
	})

	t.Run("should skip update when key id is non-positive", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "-1", false, service)
	})

	t.Run("should skip update when key id is zero", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "0", false, service)
	})

	t.Run("should skip update when key id is missing", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "", false, service)
	})

	t.Run("should skip update when key id metadata is whitespace only", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookNoUpdateForKeyID(t, context.Background(), client, "   ", false, service)
	})

	t.Run("should skip missing key id before panic-capable update service", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.panicValue = "boom"
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		assertHookNoUpdateForKeyID(t, context.Background(), client, "", false, service)
		assert.False(t, service.called)
	})

	t.Run("should recover when update service panics", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.panicValue = "boom"
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, "789", service)
	})

	t.Run("should skip update and avoid panic when skip marker is present", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.panicValue = "boom"
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		assertHookNoUpdateForKeyID(t, context.Background(), client, "789", true, service)
	})

	t.Run("should continue when update returns an error", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.ExpectedError = errors.New("update failed")
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, "987", service)
	})

	t.Run("should continue when update returns an error for max int64 key id with surrounding whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.ExpectedError = errors.New("update failed")
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, maxInt64APIKeyIDWithWhitespace, service)
	})

	t.Run("should continue when update returns an error for max int64 key id with surrounding whitespace and nil tracer/context", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.ExpectedError = errors.New("update failed")
		client := ProvideAPIKey(service, nil)
		assertHookUpdateForKeyID(t, nil, client, maxInt64APIKeyIDWithWhitespace, service)
	})

	t.Run("should continue when update returns an error for max int64 key id with surrounding control whitespace", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.ExpectedError = errors.New("update failed")
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		assertHookUpdateForKeyID(t, context.Background(), client, maxInt64APIKeyIDWithControlWhitespace, service)
	})

	t.Run("should continue when update returns an error for max int64 key id with surrounding control whitespace and nil tracer/context", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.ExpectedError = errors.New("update failed")
		client := ProvideAPIKey(service, nil)
		assertHookUpdateForKeyID(t, nil, client, maxInt64APIKeyIDWithControlWhitespace, service)
	})

	t.Run("should return immediately while async update is blocked", func(t *testing.T) {
		service := newUpdateLastUsedService()
		service.blockCh = make(chan struct{})
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())
		req := newHookRequestWithMeta("654", false)

		doneCh := make(chan error, 1)
		go func() {
			doneCh <- client.Hook(context.Background(), nil, req)
		}()

		select {
		case err := <-doneCh:
			assert.NoError(t, err)
		case <-time.After(asyncHookWaitTimeout):
			t.Fatal("expected Hook to return without waiting for async update")
		}

		waitForUpdateCall(t, service)
		assertUpdatedID(t, service, int64(654))
		close(service.blockCh)
	})

	t.Run("should skip update when request is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		assertHookNoUpdate(t, context.Background(), client, nil, service)
	})

	t.Run("should skip update when request is nil and tracer is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)

		assertHookNoUpdate(t, context.Background(), client, nil, service)
	})

	t.Run("should skip update when both context and request are nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, tracing.InitializeTracerForTest())

		assertHookNoUpdate(t, nil, client, nil, service)
	})

	t.Run("should skip update when context and request are nil and tracer is nil", func(t *testing.T) {
		service := newUpdateLastUsedService()
		client := ProvideAPIKey(service, nil)

		assertHookNoUpdate(t, nil, client, nil, service)
	})
}

type updateLastUsedService struct {
	apikeytest.Service
	called          bool
	updatedAPIKeyID int64
	calledCh        chan struct{}
	panicValue      any
	blockCh         chan struct{}
}

func newUpdateLastUsedService() *updateLastUsedService {
	return &updateLastUsedService{
		calledCh: make(chan struct{}, 1),
	}
}

func (s *updateLastUsedService) UpdateAPIKeyLastUsedDate(ctx context.Context, tokenID int64) error {
	s.called = true
	s.updatedAPIKeyID = tokenID
	select {
	case s.calledCh <- struct{}{}:
	default:
	}
	if s.panicValue != nil {
		panic(s.panicValue)
	}
	if s.blockCh != nil {
		<-s.blockCh
	}
	return s.ExpectedError
}

func intPtr(n int64) *int64 {
	return &n
}

func boolPtr(b bool) *bool {
	return &b
}

func genApiKey() (string, string) {
	res, _ := satokengen.New("test")
	return res.ClientSecret, res.HashedKey
}

func encodeBasicAuth(username, password string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", username, password)))
}
