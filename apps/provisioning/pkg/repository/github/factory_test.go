package github

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
)

func TestFactoryNewUsesDefaultTimeout(t *testing.T) {
	tests := []struct {
		name  string
		token common.RawSecureValue
	}{
		{
			name: "anonymous client",
		},
		{
			name:  "token client",
			token: common.RawSecureValue("token"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := ProvideFactory().New(context.Background(), tt.token)

			ghClient, ok := client.(*githubClient)
			require.True(t, ok)
			require.Equal(t, defaultGitHubClientTimeout, ghClient.gh.Client().Timeout)
		})
	}
}

func TestFactoryNewPreservesInjectedClient(t *testing.T) {
	customClient := &http.Client{Timeout: time.Second}
	factory := ProvideFactory()
	factory.Client = customClient

	client := factory.New(context.Background(), "")

	ghClient, ok := client.(*githubClient)
	require.True(t, ok)
	require.Equal(t, customClient.Timeout, ghClient.gh.Client().Timeout)
}
