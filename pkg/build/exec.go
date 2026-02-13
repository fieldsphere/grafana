package build

import (
	"bytes"
	"log/slog"
	"os"
	"os/exec"
	"strings"
)

func runError(cmd string, args ...string) ([]byte, error) {
	// Can ignore gosec G204 because this function is not used in Grafana, only in the build process.
	//nolint:gosec
	ecmd := exec.Command(cmd, args...)
	bs, err := ecmd.CombinedOutput()
	if err != nil {
		return nil, err
	}

	return bytes.TrimSpace(bs), nil
}

func runPrint(cmd string, args ...string) {
	slog.Info("Running command", "command", cmd, "args", strings.Join(args, " "))
	// Can ignore gosec G204 because this function is not used in Grafana, only in the build process.
	//nolint:gosec
	ecmd := exec.Command(cmd, args...)
	ecmd.Stdout = os.Stdout
	ecmd.Stderr = os.Stderr
	err := ecmd.Run()
	if err != nil {
		slog.Error("Command failed", "command", cmd, "args", strings.Join(args, " "), "error", err)
		os.Exit(1)
	}
}
