//go:build ignore
// +build ignore

package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/grafana/grafana/pkg/build"
)

func main() {
	log.SetOutput(os.Stdout)
	log.SetFlags(0)
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{})))
	os.Exit(build.RunCmd())
}
