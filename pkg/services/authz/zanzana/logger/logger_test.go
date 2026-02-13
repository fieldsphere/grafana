package logger

import (
	"testing"

	"go.uber.org/zap"

	"github.com/grafana/grafana/pkg/infra/log/logtest"
)

func TestZanzanaLoggerLevelRouting(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.Debug("debug message", zap.String("component", "authz"))
	logger.Info("info message")
	logger.Warn("warn message")
	logger.Error("error message")
	logger.Panic("panic message")
	logger.Fatal("fatal message")

	if fake.DebugLogs.Calls != 1 {
		t.Fatalf("expected 1 debug call, got %d", fake.DebugLogs.Calls)
	}
	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected 1 info call, got %d", fake.InfoLogs.Calls)
	}
	if fake.WarnLogs.Calls != 1 {
		t.Fatalf("expected 1 warn call, got %d", fake.WarnLogs.Calls)
	}
	// Error + panic + fatal all route to error severity.
	if fake.ErrorLogs.Calls != 3 {
		t.Fatalf("expected 3 error calls, got %d", fake.ErrorLogs.Calls)
	}
}

func TestZanzanaLoggerAddsStructuredContext(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.Info("token checked", zap.String("subject", "user-1"))

	if fake.InfoLogs.Message != "Zanzana logger event" {
		t.Fatalf("unexpected message: %q", fake.InfoLogs.Message)
	}

	ctx := fake.InfoLogs.Ctx
	if len(ctx) < 4 {
		t.Fatalf("expected structured ctx entries, got %#v", ctx)
	}

	if ctx[0] != "subject" || ctx[1] != "user-1" {
		t.Fatalf("expected zap field in context, got %#v", ctx)
	}
	if ctx[2] != "zanzana_message" || ctx[3] != "token checked" {
		t.Fatalf("expected zanzana message fields, got %#v", ctx)
	}
}

func TestZapFieldsToArgsPreservesTypedValues(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.Bool("enabled", true),
			zap.Int("count", 3),
			zap.String("scope", "global"),
		},
	)

	expected := []any{"enabled", true, "count", int64(3), "scope", "global"}
	if len(args) != len(expected) {
		t.Fatalf("unexpected args length: got=%d want=%d (%#v)", len(args), len(expected), args)
	}
	for i := range expected {
		if args[i] != expected[i] {
			t.Fatalf("unexpected arg at index %d: got=%#v want=%#v (args=%#v)", i, args[i], expected[i], args)
		}
	}
}
