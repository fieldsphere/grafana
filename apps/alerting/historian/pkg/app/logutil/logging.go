package logutil

import (
	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"github.com/grafana/grafana-app-sdk/logging"
)

func ToGoKitLogger(logger logging.Logger) log.Logger {
	return &sdk2gkLogger{logger: logger}
}

type sdk2gkLogger struct {
	logger logging.Logger
}

func (s *sdk2gkLogger) Log(keyvals ...interface{}) error {
	const eventMessage = "Go kit logger event"

	var (
		outMsg     = ""
		outLevel   = interface{}(level.InfoValue())
		outKeyvals = []interface{}{}
	)

	if len(keyvals) == 0 {
		s.logger.Info(eventMessage, "gokitMessage", outMsg, "gokitLevel", "info")
		return nil
	}

	if len(keyvals)%2 == 1 {
		keyvals = append(keyvals, nil)
	}

	for i := 0; i < len(keyvals); i += 2 {
		k, v := keyvals[i], keyvals[i+1]

		if keyvals[i] == "msg" {
			if msg, ok := v.(string); ok {
				outMsg = msg
			} else {
				outKeyvals = append(outKeyvals, "gokitRawMessage", v)
			}
			continue
		}

		if k == level.Key() {
			outLevel = v
			continue
		}

		outKeyvals = append(outKeyvals, k)
		outKeyvals = append(outKeyvals, v)
	}

	eventKeyvals := append([]interface{}{"gokitMessage", outMsg}, outKeyvals...)

	switch outLevel {
	case level.DebugValue():
		s.logger.Debug(eventMessage, append(eventKeyvals, "gokitLevel", "debug")...)
	case level.InfoValue():
		s.logger.Info(eventMessage, append(eventKeyvals, "gokitLevel", "info")...)
	case level.WarnValue():
		s.logger.Warn(eventMessage, append(eventKeyvals, "gokitLevel", "warn")...)
	case level.ErrorValue():
		s.logger.Error(eventMessage, append(eventKeyvals, "gokitLevel", "error")...)
	default:
		s.logger.Info(eventMessage, append(eventKeyvals, "gokitLevel", outLevel)...)
	}

	return nil
}
