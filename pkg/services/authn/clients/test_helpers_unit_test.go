package clients

import (
	"encoding/base64"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/components/satokengen"
)

func TestPtr(t *testing.T) {
	t.Parallel()

	number := ptr[int64](42)
	text := ptr[string]("hello")
	flag := ptr[bool](true)

	require.NotNil(t, number)
	require.NotNil(t, text)
	require.NotNil(t, flag)
	require.EqualValues(t, 42, *number)
	require.Equal(t, "hello", *text)
	require.True(t, *flag)
}

func TestPtrReturnsDistinctPointers(t *testing.T) {
	t.Parallel()

	first := ptr[int64](7)
	second := ptr[int64](7)

	require.NotNil(t, first)
	require.NotNil(t, second)
	require.NotSame(t, first, second)
	require.EqualValues(t, 7, *first)
	require.EqualValues(t, 7, *second)
}

func TestEncodeBasicAuth(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name     string
		username string
		password string
	}{
		{
			name:     "regular credentials",
			username: "api_key",
			password: "secret",
		},
		{
			name:     "empty password",
			username: "api_key",
			password: "",
		},
		{
			name:     "empty username",
			username: "",
			password: "secret",
		},
		{
			name:     "password with colon",
			username: "api_key",
			password: "sec:ret",
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			header := encodeBasicAuth(tc.username, tc.password)
			require.True(t, strings.HasPrefix(header, "Basic "))

			encoded := strings.TrimPrefix(header, "Basic ")
			decoded, err := base64.StdEncoding.DecodeString(encoded)
			require.NoError(t, err)
			require.Equal(t, tc.username+":"+tc.password, string(decoded))
		})
	}
}

func TestMustGenAPIKey(t *testing.T) {
	t.Parallel()

	var secret string
	var hash string
	require.NotPanics(t, func() {
		secret, hash = mustGenAPIKey()
	})

	require.NotEmpty(t, secret)
	require.NotEmpty(t, hash)
	require.NotEqual(t, secret, hash)
	require.True(t, strings.HasPrefix(secret, satokengen.GrafanaPrefix+"test_"))

	decoded, err := satokengen.Decode(secret)
	require.NoError(t, err)
	require.Equal(t, "test", decoded.ServiceID)
	require.NotEmpty(t, decoded.Checksum)

	regeneratedHash, err := decoded.Hash()
	require.NoError(t, err)
	require.Equal(t, hash, regeneratedHash)
}
