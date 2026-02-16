package clients

import "encoding/base64"

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
