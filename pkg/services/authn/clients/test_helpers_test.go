package clients

import (
	"encoding/base64"

	"github.com/grafana/grafana/pkg/components/satokengen"
)

// Shared helpers used across authn client package tests.
// Keep reusable test utilities here so no test file depends on another test file's local helper declarations.

func boolPtr(b bool) *bool {
	return &b
}

func intPtr(n int64) *int64 {
	return &n
}

func stringPtr(s string) *string {
	return &s
}

func encodeBasicAuth(username, password string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(username+":"+password))
}

func mustGenAPIKey() (string, string) {
	res, err := satokengen.New("test")
	if err != nil {
		panic("failed to generate API key test secret: " + err.Error())
	}
	return res.ClientSecret, res.HashedKey
}
