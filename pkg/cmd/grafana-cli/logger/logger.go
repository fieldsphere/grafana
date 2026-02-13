package logger

import (
	"fmt"
	"log/slog"
)

var (
	debugmode = false
)

func splitCLIArgs(args ...any) (message string, attrs []any, structured bool) {
	if len(args) == 0 {
		return "", nil, false
	}

	msg, ok := args[0].(string)
	if !ok {
		return fmt.Sprint(args...), nil, false
	}

	if len(args) == 1 {
		return msg, nil, true
	}

	rest := args[1:]
	if len(rest)%2 != 0 {
		return fmt.Sprint(args...), nil, false
	}

	for i := 0; i < len(rest); i += 2 {
		if _, isStringKey := rest[i].(string); !isStringKey {
			return fmt.Sprint(args...), nil, false
		}
	}

	return msg, rest, true
}

func Debug(args ...any) {
	if debugmode {
		message, attrs, structured := splitCLIArgs(args...)
		if structured {
			slog.Debug("Grafana CLI debug", append([]any{"message", message}, attrs...)...)
			return
		}
		slog.Debug("Grafana CLI debug", "message", message)
	}
}

func Debugf(fmtString string, args ...any) {
	if debugmode {
		slog.Debug("Grafana CLI debug",
			"message", fmt.Sprintf(fmtString, args...),
			"template", fmtString,
			"args", args)
	}
}

func Error(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Error("Grafana CLI error", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Error("Grafana CLI error", "message", message)
}

func Errorf(fmtString string, args ...any) {
	slog.Error("Grafana CLI error",
		"message", fmt.Sprintf(fmtString, args...),
		"template", fmtString,
		"args", args)
}

func Info(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Info("Grafana CLI info", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Info("Grafana CLI info", "message", message)
}

func Infof(fmtString string, args ...any) {
	slog.Info("Grafana CLI info",
		"message", fmt.Sprintf(fmtString, args...),
		"template", fmtString,
		"args", args)
}

func Warn(args ...any) {
	message, attrs, structured := splitCLIArgs(args...)
	if structured {
		slog.Warn("Grafana CLI warning", append([]any{"message", message}, attrs...)...)
		return
	}
	slog.Warn("Grafana CLI warning", "message", message)
}

func Warnf(fmtString string, args ...any) {
	slog.Warn("Grafana CLI warning",
		"message", fmt.Sprintf(fmtString, args...),
		"template", fmtString,
		"args", args)
}

func SetDebug(value bool) {
	debugmode = value
}
