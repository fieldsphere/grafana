package interceptors

import (
	"context"
	"fmt"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"google.golang.org/grpc"

	"github.com/grafana/grafana/pkg/infra/log"
)

func InterceptorLogger(l log.Logger, enabled bool) logging.Logger {
	return logging.LoggerFunc(func(ctx context.Context, lvl logging.Level, msg string, fields ...any) {
		if !enabled {
			return
		}
		l := l.FromContext(ctx)
		contextFields := append([]any{"grpcMessage", msg}, fields...)
		switch lvl {
		case logging.LevelDebug:
			l.Debug("gRPC middleware log entry", append(contextFields, "grpcLevel", "debug")...)
		case logging.LevelInfo:
			l.Info("gRPC middleware log entry", append(contextFields, "grpcLevel", "info")...)
		case logging.LevelWarn:
			l.Warn("gRPC middleware log entry", append(contextFields, "grpcLevel", "warn")...)
		case logging.LevelError:
			l.Error("gRPC middleware log entry", append(contextFields, "grpcLevel", "error")...)
		default:
			panic(fmt.Sprintf("unknown level %v", lvl))
		}
	})
}

func LoggingUnaryInterceptor(logger log.Logger, enabled bool) grpc.UnaryServerInterceptor {
	return logging.UnaryServerInterceptor(InterceptorLogger(logger, enabled))
}

func LoggingStreamInterceptor(logger log.Logger, enabled bool) grpc.StreamServerInterceptor {
	return logging.StreamServerInterceptor(InterceptorLogger(logger, enabled))
}
