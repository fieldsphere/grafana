package es

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type VersionInfo struct {
	BuildFlavor string `json:"build_flavor"`
}

// ClusterInfo represents Elasticsearch cluster information returned from the root endpoint.
// It is used to determine cluster capabilities and configuration like whether the cluster is serverless.
type ClusterInfo struct {
	Version VersionInfo `json:"version"`
}

const (
	BuildFlavorServerless = "serverless"
)

// GetClusterInfo fetches cluster information from the Elasticsearch root endpoint.
// It returns the cluster build flavor which is used to determine if the cluster is serverless.
func GetClusterInfo(httpCli *http.Client, url string) (clusterInfo ClusterInfo, err error) {
	resp, err := httpCli.Get(url)
	if err != nil {
		return ClusterInfo{}, fmt.Errorf("error getting ES cluster info: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		body, readErr := io.ReadAll(resp.Body)
		if readErr != nil || len(body) == 0 {
			return ClusterInfo{}, fmt.Errorf("unexpected status code %d getting ES cluster info", resp.StatusCode)
		}
		return ClusterInfo{}, fmt.Errorf("Elasticsearch error (status %d) getting ES cluster info: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing response body: %w", closeErr)
		}
	}()

	err = json.NewDecoder(resp.Body).Decode(&clusterInfo)
	if err != nil {
		return ClusterInfo{}, fmt.Errorf("error decoding ES cluster info: %w", err)
	}

	return clusterInfo, nil
}

func (ci ClusterInfo) IsServerless() bool {
	return ci.Version.BuildFlavor == BuildFlavorServerless
}
