package clients

import "encoding/base64"

func boolPtr(b bool) *bool {
	return &b
}

func encodeBasicAuth(username, password string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(username+":"+password))
}
