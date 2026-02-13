package sqlstore

import (
	"fmt"

	"github.com/grafana/grafana/pkg/util/xorm/core"

	glog "github.com/grafana/grafana/pkg/infra/log"
)

type XormLogger struct {
	grafanaLog glog.Logger
	level      glog.Lvl
	showSQL    bool
}

func splitSQLStoreLogArgs(args ...any) (message string, attrs []any, structured bool) {
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

func NewXormLogger(level glog.Lvl, grafanaLog glog.Logger) *XormLogger {
	return &XormLogger{
		grafanaLog: grafanaLog,
		level:      level,
		showSQL:    true,
	}
}

func (s *XormLogger) emit(logFn func(msg string, args ...any), args ...any) {
	message, attrs, structured := splitSQLStoreLogArgs(args...)
	if structured {
		logFn("SQL store log", append([]any{"message", message}, attrs...)...)
		return
	}
	logFn("SQL store log", "message", message)
}

func (s *XormLogger) emitf(logFn func(msg string, args ...any), format string, args ...any) {
	logFn("SQL store log",
		"message", fmt.Sprintf(format, args...),
		"template", format,
		"args", args)
}

// Error implement core.ILogger
func (s *XormLogger) Error(v ...any) {
	if s.level <= glog.LvlError {
		s.emit(s.grafanaLog.Error, v...)
	}
}

// Errorf implement core.ILogger
func (s *XormLogger) Errorf(format string, v ...any) {
	if s.level <= glog.LvlError {
		s.emitf(s.grafanaLog.Error, format, v...)
	}
}

// Debug implement core.ILogger
func (s *XormLogger) Debug(v ...any) {
	if s.level <= glog.LvlDebug {
		s.emit(s.grafanaLog.Debug, v...)
	}
}

// Debugf implement core.ILogger
func (s *XormLogger) Debugf(format string, v ...any) {
	if s.level <= glog.LvlDebug {
		s.emitf(s.grafanaLog.Debug, format, v...)
	}
}

// Info implement core.ILogger
func (s *XormLogger) Info(v ...any) {
	if s.level <= glog.LvlInfo {
		s.emit(s.grafanaLog.Info, v...)
	}
}

// Infof implement core.ILogger
func (s *XormLogger) Infof(format string, v ...any) {
	if s.level <= glog.LvlInfo {
		s.emitf(s.grafanaLog.Info, format, v...)
	}
}

// Warn implement core.ILogger
func (s *XormLogger) Warn(v ...any) {
	if s.level <= glog.LvlWarn {
		s.emit(s.grafanaLog.Warn, v...)
	}
}

// Warnf implement core.ILogger
func (s *XormLogger) Warnf(format string, v ...any) {
	if s.level <= glog.LvlWarn {
		s.emitf(s.grafanaLog.Warn, format, v...)
	}
}

// Level implement core.ILogger
func (s *XormLogger) Level() core.LogLevel {
	switch s.level {
	case glog.LvlError:
		return core.LOG_ERR
	case glog.LvlWarn:
		return core.LOG_WARNING
	case glog.LvlInfo:
		return core.LOG_INFO
	case glog.LvlDebug:
		return core.LOG_DEBUG
	default:
		return core.LOG_ERR
	}
}

// SetLevel implement core.ILogger
func (s *XormLogger) SetLevel(l core.LogLevel) {
}

// ShowSQL implement core.ILogger
func (s *XormLogger) ShowSQL(show ...bool) {
	if len(show) == 0 {
		s.showSQL = true
		return
	}
	s.showSQL = show[0]
}

// IsShowSQL implement core.ILogger
func (s *XormLogger) IsShowSQL() bool {
	return s.showSQL
}
