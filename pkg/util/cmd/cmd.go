package cmd

import (
	"errors"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"syscall"

	"github.com/fatih/color"
)

func RunGrafanaCmd(subCmd string) int {
	curr, err := os.Executable()
	if err != nil {
		slog.Error("Error locating executable", "error", err)
		return 1
	}

	switch filepath.Base(curr) {
	case "grafana-server":
		slog.Warn("Deprecation warning",
			"binary", "grafana-server",
			"message", "The standalone 'grafana-server' program is deprecated and will be removed in the future. Please update all uses of 'grafana-server' to 'grafana server'",
			"prefix", color.RedString("Deprecation warning"))
	case "grafana-cli":
		slog.Warn("Deprecation warning",
			"binary", "grafana-cli",
			"message", "The standalone 'grafana-cli' program is deprecated and will be removed in the future. Please update all uses of 'grafana-cli' to 'grafana cli'",
			"prefix", color.RedString("Deprecation warning"))
	}

	executable := "grafana"
	if runtime.GOOS == "windows" {
		executable += ".exe"
	}

	binary := filepath.Join(filepath.Dir(filepath.Clean(curr)), executable)
	if _, err := os.Stat(binary); err != nil {
		binary, err = exec.LookPath(executable)
		if err != nil {
			slog.Error("Error locating executable", "executable", executable, "error", err)
			return 1
		}
	}

	// windows doesn't support syscall.Exec so we just run the main binary as a command
	if runtime.GOOS == "windows" {
		// bypassing gosec G204 because we need to build the command programmatically
		// nolint:gosec
		cmd := exec.Command(binary, append([]string{subCmd}, os.Args[1:]...)...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Stdin = os.Stdin
		cmd.Env = os.Environ()
		err := cmd.Run()
		if err == nil {
			return 0
		}
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			return exitError.ExitCode()
		}
		return 1
	}

	args := append([]string{"grafana", subCmd}, os.Args[1:]...)

	// bypassing gosec G204 because we need to build the command programmatically
	// nolint:gosec
	execErr := syscall.Exec(binary, args, os.Environ())
	if execErr != nil {
		slog.Error("Error running executable", "binary", binary, "error", execErr)
		return 1
	}

	return 0
}
