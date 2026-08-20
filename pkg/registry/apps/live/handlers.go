package live

import (
	"context"
	"io"
	"net/http"
	"strings"

	"github.com/grafana/grafana-app-sdk/app"
	liveDto "github.com/grafana/grafana-plugin-sdk-go/live"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/infra/log"
	grafanalive "github.com/grafana/grafana/pkg/services/live"
	"github.com/grafana/grafana/pkg/services/live/convert"
	"github.com/grafana/grafana/pkg/services/live/pushurl"
)

var handlerLogger = log.New("live.apis")

func newWebSocketHandler(gl *grafanalive.GrafanaLive) func(context.Context, app.CustomRouteResponseWriter, *app.CustomRouteRequest) error {
	return func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
		gl.ServeWebSocket(writer, httpRequestFromCustom(ctx, request))
		return nil
	}
}

func newListHandler(gl *grafanalive.GrafanaLive) func(context.Context, app.CustomRouteResponseWriter, *app.CustomRouteRequest) error {
	return func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
		gl.WriteChannelList(writer, httpRequestFromCustom(ctx, request))
		return nil
	}
}

func newPushGetHandler(gl *grafanalive.GrafanaLive) func(context.Context, app.CustomRouteResponseWriter, *app.CustomRouteRequest) error {
	return func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
		streamID := streamIDFromRequest(request)
		gl.ServePushWebSocket(writer, httpRequestFromCustom(ctx, request), streamID)
		return nil
	}
}

func newPushPostHandler(gl *grafanalive.GrafanaLive) func(context.Context, app.CustomRouteResponseWriter, *app.CustomRouteRequest) error {
	converter := convert.NewConverter()
	return func(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
		user, err := identity.GetRequester(ctx)
		if err != nil {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return nil
		}

		streamID := streamIDFromRequest(request)
		stream, err := gl.ManagedStreamRunner.GetOrCreateStream(user.GetNamespace(), liveDto.ScopeStream, streamID)
		if err != nil {
			handlerLogger.Error("Error getting stream", "error", err)
			http.Error(writer, "Error getting stream", http.StatusInternalServerError)
			return nil
		}

		frameFormat := pushurl.FrameFormatFromValues(request.URL.Query())
		body, err := io.ReadAll(io.LimitReader(request.Body, 500*1024))
		if err != nil {
			handlerLogger.Error("Error reading body", "error", err)
			http.Error(writer, "Error reading body", http.StatusInternalServerError)
			return nil
		}

		metricFrames, err := converter.Convert(body, frameFormat)
		if err != nil {
			handlerLogger.Error("Error converting metrics", "error", err, "frameFormat", frameFormat)
			if err == convert.ErrUnsupportedFrameFormat {
				http.Error(writer, "unsupported frame format", http.StatusBadRequest)
			} else {
				http.Error(writer, "Error converting metrics", http.StatusInternalServerError)
			}
			return nil
		}

		for _, mf := range metricFrames {
			if err := stream.Push(ctx, mf.Key(), mf.Frame()); err != nil {
				handlerLogger.Error("Error pushing frame", "error", err)
				http.Error(writer, "Error publishing stream", http.StatusInternalServerError)
				return nil
			}
		}

		writer.WriteHeader(http.StatusOK)
		return nil
	}
}

func httpRequestFromCustom(ctx context.Context, request *app.CustomRouteRequest) *http.Request {
	req := &http.Request{
		Method: request.Method,
		URL:    request.URL,
		Header: request.Headers,
		Body:   request.Body,
	}
	return req.WithContext(ctx)
}

func streamIDFromRequest(request *app.CustomRouteRequest) string {
	if request == nil {
		return ""
	}
	path := strings.Trim(request.Path, "/")
	if after, ok := strings.CutPrefix(path, "push/"); ok {
		return after
	}
	parts := strings.Split(path, "/")
	return parts[len(parts)-1]
}
