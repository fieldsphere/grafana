//go:build ignore
// +build ignore

package main

import (
	"log/slog"
	"os"

	"github.com/grafana/grafana/pkg/build"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{})))
	os.Exit(build.RunCmd())
}
