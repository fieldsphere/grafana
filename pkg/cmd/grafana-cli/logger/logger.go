package logger

import (
	"fmt"
	"log/slog"
)

var (
	debugmode = false
)

func Debug(args ...any) {
	if debugmode {
		slog.Debug("Grafana CLI debug", "message", fmt.Sprint(args...))
	}
}

func Debugf(fmtString string, args ...any) {
	if debugmode {
		slog.Debug("Grafana CLI debug", "message", fmt.Sprintf(fmtString, args...))
	}
}

func Error(args ...any) {
	slog.Error("Grafana CLI error", "message", fmt.Sprint(args...))
}

func Errorf(fmtString string, args ...any) {
	slog.Error("Grafana CLI error", "message", fmt.Sprintf(fmtString, args...))
}

func Info(args ...any) {
	slog.Info("Grafana CLI info", "message", fmt.Sprint(args...))
}

func Infof(fmtString string, args ...any) {
	slog.Info("Grafana CLI info", "message", fmt.Sprintf(fmtString, args...))
}

func Warn(args ...any) {
	slog.Warn("Grafana CLI warning", "message", fmt.Sprint(args...))
}

func Warnf(fmtString string, args ...any) {
	slog.Warn("Grafana CLI warning", "message", fmt.Sprintf(fmtString, args...))
}

func SetDebug(value bool) {
	debugmode = value
}
