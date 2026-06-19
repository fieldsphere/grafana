package tempo

import (
	"context"
	"io"
	"testing"
	"time"

	sdktracing "github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/codes"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func TestTracingStreamInterceptorEndsSpanWhenStreamCompletes(t *testing.T) {
	spanRecorder := tracetest.NewSpanRecorder()
	tracerProvider := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(spanRecorder))
	sdktracing.InitDefaultTracer(tracerProvider.Tracer("tempo-grpc-test"))

	interceptor := TracingStreamInterceptor()
	stream, err := interceptor(
		context.Background(),
		&grpc.StreamDesc{StreamName: "Search", ServerStreams: true},
		nil,
		"/tempo.StreamingQuerier/Search",
		func(ctx context.Context, desc *grpc.StreamDesc, cc *grpc.ClientConn, method string, opts ...grpc.CallOption) (grpc.ClientStream, error) {
			return &testClientStream{
				ctx:      ctx,
				recvErrs: []error{nil, io.EOF},
			}, nil
		},
	)
	require.NoError(t, err)
	require.Empty(t, spanRecorder.Ended())

	require.NoError(t, stream.RecvMsg(&struct{}{}))
	require.Empty(t, spanRecorder.Ended())

	require.ErrorIs(t, stream.RecvMsg(&struct{}{}), io.EOF)
	spans := spanRecorder.Ended()
	require.Len(t, spans, 1)
	assert.Equal(t, "tempo.grpc.stream", spans[0].Name())
	assert.Equal(t, codes.Ok, spans[0].Status().Code)
}

func TestObservedClientStreamFinishesOnceOnStreamCompletion(t *testing.T) {
	finished := make(chan error, 2)
	stream := newObservedClientStream(&testClientStream{
		ctx:      context.Background(),
		recvErrs: []error{nil, io.EOF},
	}, func(err error) {
		finished <- err
	})

	require.NoError(t, stream.RecvMsg(&struct{}{}))
	assertNoStreamFinish(t, finished)

	require.ErrorIs(t, stream.RecvMsg(&struct{}{}), io.EOF)
	assertStreamFinish(t, finished, io.EOF)

	require.ErrorIs(t, stream.RecvMsg(&struct{}{}), io.EOF)
	assertNoStreamFinish(t, finished)
}

func TestObservedClientStreamFinishesOnContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	finished := make(chan error, 2)
	stream := newObservedClientStream(&testClientStream{ctx: ctx}, func(err error) {
		finished <- err
	})

	cancel()
	assertStreamFinish(t, finished, context.Canceled)

	require.ErrorIs(t, stream.RecvMsg(&struct{}{}), io.EOF)
	assertNoStreamFinish(t, finished)
}

func TestGRPCStatusLabelTreatsEOFAsOK(t *testing.T) {
	assert.Equal(t, "OK", grpcStatusLabel(io.EOF))
}

func assertStreamFinish(t *testing.T, finished <-chan error, expected error) {
	t.Helper()

	select {
	case err := <-finished:
		require.ErrorIs(t, err, expected)
	case <-time.After(time.Second):
		t.Fatalf("expected stream to finish")
	}
}

func assertNoStreamFinish(t *testing.T, finished <-chan error) {
	t.Helper()

	select {
	case err := <-finished:
		t.Fatalf("expected stream to remain open, finished with %v", err)
	default:
	}
}

type testClientStream struct {
	ctx          context.Context
	recvErrs     []error
	sendErr      error
	closeSendErr error
}

func (s *testClientStream) Header() (metadata.MD, error) {
	return nil, nil
}

func (s *testClientStream) Trailer() metadata.MD {
	return nil
}

func (s *testClientStream) CloseSend() error {
	return s.closeSendErr
}

func (s *testClientStream) Context() context.Context {
	if s.ctx == nil {
		return context.Background()
	}
	return s.ctx
}

func (s *testClientStream) SendMsg(any) error {
	return s.sendErr
}

func (s *testClientStream) RecvMsg(any) error {
	if len(s.recvErrs) == 0 {
		return io.EOF
	}

	err := s.recvErrs[0]
	s.recvErrs = s.recvErrs[1:]
	return err
}
