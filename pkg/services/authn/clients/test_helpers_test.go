package clients

import (
	"encoding/base64"

	"github.com/grafana/grafana/pkg/components/satokengen"
)

// Shared helpers used across authn client package tests.
// Keep reusable test utilities here so no test file depends on another test file's local helper declarations.

func ptr[T any](value T) *T {
	return &value
}

// encodeBasicAuth returns a Basic authorization header value for tests.
func encodeBasicAuth(username, password string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(username+":"+password))
}

// mustGenAPIKey creates deterministic API key fixtures for tests and fails fast if generation is unavailable.
func mustGenAPIKey() (string, string) {
	res, err := satokengen.New("test")
	if err != nil {
		panic("failed to generate API key test secret: " + err.Error())
	}
	return res.ClientSecret, res.HashedKey
}
