package log

import "context"

// Logger is the default logger
type Logger interface {
	// New returns a new contextual Logger that has this logger's context plus the given context.
	New(ctx ...any) Logger

	// Debug logs a message with debug level and key/value pairs, if any.
	Debug(msg string, ctx ...any)

	// Info logs a message with info level and key/value pairs, if any.
	Info(msg string, ctx ...any)

	// Warn logs a message with warning level and key/value pairs, if any.
	Warn(msg string, ctx ...any)

	// Error logs a message with error level and key/value pairs, if any.
	Error(msg string, ctx ...any)

	// FromContext returns a new contextual Logger that has this logger's context plus the given context.
	FromContext(ctx context.Context) Logger
}

// PrettyLogger is used primarily to facilitate logging/user feedback for both
// the grafana-cli and the grafana backend when managing plugin installs
type PrettyLogger interface {
	Successf(format string, args ...any)
	Failuref(format string, args ...any)

	// Info logs a message with info level and key/value pairs, if any.
	Info(msg string, ctx ...any)
	Infof(format string, args ...any)
	// Debug logs a message with debug level and key/value pairs, if any.
	Debug(msg string, ctx ...any)
	Debugf(format string, args ...any)
	// Warn logs a message with warning level and key/value pairs, if any.
	Warn(msg string, ctx ...any)
	Warnf(format string, args ...any)
	// Error logs a message with error level and key/value pairs, if any.
	Error(msg string, ctx ...any)
	Errorf(format string, args ...any)
}
