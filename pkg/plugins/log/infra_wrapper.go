package log

import (
	"fmt"
)

var _ PrettyLogger = (*prettyLogger)(nil)

type prettyLogger struct {
	log Logger
}

func NewPrettyLogger(name string) *prettyLogger {
	return &prettyLogger{
		log: New(name),
	}
}

func (l *prettyLogger) Successf(format string, args ...any) {
	l.log.Info("Operation succeeded",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *prettyLogger) Failuref(format string, args ...any) {
	l.log.Error("Operation failed",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func splitPrettyArgs(args ...any) (string, []any, bool) {
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

func (l *prettyLogger) Info(args ...any) {
	message, attrs, structured := splitPrettyArgs(args...)
	if structured {
		l.log.Info("Info", append([]any{"message", message}, attrs...)...)
		return
	}
	l.log.Info("Info", "message", message)
}

func (l *prettyLogger) Infof(format string, args ...any) {
	l.log.Info("Info",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *prettyLogger) Debug(args ...any) {
	message, attrs, structured := splitPrettyArgs(args...)
	if structured {
		l.log.Debug("Debug", append([]any{"message", message}, attrs...)...)
		return
	}
	l.log.Debug("Debug", "message", message)
}

func (l *prettyLogger) Debugf(format string, args ...any) {
	l.log.Debug("Debug",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *prettyLogger) Warn(args ...any) {
	message, attrs, structured := splitPrettyArgs(args...)
	if structured {
		l.log.Warn("Warn", append([]any{"message", message}, attrs...)...)
		return
	}
	l.log.Warn("Warn", "message", message)
}

func (l *prettyLogger) Warnf(format string, args ...any) {
	l.log.Warn("Warn",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

func (l *prettyLogger) Error(args ...any) {
	message, attrs, structured := splitPrettyArgs(args...)
	if structured {
		l.log.Error("Error", append([]any{"message", message}, attrs...)...)
		return
	}
	l.log.Error("Error", "message", message)
}

func (l *prettyLogger) Errorf(format string, args ...any) {
	l.log.Error("Error",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}
