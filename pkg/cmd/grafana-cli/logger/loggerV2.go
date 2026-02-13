package logger

import (
	"fmt"
	"log/slog"

	"github.com/fatih/color"
)

type CLILogger struct {
	debugMode bool
}

func New(debugMode bool) *CLILogger {
	return &CLILogger{
		debugMode: debugMode,
	}
}

func (l *CLILogger) Successf(format string, args ...any) {
	slog.Info("Grafana CLI success", "message", fmt.Sprintf(format, args...), "symbol", color.GreenString("✔"))
}

func (l *CLILogger) Failuref(format string, args ...any) {
	slog.Error("Grafana CLI failure", "message", fmt.Sprintf(format, args...), "label", color.RedString("Error"), "symbol", color.RedString("✗"))
}

func (l *CLILogger) Info(args ...any) {
	slog.Info("Grafana CLI info", "message", fmt.Sprint(args...))
}

func (l *CLILogger) Infof(format string, args ...any) {
	slog.Info("Grafana CLI info", "message", fmt.Sprintf(format, args...))
}

func (l *CLILogger) Debug(args ...any) {
	if l.debugMode {
		slog.Debug("Grafana CLI debug", "message", color.HiBlueString(fmt.Sprint(args...)))
	}
}

func (l *CLILogger) Debugf(format string, args ...any) {
	if l.debugMode {
		slog.Debug("Grafana CLI debug", "message", color.HiBlueString(fmt.Sprintf(format, args...)))
	}
}

func (l *CLILogger) Warn(args ...any) {
	slog.Warn("Grafana CLI warning", "message", fmt.Sprint(args...))
}

func (l *CLILogger) Warnf(format string, args ...any) {
	slog.Warn("Grafana CLI warning", "message", fmt.Sprintf(format, args...))
}

func (l *CLILogger) Error(args ...any) {
	slog.Error("Grafana CLI error", "message", fmt.Sprint(args...))
}

func (l *CLILogger) Errorf(format string, args ...any) {
	slog.Error("Grafana CLI error", "message", fmt.Sprintf(format, args...))
}
