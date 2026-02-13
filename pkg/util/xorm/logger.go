// Copyright 2015 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package xorm

import (
	"context"
	"fmt"
	"io"
	"log/slog"

	"github.com/grafana/grafana/pkg/util/xorm/core"
)

// default log options
const (
	DEFAULT_LOG_PREFIX = "[xorm]"
	DEFAULT_LOG_LEVEL  = core.LOG_DEBUG
)

var _ core.ILogger = DiscardLogger{}

// DiscardLogger don't log implementation for core.ILogger
type DiscardLogger struct{}

// Debug empty implementation
func (DiscardLogger) Debug(v ...any) {}

// Debugf empty implementation
func (DiscardLogger) Debugf(format string, v ...any) {}

// Error empty implementation
func (DiscardLogger) Error(v ...any) {}

// Errorf empty implementation
func (DiscardLogger) Errorf(format string, v ...any) {}

// Info empty implementation
func (DiscardLogger) Info(v ...any) {}

// Infof empty implementation
func (DiscardLogger) Infof(format string, v ...any) {}

// Warn empty implementation
func (DiscardLogger) Warn(v ...any) {}

// Warnf empty implementation
func (DiscardLogger) Warnf(format string, v ...any) {}

// Level empty implementation
func (DiscardLogger) Level() core.LogLevel {
	return core.LOG_UNKNOWN
}

// SetLevel empty implementation
func (DiscardLogger) SetLevel(l core.LogLevel) {}

// ShowSQL empty implementation
func (DiscardLogger) ShowSQL(show ...bool) {}

// IsShowSQL empty implementation
func (DiscardLogger) IsShowSQL() bool {
	return false
}

// SimpleLogger is the default implment of core.ILogger
type SimpleLogger struct {
	logger  *slog.Logger
	level   core.LogLevel
	showSQL bool
}

var _ core.ILogger = &SimpleLogger{}

// NewSimpleLogger use a special io.Writer as logger output
func NewSimpleLogger(out io.Writer) *SimpleLogger {
	baseLogger := slog.New(slog.NewTextHandler(out, &slog.HandlerOptions{})).With("logger", DEFAULT_LOG_PREFIX)
	return &SimpleLogger{
		logger: baseLogger,
		level:  DEFAULT_LOG_LEVEL,
	}
}

func splitLogArgs(args ...any) (string, []any) {
	if len(args) == 0 {
		return "", nil
	}

	msg, isString := args[0].(string)
	if !isString {
		return fmt.Sprint(args...), nil
	}

	if len(args) == 1 {
		return msg, nil
	}

	rest := args[1:]
	if len(rest) == 1 {
		if err, ok := rest[0].(error); ok {
			return msg, []any{"error", err}
		}
		return fmt.Sprint(args...), nil
	}

	if len(rest)%2 != 0 {
		return fmt.Sprint(args...), nil
	}

	for i := 0; i < len(rest); i += 2 {
		if _, ok := rest[i].(string); !ok {
			return fmt.Sprint(args...), nil
		}
	}

	return msg, rest
}

func (s *SimpleLogger) emit(level slog.Level, args ...any) {
	message, attrs := splitLogArgs(args...)
	s.logger.Log(context.Background(), level, "XORM log event", append([]any{"message", message}, attrs...)...)
}

// Error implement core.ILogger
func (s *SimpleLogger) Error(v ...any) {
	if s.level <= core.LOG_ERR {
		s.emit(slog.LevelError, v...)
	}
}

// Errorf implement core.ILogger
func (s *SimpleLogger) Errorf(format string, v ...any) {
	if s.level <= core.LOG_ERR {
		s.emit(slog.LevelError, fmt.Sprintf(format, v...))
	}
}

// Debug implement core.ILogger
func (s *SimpleLogger) Debug(v ...any) {
	if s.level <= core.LOG_DEBUG {
		s.emit(slog.LevelDebug, v...)
	}
}

// Debugf implement core.ILogger
func (s *SimpleLogger) Debugf(format string, v ...any) {
	if s.level <= core.LOG_DEBUG {
		s.emit(slog.LevelDebug, fmt.Sprintf(format, v...))
	}
}

// Info implement core.ILogger
func (s *SimpleLogger) Info(v ...any) {
	if s.level <= core.LOG_INFO {
		s.emit(slog.LevelInfo, v...)
	}
}

// Infof implement core.ILogger
func (s *SimpleLogger) Infof(format string, v ...any) {
	if s.level <= core.LOG_INFO {
		s.emit(slog.LevelInfo, fmt.Sprintf(format, v...))
	}
}

// Warn implement core.ILogger
func (s *SimpleLogger) Warn(v ...any) {
	if s.level <= core.LOG_WARNING {
		s.emit(slog.LevelWarn, v...)
	}
}

// Warnf implement core.ILogger
func (s *SimpleLogger) Warnf(format string, v ...any) {
	if s.level <= core.LOG_WARNING {
		s.emit(slog.LevelWarn, fmt.Sprintf(format, v...))
	}
}

// Level implement core.ILogger
func (s *SimpleLogger) Level() core.LogLevel {
	return s.level
}

// SetLevel implement core.ILogger
func (s *SimpleLogger) SetLevel(l core.LogLevel) {
	s.level = l
}

// ShowSQL implement core.ILogger
func (s *SimpleLogger) ShowSQL(show ...bool) {
	if len(show) == 0 {
		s.showSQL = true
		return
	}
	s.showSQL = show[0]
}

// IsShowSQL implement core.ILogger
func (s *SimpleLogger) IsShowSQL() bool {
	return s.showSQL
}
