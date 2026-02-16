package clients

import (
	"encoding/base64"

	"github.com/grafana/grafana/pkg/components/satokengen"
)

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

func genApiKey() (string, string) {
	res, err := satokengen.New("test")
	if err != nil {
		panic(err)
	}
	return res.ClientSecret, res.HashedKey
}
