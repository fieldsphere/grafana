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
	slog.Info("Grafana CLI success",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args,
		"symbol", color.GreenString("✔"))
}

func (l *CLILogger) Failuref(format string, args ...any) {
	slog.Error("Grafana CLI failure",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args,
		"label", color.RedString("Error"),
		"symbol", color.RedString("✗"))
}

func (l *CLILogger) Info(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Info("Grafana CLI info", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Info("Grafana CLI info", "message", message)
}

func (l *CLILogger) Infof(format string, args ...any) {
	slog.Info("Grafana CLI info",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *CLILogger) Debug(args ...any) {
	if l.debugMode {
		message, attrs, structured := splitCLIArgs(args...)
		if structured {
			slog.Debug("Grafana CLI debug", append([]any{"message", color.HiBlueString(message)}, attrs...)...)
			return
		}
		slog.Debug("Grafana CLI debug", "message", color.HiBlueString(message))
	}
}

func (l *CLILogger) Debugf(format string, args ...any) {
	if l.debugMode {
		slog.Debug("Grafana CLI debug",
			"message", color.HiBlueString(fmt.Sprintf(format, args...)),
			"template", format,
			"args", args)
	}
}

func (l *CLILogger) Warn(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Warn("Grafana CLI warning", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Warn("Grafana CLI warning", "message", message)
}

func (l *CLILogger) Warnf(format string, args ...any) {
	slog.Warn("Grafana CLI warning",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *CLILogger) Error(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Error("Grafana CLI error", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Error("Grafana CLI error", "message", message)
}

func (l *CLILogger) Errorf(format string, args ...any) {
	slog.Error("Grafana CLI error",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}
