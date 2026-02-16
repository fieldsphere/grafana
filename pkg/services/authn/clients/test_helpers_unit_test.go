package clients

import (
	"encoding/base64"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
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

func TestEncodeBasicAuth(t *testing.T) {
	t.Parallel()

	header := encodeBasicAuth("api_key", "secret")
	require.True(t, strings.HasPrefix(header, "Basic "))

	encoded := strings.TrimPrefix(header, "Basic ")
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	require.NoError(t, err)
	require.Equal(t, "api_key:secret", string(decoded))
}

func TestMustGenAPIKey(t *testing.T) {
	t.Parallel()

	secret, hash := mustGenAPIKey()
	require.NotEmpty(t, secret)
	require.NotEmpty(t, hash)
	require.NotEqual(t, secret, hash)
}
