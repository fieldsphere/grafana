package e2eutil

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"
)

const timeout = 60

type GrafanaServer struct {
	Port int
	Host string
}

func Server(host string, port int) *GrafanaServer {
	return &GrafanaServer{
		Host: host,
		Port: port,
	}
}

func (g *GrafanaServer) Wait() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	timeoutExceeded := time.After(timeout * time.Second)

	for {
		select {
		case <-timeoutExceeded:
			slog.Error("Grafana server failed to start before timeout", "timeoutSeconds", timeout)
			os.Exit(1)

		case <-ticker.C:
			url := fmt.Sprintf("http://%s:%d", g.Host, g.Port)
			//nolint:gosec
			resp, err := http.Get(url)
			if err == nil {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					slog.Error("Failed to read response body", "error", err)
					return
				}
				slog.Info("Connected to grafana-server")
				if resp.StatusCode < 200 || resp.StatusCode >= 300 {
					slog.Error("Grafana server unhealthy response", "statusCode", resp.StatusCode, "responseBody", string(body))
					os.Exit(1)
				}
				err = resp.Body.Close()
				if err != nil {
					slog.Warn("Error closing response body", "responseBody", string(body), "error", err)
					return
				}
				return
			}
			slog.Debug("Failed attempt to connect to grafana-server, retrying", "url", url, "error", err)
		}
	}
}
