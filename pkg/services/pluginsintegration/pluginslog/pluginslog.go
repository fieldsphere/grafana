package pluginslog

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/log"
	pluginslog "github.com/grafana/grafana/pkg/plugins/log"
)

func init() {
	// Register Grafana's logger implementation for pkg/plugins
	pluginslog.SetLoggerFactory(func(name string) pluginslog.Logger {
		return &grafanaInfraLogWrapper{
			l: log.New(name),
		}
	})
}

type grafanaInfraLogWrapper struct {
	l *log.ConcreteLogger
}

func wrapPluginInfraLogArgs(msg, level string, ctx ...any) []any {
	normalized := normalizePluginInfraLogArgs(ctx...)
	fields := make([]any, 0, len(normalized)+4)
	fields = append(fields, "plugin_message", msg, "plugin_log_level", level)
	fields = append(fields, normalized...)
	return fields
}

func normalizePluginInfraLogArgs(ctx ...any) []any {
	if len(ctx) == 0 {
		return nil
	}
	if len(ctx)%2 != 0 {
		return []any{"plugin_log_args", ctx}
	}
	for i := 0; i < len(ctx); i += 2 {
		if _, ok := ctx[i].(string); !ok {
			return []any{"plugin_log_args", ctx}
		}
	}
	return ctx
}

func (d *grafanaInfraLogWrapper) New(ctx ...any) pluginslog.Logger {
	if len(ctx) == 0 {
		return &grafanaInfraLogWrapper{
			l: d.l.New(),
		}
	}

	return &grafanaInfraLogWrapper{
		l: d.l.New(ctx...),
	}
}

func (d *grafanaInfraLogWrapper) Debug(msg string, ctx ...any) {
	d.l.Debug("Plugins infrastructure log entry", wrapPluginInfraLogArgs(msg, "debug", ctx...)...)
}

func (d *grafanaInfraLogWrapper) Info(msg string, ctx ...any) {
	d.l.Info("Plugins infrastructure log entry", wrapPluginInfraLogArgs(msg, "info", ctx...)...)
}

func (d *grafanaInfraLogWrapper) Warn(msg string, ctx ...any) {
	d.l.Warn("Plugins infrastructure log entry", wrapPluginInfraLogArgs(msg, "warn", ctx...)...)
}

func (d *grafanaInfraLogWrapper) Error(msg string, ctx ...any) {
	d.l.Error("Plugins infrastructure log entry", wrapPluginInfraLogArgs(msg, "error", ctx...)...)
}

func (d *grafanaInfraLogWrapper) FromContext(ctx context.Context) pluginslog.Logger {
	concreteInfraLogger, ok := d.l.FromContext(ctx).(*log.ConcreteLogger)
	if !ok {
		return d.New()
	}
	return &grafanaInfraLogWrapper{
		l: concreteInfraLogger,
	}
}
