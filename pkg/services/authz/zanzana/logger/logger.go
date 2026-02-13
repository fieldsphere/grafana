package logger

import (
	"context"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/openfga/openfga/pkg/logger"
)

var _ logger.Logger = (*ZanzanaLogger)(nil)

// ZanzanaLogger is a grafana logger wrapper compatible with OpenFGA logger interface
type ZanzanaLogger struct {
	logger log.Logger
}

func New(logger log.Logger) *ZanzanaLogger {
	return &ZanzanaLogger{
		logger: logger,
	}
}

// Simple converter for zap logger fields
func zapFieldsToArgs(fields []zap.Field) []any {
	// We need to pre-allocated space for key and value
	args := make([]any, 0, len(fields)*2)
	encoder := zapcore.NewMapObjectEncoder()
	for _, f := range fields {
		f.AddTo(encoder)
		value, ok := encoder.Fields[f.Key]
		if !ok {
			continue
		}
		args = append(args, f.Key, value)
	}
	return args
}

// With implements logger.Logger.
func (l *ZanzanaLogger) With(fields ...zapcore.Field) logger.Logger {
	return &ZanzanaLogger{
		logger: l.logger.New(zapFieldsToArgs(fields)...),
	}
}

func (l *ZanzanaLogger) emit(level string, msg string, fields ...zap.Field) {
	args := append(zapFieldsToArgs(fields), "zanzana_message", msg, "zanzana_level", level)
	switch level {
	case "debug":
		l.logger.Debug("Zanzana logger event", args...)
	case "info":
		l.logger.Info("Zanzana logger event", args...)
	case "warn":
		l.logger.Warn("Zanzana logger event", args...)
	case "error", "panic", "fatal":
		l.logger.Error("Zanzana logger event", args...)
	default:
		l.logger.Info("Zanzana logger event", args...)
	}
}

func (l *ZanzanaLogger) Debug(msg string, fields ...zap.Field) {
	l.emit("debug", msg, fields...)
}

func (l *ZanzanaLogger) Info(msg string, fields ...zap.Field) {
	l.emit("info", msg, fields...)
}

func (l *ZanzanaLogger) Warn(msg string, fields ...zap.Field) {
	l.emit("warn", msg, fields...)
}

func (l *ZanzanaLogger) Error(msg string, fields ...zap.Field) {
	l.emit("error", msg, fields...)
}

func (l *ZanzanaLogger) Panic(msg string, fields ...zap.Field) {
	l.emit("panic", msg, fields...)
}

func (l *ZanzanaLogger) Fatal(msg string, fields ...zap.Field) {
	l.emit("fatal", msg, fields...)
}

func (l *ZanzanaLogger) DebugWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("debug", msg, fields...)
}

func (l *ZanzanaLogger) InfoWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("info", msg, fields...)
}

func (l *ZanzanaLogger) WarnWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("warn", msg, fields...)
}

func (l *ZanzanaLogger) ErrorWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("error", msg, fields...)
}

func (l *ZanzanaLogger) PanicWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("panic", msg, fields...)
}

func (l *ZanzanaLogger) FatalWithContext(ctx context.Context, msg string, fields ...zap.Field) {
	l.emit("fatal", msg, fields...)
}
