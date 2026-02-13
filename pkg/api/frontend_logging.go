package api

import (
	"net/http"
	"sort"
	"time"

	"golang.org/x/time/rate"

	"github.com/grafana/grafana/pkg/api/frontendlogging"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/web"
)

var frontendLogger = log.New("frontend")

type frontendLogMessageHandler func(hs *HTTPServer, c *web.Context)

const grafanaJavascriptAgentEndpointPath = "/log-grafana-javascript-agent"

func appendSortedFrontendContext(ctx frontendlogging.CtxVector, values map[string]any) frontendlogging.CtxVector {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	for _, key := range keys {
		ctx = append(ctx, key, values[key])
	}

	return ctx
}

func GrafanaJavascriptAgentLogMessageHandler(store *frontendlogging.SourceMapStore) frontendLogMessageHandler {
	return func(hs *HTTPServer, c *web.Context) {
		event := frontendlogging.FrontendGrafanaJavascriptAgentEvent{}
		if err := web.Bind(c.Req, &event); err != nil {
			c.Resp.WriteHeader(http.StatusBadRequest)
			_, err = c.Resp.Write([]byte("bad request data"))
			if err != nil {
				hs.log.Error("could not write to response", "error", err)
			}
		}

		// Meta object is standard across event types, adding it globally.

		if len(event.Logs) > 0 {
			for _, logEntry := range event.Logs {
				var ctx = frontendlogging.CtxVector{}
				ctx = event.AddMetaToContext(ctx)
				ctx = append(ctx, "kind", "log", "original_timestamp", logEntry.Timestamp)
				ctx = appendSortedFrontendContext(ctx, frontendlogging.KeyValToInterfaceMap(logEntry.KeyValContext()))
				switch logEntry.LogLevel {
				case frontendlogging.LogLevelDebug, frontendlogging.LogLevelTrace:
					{
						ctx = append(ctx, "original_log_level", logEntry.LogLevel, "frontend_log_message", logEntry.Message)
						frontendLogger.Debug("Frontend javascript agent log entry", ctx...)
					}
				case frontendlogging.LogLevelError:
					{
						ctx = append(ctx, "original_log_level", logEntry.LogLevel, "frontend_log_message", logEntry.Message)
						frontendLogger.Error("Frontend javascript agent log entry", ctx...)
					}
				case frontendlogging.LogLevelWarning:
					{
						ctx = append(ctx, "original_log_level", logEntry.LogLevel, "frontend_log_message", logEntry.Message)
						frontendLogger.Warn("Frontend javascript agent log entry", ctx...)
					}
				default:
					{
						ctx = append(ctx, "original_log_level", logEntry.LogLevel, "frontend_log_message", logEntry.Message)
						frontendLogger.Info("Frontend javascript agent log entry", ctx...)
					}
				}
			}
		}

		if len(event.Measurements) > 0 {
			for _, measurementEntry := range event.Measurements {
				for measurementName, measurementValue := range measurementEntry.Values {
					var ctx = frontendlogging.CtxVector{}
					ctx = event.AddMetaToContext(ctx)
					ctx = append(ctx, measurementName, measurementValue)
					ctx = append(ctx, "kind", "measurement", "original_timestamp", measurementEntry.Timestamp)
					frontendLogger.Info("Measurement", append(ctx, "measurementType", measurementEntry.Type)...)
				}
			}
		}
		if len(event.Exceptions) > 0 {
			for _, exception := range event.Exceptions {
				var ctx = frontendlogging.CtxVector{}
				ctx = event.AddMetaToContext(ctx)
				exception := exception
				transformedException := frontendlogging.TransformException(c.Req.Context(), &exception, store)
				ctx = append(ctx, "kind", "exception", "type", transformedException.Type, "value", transformedException.Value, "stacktrace", transformedException.String())
				ctx = append(ctx, "original_timestamp", exception.Timestamp, "frontend_exception_message", exception.Message())
				frontendLogger.Error("Frontend javascript agent exception", ctx...)
			}
		}
		c.Resp.WriteHeader(http.StatusAccepted)
		_, err := c.Resp.Write([]byte("OK"))
		if err != nil {
			hs.log.Error("could not write to response", "error", err)
		}
	}
}

// setupFrontendLogHandlers will set up handlers for logs incoming from frontend.
// handlers are setup even if frontend logging is disabled, but in this case do nothing
// this is to avoid reporting errors in case config was changes but there are browser
// sessions still open with older config
func (hs *HTTPServer) frontendLogEndpoints() web.Handler {
	if !(hs.Cfg.GrafanaJavascriptAgent.Enabled) {
		return func(ctx *web.Context) {
			if ctx.Req.Method == http.MethodPost && ctx.Req.URL.Path == grafanaJavascriptAgentEndpointPath {
				ctx.Resp.WriteHeader(http.StatusAccepted)
				_, err := ctx.Resp.Write([]byte("OK"))
				if err != nil {
					hs.log.Error("could not write to response", "error", err)
				}
			}
		}
	}

	sourceMapStore := frontendlogging.NewSourceMapStore(hs.Cfg, hs.pluginStaticRouteResolver, frontendlogging.ReadSourceMapFromFS)
	rateLimiter := rate.NewLimiter(rate.Limit(hs.Cfg.GrafanaJavascriptAgent.EndpointRPS), hs.Cfg.GrafanaJavascriptAgent.EndpointBurst)
	handler := GrafanaJavascriptAgentLogMessageHandler(sourceMapStore)

	return func(ctx *web.Context) {
		if ctx.Req.Method == http.MethodPost && ctx.Req.URL.Path == grafanaJavascriptAgentEndpointPath {
			if !rateLimiter.AllowN(time.Now(), 1) {
				ctx.Resp.WriteHeader(http.StatusTooManyRequests)
				return
			}
			handler(hs, ctx)
		}
	}
}
