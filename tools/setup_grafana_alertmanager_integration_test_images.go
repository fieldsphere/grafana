package main

import (
	"log/slog"
	"os"
	"os/exec"
	"sync"

	amtests "github.com/grafana/grafana/pkg/tests/alertmanager"
)

func docker(args []string) {
	cmd := exec.Command("docker", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		slog.Error("Docker command failed", "args", args, "error", err)
		os.Exit(1)
	}
}

func main() {
	var wg sync.WaitGroup

	for _, cmd := range [][]string{
		{"pull", amtests.GetGrafanaImage()},
		{"pull", amtests.GetLokiImage()},
		{"pull", amtests.GetPostgresImage()},
		{"build", "-t", "webhook-receiver", "devenv/docker/blocks/stateful_webhook"},
	} {
		wg.Add(1)

		go func(cmd []string) {
			defer wg.Done()

			docker(cmd)
		}(cmd)
	}

	wg.Wait()
}
