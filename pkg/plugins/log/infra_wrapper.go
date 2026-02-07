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
	l.log.Info(fmt.Sprintf(format, args...))
}

func (l *prettyLogger) Failuref(format string, args ...any) {
	l.log.Error(fmt.Sprintf(format, args...))
}

func (l *prettyLogger) Info(msg string, ctx ...any) {
	l.log.Info(msg, ctx...)
}

func (l *prettyLogger) Infof(format string, args ...any) {
	l.log.Info(fmt.Sprintf(format, args...))
}

func (l *prettyLogger) Debug(msg string, ctx ...any) {
	l.log.Debug(msg, ctx...)
}

func (l *prettyLogger) Debugf(format string, args ...any) {
	l.log.Debug(fmt.Sprintf(format, args...))
}

func (l *prettyLogger) Warn(msg string, ctx ...any) {
	l.log.Warn(msg, ctx...)
}

func (l *prettyLogger) Warnf(format string, args ...any) {
	l.log.Warn(fmt.Sprintf(format, args...))
}

func (l *prettyLogger) Error(msg string, ctx ...any) {
	l.log.Error(msg, ctx...)
}

func (l *prettyLogger) Errorf(format string, args ...any) {
	l.log.Error(fmt.Sprintf(format, args...))
}
