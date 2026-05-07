package interceptors

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	oteltrace "go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"github.com/grafana/grafana/pkg/infra/tracing"
)

func TestTracingStreamInterceptorAddsStreamSpanMetadata(t *testing.T) {
	spanRecorder := tracetest.NewSpanRecorder()
	tracer := tracing.InitializeTracerForTest(tracing.WithSpanProcessor(spanRecorder))
	stream := &testServerStream{
		ctx: metadata.NewIncomingContext(context.Background(), metadata.New(map[string]string{})),
	}
	info := &grpc.StreamServerInfo{
		FullMethod:     "/internapi.v1.PrivateWorkerBridgeInternalService/Connect",
		IsClientStream: true,
		IsServerStream: true,
	}

	interceptor := TracingStreamInterceptor(tracer)
	var handlerCalled bool
	err := interceptor(nil, stream, info, func(srv any, stream grpc.ServerStream) error {
		handlerCalled = true
		require.True(t, oteltrace.SpanFromContext(stream.Context()).SpanContext().IsValid())
		return nil
	})

	require.NoError(t, err)
	require.True(t, handlerCalled)

	spans := spanRecorder.Ended()
	require.Len(t, spans, 1)
	span := spans[0]
	require.Equal(t, "gRPC Server stream /internapi.v1.PrivateWorkerBridgeInternalService/Connect", span.Name())
	require.Equal(t, oteltrace.SpanKindServer, span.SpanKind())

	attrs := span.Attributes()
	requireStringAttribute(t, attrs, "grafana.grpc.rpc_type", "stream")
	requireStringAttribute(t, attrs, "rpc.system", "grpc")
	requireStringAttribute(t, attrs, "rpc.grpc.full_method", "/internapi.v1.PrivateWorkerBridgeInternalService/Connect")
	requireStringAttribute(t, attrs, "rpc.service", "internapi.v1.PrivateWorkerBridgeInternalService")
	requireStringAttribute(t, attrs, "rpc.method", "Connect")
	requireBoolAttribute(t, attrs, "rpc.grpc.stream", true)
	requireBoolAttribute(t, attrs, "rpc.grpc.stream.client", true)
	requireBoolAttribute(t, attrs, "rpc.grpc.stream.server", true)
}

func TestParseFullMethod(t *testing.T) {
	service, method := parseFullMethod("/internapi.v1.PrivateWorkerBridgeInternalService/Connect")
	require.Equal(t, "internapi.v1.PrivateWorkerBridgeInternalService", service)
	require.Equal(t, "Connect", method)

	service, method = parseFullMethod("malformed")
	require.Empty(t, service)
	require.Empty(t, method)
}

func requireStringAttribute(t *testing.T, attrs []attribute.KeyValue, key string, value string) {
	t.Helper()

	for _, attr := range attrs {
		if string(attr.Key) == key {
			require.Equal(t, value, attr.Value.AsString())
			return
		}
	}
	require.Failf(t, "missing span attribute", "attribute %q not found", key)
}

func requireBoolAttribute(t *testing.T, attrs []attribute.KeyValue, key string, value bool) {
	t.Helper()

	for _, attr := range attrs {
		if string(attr.Key) == key {
			require.Equal(t, value, attr.Value.AsBool())
			return
		}
	}
	require.Failf(t, "missing span attribute", "attribute %q not found", key)
}

type testServerStream struct {
	ctx context.Context
}

func (s *testServerStream) SetHeader(metadata.MD) error {
	return nil
}

func (s *testServerStream) SendHeader(metadata.MD) error {
	return nil
}

func (s *testServerStream) SetTrailer(metadata.MD) {
}

func (s *testServerStream) Context() context.Context {
	return s.ctx
}

func (s *testServerStream) SendMsg(any) error {
	return nil
}

func (s *testServerStream) RecvMsg(any) error {
	return nil
}
