package generate_datasources

import (
	"net/http"
	"net/http/httptest"
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCanGetCompatibleDatasources(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var err error
		w.WriteHeader(http.StatusOK)
		// response for getting metadata for all datasources
		if r.URL.String() == allPluginsEndpoint() {
			_, err = w.Write([]byte(`{"items":[{"slug":"postgres"},{"slug":"frontendDatasource"}]}`))
		}
		// responses for specific datasource plugins
		if r.URL.String() == pluginEndpoint("postgres") {
			_, err = w.Write([]byte(`{"json":{"alerting":true,"backend":true}}`))
		}
		if r.URL.String() == pluginEndpoint("frontendDatasource") {
			_, err = w.Write([]byte(`{"json":{}}`))
		}
		require.NoError(t, err)
	}))
	defer server.Close()

	datasources, err := GetCompatibleDatasources(server.URL)

	require.NoError(t, err)

	expectedDatasources := []string{"postgres"} //nolint:prealloc
	expectedDatasources = append(expectedDatasources, grafanaDatasources...)
	sort.Strings(expectedDatasources)

	assert.Len(t, datasources, len(expectedDatasources))

	for i := range expectedDatasources {
		assert.Equal(t, expectedDatasources[i], datasources[i])
	}
}

func TestGetCompatibleDatasourcesReturnsErrorWhenListRequestFails(t *testing.T) {
	datasources, err := GetCompatibleDatasources("://invalid")

	require.Error(t, err)
	assert.Nil(t, datasources)
}

func TestGetDatasourcePluginSlugsReturnsErrorForInvalidJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.String() == allPluginsEndpoint() {
			_, err := w.Write([]byte(`not-json`))
			require.NoError(t, err)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	slugs, err := getDatasourcePluginSlugs(server.URL)

	require.Error(t, err)
	assert.Nil(t, slugs)
}

func TestGetDatasourcePluginSlugsReturnsErrorForInvalidURL(t *testing.T) {
	slugs, err := getDatasourcePluginSlugs("://invalid")

	require.Error(t, err)
	assert.Nil(t, slugs)
}

func TestGetCompatibleDatasourcesExcludesUnsupportedDatasource(t *testing.T) {
	origUnsupported := unsupportedDataSourcesMap
	unsupportedDataSourcesMap = map[string]bool{"postgres": true}
	t.Cleanup(func() {
		unsupportedDataSourcesMap = origUnsupported
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var err error
		w.WriteHeader(http.StatusOK)
		if r.URL.String() == allPluginsEndpoint() {
			_, err = w.Write([]byte(`{"items":[{"slug":"postgres"}]}`))
		}
		if r.URL.String() == pluginEndpoint("postgres") {
			_, err = w.Write([]byte(`{"json":{"alerting":true,"backend":true}}`))
		}
		require.NoError(t, err)
	}))
	defer server.Close()

	datasources, err := GetCompatibleDatasources(server.URL)
	require.NoError(t, err)

	expectedDatasources := append([]string{}, grafanaDatasources...)
	sort.Strings(expectedDatasources)

	assert.Equal(t, expectedDatasources, datasources)
	assert.NotContains(t, datasources, "postgres")
}
