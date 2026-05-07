package interceptors

import (
	"context"
	"strings"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

const (
	tracingStreamPrefix = "gRPC Server stream "

	grpcRPCTypeStream = "stream"
)

func TracingStreamInterceptor(tracer trace.Tracer) grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		ctx := stream.Context()
		if md, ok := metadata.FromIncomingContext(ctx); ok {
			ctx = otel.GetTextMapPropagator().Extract(ctx, propagation.HeaderCarrier(md))
		}
		ctx, span := tracer.Start(ctx, streamSpanName(info),
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(streamSpanAttributes(info)...),
		)
		defer span.End()
		tracingStream := &tracingServerStream{
			ServerStream: stream,
			ctx:          ctx,
		}
		return handler(srv, tracingStream)
	}
}

type tracingServerStream struct {
	grpc.ServerStream
	ctx context.Context
}

func (s *tracingServerStream) Context() context.Context {
	return s.ctx
}

func streamSpanName(info *grpc.StreamServerInfo) string {
	if info == nil || info.FullMethod == "" {
		return tracingStreamPrefix + "unknown"
	}
	return tracingStreamPrefix + info.FullMethod
}

func streamSpanAttributes(info *grpc.StreamServerInfo) []attribute.KeyValue {
	attrs := []attribute.KeyValue{
		attribute.String("grafana.grpc.rpc_type", grpcRPCTypeStream),
		attribute.String("rpc.system", "grpc"),
		attribute.Bool("rpc.grpc.stream", true),
	}
	if info == nil {
		return attrs
	}

	attrs = append(attrs,
		attribute.String("rpc.grpc.full_method", info.FullMethod),
		attribute.Bool("rpc.grpc.stream.client", info.IsClientStream),
		attribute.Bool("rpc.grpc.stream.server", info.IsServerStream),
	)

	service, method := parseFullMethod(info.FullMethod)
	if service != "" {
		attrs = append(attrs, attribute.String("rpc.service", service))
	}
	if method != "" {
		attrs = append(attrs, attribute.String("rpc.method", method))
	}

	return attrs
}

func parseFullMethod(fullMethod string) (service string, method string) {
	service, method, found := strings.Cut(strings.TrimPrefix(fullMethod, "/"), "/")
	if !found {
		return "", ""
	}
	return service, method
}
