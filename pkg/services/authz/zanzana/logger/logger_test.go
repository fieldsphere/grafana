package logger

import (
	"context"
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
	if len(ctx) != 6 {
		t.Fatalf("expected structured ctx entries, got %#v", ctx)
	}

	if ctx[0] != "zanzanaMessage" || ctx[1] != "token checked" {
		t.Fatalf("expected zanzana message fields, got %#v", ctx)
	}
	if ctx[2] != "zanzanaLevel" || ctx[3] != "info" {
		t.Fatalf("expected zanzana level field, got %#v", ctx)
	}
	if ctx[4] != "zanzanaFields" {
		t.Fatalf("expected zanzana fields key, got %#v", ctx)
	}

	fields, ok := ctx[5].([]any)
	if !ok {
		t.Fatalf("expected zanzana fields as []any, got %#v", ctx[5])
	}
	expectedFields := []any{"subject", "user-1"}
	if len(fields) != len(expectedFields) {
		t.Fatalf("unexpected zanzana fields length: got=%d want=%d (%#v)", len(fields), len(expectedFields), fields)
	}
	for i := range expectedFields {
		if fields[i] != expectedFields[i] {
			t.Fatalf("unexpected zanzana field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expectedFields[i], fields)
		}
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

func TestZanzanaLoggerErrorFamilyPreservesOriginalLevel(t *testing.T) {
	testCases := []struct {
		name string
		emit func(*ZanzanaLogger)
	}{
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("error message")
			},
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("panic message")
			},
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("fatal message")
			},
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "panic message")
			},
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "fatal message")
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			if fake.ErrorLogs.Calls != 1 {
				t.Fatalf("expected 1 error call, got %d", fake.ErrorLogs.Calls)
			}
			if fake.ErrorLogs.Message != "Zanzana logger event" {
				t.Fatalf("unexpected message: %q", fake.ErrorLogs.Message)
			}
			if len(fake.ErrorLogs.Ctx) != 4 {
				t.Fatalf("expected 4 structured fields, got %#v", fake.ErrorLogs.Ctx)
			}
			if fake.ErrorLogs.Ctx[0] != "zanzanaMessage" {
				t.Fatalf("expected zanzanaMessage key, got %#v", fake.ErrorLogs.Ctx)
			}
			if fake.ErrorLogs.Ctx[2] != "zanzanaLevel" {
				t.Fatalf("expected zanzanaLevel key, got %#v", fake.ErrorLogs.Ctx)
			}

			expectedLevel := tc.name
			switch tc.name {
			case "panicWithContext":
				expectedLevel = "panic"
			case "fatalWithContext":
				expectedLevel = "fatal"
			}
			if fake.ErrorLogs.Ctx[3] != expectedLevel {
				t.Fatalf("expected zanzanaLevel=%q, got %#v (%#v)", expectedLevel, fake.ErrorLogs.Ctx[3], fake.ErrorLogs.Ctx)
			}
		})
	}
}
