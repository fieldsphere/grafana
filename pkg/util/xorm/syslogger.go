// Copyright 2015 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

//go:build !windows && !nacl && !plan9
// +build !windows,!nacl,!plan9

package xorm

import (
	"encoding/json"
	"fmt"
	"log/syslog"

	"github.com/grafana/grafana/pkg/util/xorm/core"
)

var _ core.ILogger = &SyslogLogger{}

// SyslogLogger will be depricated
type SyslogLogger struct {
	w       *syslog.Writer
	showSQL bool
}

// NewSyslogLogger implements core.ILogger
func NewSyslogLogger(w *syslog.Writer) *SyslogLogger {
	return &SyslogLogger{w: w}
}

func normalizeSyslogValue(v any) any {
	if err, ok := v.(error); ok {
		return err.Error()
	}
	return v
}

func formatSyslogEvent(args ...any) string {
	message, attrs := splitLogArgs(args...)

	payload := map[string]any{
		"event":   "XORM log event",
		"message": message,
	}
	for i := 0; i+1 < len(attrs); i += 2 {
		key, ok := attrs[i].(string)
		if !ok || key == "" {
			continue
		}
		payload[key] = normalizeSyslogValue(attrs[i+1])
	}

	out, err := json.Marshal(payload)
	if err != nil {
		return message
	}
	return string(out)
}

func (s *SyslogLogger) emit(write func(string) error, args ...any) {
	_ = write(formatSyslogEvent(args...))
}

func (s *SyslogLogger) emitf(write func(string) error, format string, args ...any) {
	s.emit(write,
		fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

// Debug log content as Debug
func (s *SyslogLogger) Debug(v ...any) {
	s.emit(s.w.Debug, v...)
}

// Debugf log content as Debug and format
func (s *SyslogLogger) Debugf(format string, v ...any) {
	s.emitf(s.w.Debug, format, v...)
}

// Error log content as Error
func (s *SyslogLogger) Error(v ...any) {
	s.emit(s.w.Err, v...)
}

// Errorf log content as Errorf and format
func (s *SyslogLogger) Errorf(format string, v ...any) {
	s.emitf(s.w.Err, format, v...)
}

// Info log content as Info
func (s *SyslogLogger) Info(v ...any) {
	s.emit(s.w.Info, v...)
}

// Infof log content as Infof and format
func (s *SyslogLogger) Infof(format string, v ...any) {
	s.emitf(s.w.Info, format, v...)
}

// Warn log content as Warn
func (s *SyslogLogger) Warn(v ...any) {
	s.emit(s.w.Warning, v...)
}

// Warnf log content as Warnf and format
func (s *SyslogLogger) Warnf(format string, v ...any) {
	s.emitf(s.w.Warning, format, v...)
}

// Level shows log level
func (s *SyslogLogger) Level() core.LogLevel {
	return core.LOG_UNKNOWN
}

// SetLevel always return error, as current log/syslog package doesn't allow to set priority level after syslog.Writer created
func (s *SyslogLogger) SetLevel(l core.LogLevel) {}

// ShowSQL set if logging SQL
func (s *SyslogLogger) ShowSQL(show ...bool) {
	if len(show) == 0 {
		s.showSQL = true
		return
	}
	s.showSQL = show[0]
}

// IsShowSQL if logging SQL
func (s *SyslogLogger) IsShowSQL() bool {
	return s.showSQL
}
