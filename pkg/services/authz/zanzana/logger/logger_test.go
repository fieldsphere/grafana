package logger

import (
	"context"
	"testing"
	"time"

	"go.uber.org/zap"

	infraLog "github.com/grafana/grafana/pkg/infra/log"
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

func TestZanzanaLoggerInfoWithoutFieldsOmitsZanzanaFields(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.Info("token checked")

	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected 1 info call, got %d", fake.InfoLogs.Calls)
	}
	if fake.InfoLogs.Message != "Zanzana logger event" {
		t.Fatalf("unexpected message: %q", fake.InfoLogs.Message)
	}
	if len(fake.InfoLogs.Ctx) != 4 {
		t.Fatalf("expected only message+level fields, got %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[0] != "zanzanaMessage" || fake.InfoLogs.Ctx[1] != "token checked" {
		t.Fatalf("unexpected message context: %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[2] != "zanzanaLevel" || fake.InfoLogs.Ctx[3] != "info" {
		t.Fatalf("unexpected level context: %#v", fake.InfoLogs.Ctx)
	}
}

func TestZanzanaLoggerInfoWithSkippedFieldOmitsZanzanaFields(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.Info("token checked", zap.Skip())

	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected 1 info call, got %d", fake.InfoLogs.Calls)
	}
	if fake.InfoLogs.Message != "Zanzana logger event" {
		t.Fatalf("unexpected message: %q", fake.InfoLogs.Message)
	}
	if len(fake.InfoLogs.Ctx) != 4 {
		t.Fatalf("expected only message+level fields when payload is skipped, got %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[0] != "zanzanaMessage" || fake.InfoLogs.Ctx[1] != "token checked" {
		t.Fatalf("unexpected message context: %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[2] != "zanzanaLevel" || fake.InfoLogs.Ctx[3] != "info" {
		t.Fatalf("unexpected level context: %#v", fake.InfoLogs.Ctx)
	}
}

func TestZanzanaLoggerInfoWithNamespaceFieldKeepsNestedPayload(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.Info("token checked", zap.Namespace("auth"), zap.String("subject", "user-1"), zap.Int("attempt", 2))

	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected 1 info call, got %d", fake.InfoLogs.Calls)
	}
	if len(fake.InfoLogs.Ctx) != 6 {
		t.Fatalf("expected zanzana fields payload, got %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[4] != "zanzanaFields" {
		t.Fatalf("expected zanzanaFields key, got %#v", fake.InfoLogs.Ctx)
	}

	fields, ok := fake.InfoLogs.Ctx[5].([]any)
	if !ok {
		t.Fatalf("expected zanzana fields payload as []any, got %#v", fake.InfoLogs.Ctx[5])
	}
	if len(fields) != 2 {
		t.Fatalf("unexpected zanzana fields length: got=%d want=%d (%#v)", len(fields), 2, fields)
	}
	if fields[0] != "auth" {
		t.Fatalf("unexpected namespace key: %#v", fields)
	}

	namespacePayload, ok := fields[1].(map[string]any)
	if !ok {
		t.Fatalf("expected namespace payload as map[string]any, got %#v", fields[1])
	}
	if namespacePayload["subject"] != "user-1" {
		t.Fatalf("unexpected namespace subject payload: %#v", namespacePayload)
	}
	switch attempt := namespacePayload["attempt"].(type) {
	case int:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	case int64:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	default:
		t.Fatalf("unexpected namespace attempt type: %T (%#v)", namespacePayload["attempt"], namespacePayload)
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

func TestZapFieldsToArgsPreservesComplexValueTypes(t *testing.T) {
	timestamp := time.Unix(1700000000, 0).UTC()

	args := zapFieldsToArgs(
		[]zap.Field{
			zap.Any("meta", map[string]any{"k": "v"}),
			zap.Duration("duration", 3*time.Second),
			zap.Time("timestamp", timestamp),
		},
	)

	if len(args) != 6 {
		t.Fatalf("unexpected args length: got=%d want=%d (%#v)", len(args), 6, args)
	}

	if args[0] != "meta" {
		t.Fatalf("unexpected key at index 0: %#v", args)
	}
	meta, ok := args[1].(map[string]any)
	if !ok {
		t.Fatalf("expected meta payload as map[string]any, got %#v", args[1])
	}
	if len(meta) != 1 || meta["k"] != "v" {
		t.Fatalf("unexpected meta payload: %#v", meta)
	}

	if args[2] != "duration" || args[3] != 3*time.Second {
		t.Fatalf("unexpected duration payload: %#v", args[2:4])
	}
	if args[4] != "timestamp" || args[5] != timestamp {
		t.Fatalf("unexpected timestamp payload: %#v", args[4:6])
	}
}

func TestZapFieldsToArgsReturnsEmptySliceForNoFields(t *testing.T) {
	args := zapFieldsToArgs(nil)
	if len(args) != 0 {
		t.Fatalf("expected empty args for nil fields, got %#v", args)
	}

	args = zapFieldsToArgs([]zap.Field{})
	if len(args) != 0 {
		t.Fatalf("expected empty args for empty fields, got %#v", args)
	}
}

func TestZapFieldsToArgsSkipsNoOpFields(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.String("subject", "user-1"),
			zap.Skip(),
			zap.Int("count", 2),
		},
	)

	expected := []any{"subject", "user-1", "count", int64(2)}
	if len(args) != len(expected) {
		t.Fatalf("unexpected args length: got=%d want=%d (%#v)", len(args), len(expected), args)
	}
	for i := range expected {
		if args[i] != expected[i] {
			t.Fatalf("unexpected arg at index %d: got=%#v want=%#v (%#v)", i, args[i], expected[i], args)
		}
	}
}

func TestZapFieldsToArgsPreservesNamespaceHierarchy(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.Namespace("auth"),
			zap.String("subject", "user-1"),
			zap.Int("attempt", 2),
		},
	)

	if len(args) != 2 {
		t.Fatalf("unexpected args length: got=%d want=%d (%#v)", len(args), 2, args)
	}
	if args[0] != "auth" {
		t.Fatalf("unexpected namespace key: %#v", args)
	}

	namespacePayload, ok := args[1].(map[string]any)
	if !ok {
		t.Fatalf("expected namespace payload as map[string]any, got %#v", args[1])
	}
	if namespacePayload["subject"] != "user-1" {
		t.Fatalf("unexpected namespace subject payload: %#v", namespacePayload)
	}
	switch attempt := namespacePayload["attempt"].(type) {
	case int:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	case int64:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	default:
		t.Fatalf("unexpected namespace attempt type: %T (%#v)", namespacePayload["attempt"], namespacePayload)
	}
}

func TestZapFieldsToArgsPreservesDuplicateKeyOrder(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.String("scope", "first"),
			zap.String("scope", "second"),
		},
	)

	expected := []any{"scope", "first", "scope", "second"}
	if len(args) != len(expected) {
		t.Fatalf("unexpected args length: got=%d want=%d (%#v)", len(args), len(expected), args)
	}
	for i := range expected {
		if args[i] != expected[i] {
			t.Fatalf("unexpected arg at index %d: got=%#v want=%#v (%#v)", i, args[i], expected[i], args)
		}
	}
}

func TestZanzanaLoggerWithAddsStructuredContext(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With(zap.String("subject", "user-1"), zap.Int("count", 2))
	if child == nil {
		t.Fatal("expected non-nil logger")
	}

	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 2 {
		t.Fatalf("expected two context arguments, got %#v", capturing.newCtx)
	}
	if capturing.newCtx[0] != "zanzanaContext" {
		t.Fatalf("expected zanzanaContext key, got %#v", capturing.newCtx)
	}

	fields, ok := capturing.newCtx[1].([]any)
	if !ok {
		t.Fatalf("expected zanzanaContext payload to be []any, got %#v", capturing.newCtx[1])
	}
	expected := []any{"subject", "user-1", "count", int64(2)}
	if len(fields) != len(expected) {
		t.Fatalf("unexpected zanzanaContext field length: got=%d want=%d (%#v)", len(fields), len(expected), fields)
	}
	for i := range expected {
		if fields[i] != expected[i] {
			t.Fatalf("unexpected zanzanaContext field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expected[i], fields)
		}
	}
}

func TestZanzanaLoggerWithNamespaceFieldKeepsNestedContext(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With(zap.Namespace("auth"), zap.String("subject", "user-1"), zap.Int("attempt", 2))
	if child == nil {
		t.Fatal("expected non-nil logger")
	}
	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 2 || capturing.newCtx[0] != "zanzanaContext" {
		t.Fatalf("unexpected context payload: %#v", capturing.newCtx)
	}

	fields, ok := capturing.newCtx[1].([]any)
	if !ok {
		t.Fatalf("expected zanzanaContext payload to be []any, got %#v", capturing.newCtx[1])
	}
	if len(fields) != 2 {
		t.Fatalf("unexpected zanzanaContext field length: got=%d want=%d (%#v)", len(fields), 2, fields)
	}
	if fields[0] != "auth" {
		t.Fatalf("unexpected namespace key: %#v", fields)
	}

	namespacePayload, ok := fields[1].(map[string]any)
	if !ok {
		t.Fatalf("expected namespace payload as map[string]any, got %#v", fields[1])
	}
	if namespacePayload["subject"] != "user-1" {
		t.Fatalf("unexpected namespace subject payload: %#v", namespacePayload)
	}
	switch attempt := namespacePayload["attempt"].(type) {
	case int:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	case int64:
		if attempt != 2 {
			t.Fatalf("unexpected namespace attempt payload: %#v", namespacePayload)
		}
	default:
		t.Fatalf("unexpected namespace attempt type: %T (%#v)", namespacePayload["attempt"], namespacePayload)
	}
}

func TestZanzanaLoggerWithWithoutFieldsKeepsEmptyContext(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With()
	if child == nil {
		t.Fatal("expected non-nil logger")
	}

	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 0 {
		t.Fatalf("expected no context args for empty fields, got %#v", capturing.newCtx)
	}
}

func TestZanzanaLoggerWithOnlySkippedFieldsKeepsEmptyContext(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With(zap.Skip())
	if child == nil {
		t.Fatal("expected non-nil logger")
	}

	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 0 {
		t.Fatalf("expected no context args when all fields are skipped, got %#v", capturing.newCtx)
	}
}

func TestZanzanaLoggerWithMixedSkippedFieldsFiltersSkipped(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With(zap.Skip(), zap.String("subject", "user-1"))
	if child == nil {
		t.Fatal("expected non-nil logger")
	}
	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 2 || capturing.newCtx[0] != "zanzanaContext" {
		t.Fatalf("unexpected context payload: %#v", capturing.newCtx)
	}

	fields, ok := capturing.newCtx[1].([]any)
	if !ok {
		t.Fatalf("expected zanzanaContext payload to be []any, got %#v", capturing.newCtx[1])
	}
	expected := []any{"subject", "user-1"}
	if len(fields) != len(expected) {
		t.Fatalf("unexpected filtered field length: got=%d want=%d (%#v)", len(fields), len(expected), fields)
	}
	for i := range expected {
		if fields[i] != expected[i] {
			t.Fatalf("unexpected filtered field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expected[i], fields)
		}
	}
}

func TestZanzanaLoggerWithPreservesDuplicateKeyOrder(t *testing.T) {
	capturing := &capturingLogger{}
	logger := New(capturing)

	child := logger.With(zap.String("scope", "first"), zap.String("scope", "second"))
	if child == nil {
		t.Fatal("expected non-nil logger")
	}
	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 2 || capturing.newCtx[0] != "zanzanaContext" {
		t.Fatalf("unexpected context payload: %#v", capturing.newCtx)
	}

	fields, ok := capturing.newCtx[1].([]any)
	if !ok {
		t.Fatalf("expected zanzanaContext payload to be []any, got %#v", capturing.newCtx[1])
	}
	expected := []any{"scope", "first", "scope", "second"}
	if len(fields) != len(expected) {
		t.Fatalf("unexpected duplicate key payload length: got=%d want=%d (%#v)", len(fields), len(expected), fields)
	}
	for i := range expected {
		if fields[i] != expected[i] {
			t.Fatalf("unexpected duplicate key field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expected[i], fields)
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

func TestZanzanaLoggerContextMethodsPreserveLevelRouting(t *testing.T) {
	testCases := []struct {
		name               string
		emit               func(*ZanzanaLogger)
		expectedDebugCalls int
		expectedInfoCalls  int
		expectedWarnCalls  int
		expectedErrorCalls int
		expectedLevel      string
	}{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "debug message")
			},
			expectedDebugCalls: 1,
			expectedLevel:      "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "info message")
			},
			expectedInfoCalls: 1,
			expectedLevel:     "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "warn message")
			},
			expectedWarnCalls: 1,
			expectedLevel:     "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "error message")
			},
			expectedErrorCalls: 1,
			expectedLevel:      "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "panic message")
			},
			expectedErrorCalls: 1,
			expectedLevel:      "panic",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "fatal message")
			},
			expectedErrorCalls: 1,
			expectedLevel:      "fatal",
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			if fake.DebugLogs.Calls != tc.expectedDebugCalls {
				t.Fatalf("unexpected debug calls: got=%d want=%d", fake.DebugLogs.Calls, tc.expectedDebugCalls)
			}
			if fake.InfoLogs.Calls != tc.expectedInfoCalls {
				t.Fatalf("unexpected info calls: got=%d want=%d", fake.InfoLogs.Calls, tc.expectedInfoCalls)
			}
			if fake.WarnLogs.Calls != tc.expectedWarnCalls {
				t.Fatalf("unexpected warn calls: got=%d want=%d", fake.WarnLogs.Calls, tc.expectedWarnCalls)
			}
			if fake.ErrorLogs.Calls != tc.expectedErrorCalls {
				t.Fatalf("unexpected error calls: got=%d want=%d", fake.ErrorLogs.Calls, tc.expectedErrorCalls)
			}

			var ctx []any
			switch tc.expectedLevel {
			case "debug":
				ctx = fake.DebugLogs.Ctx
			case "info":
				ctx = fake.InfoLogs.Ctx
			case "warn":
				ctx = fake.WarnLogs.Ctx
			default:
				ctx = fake.ErrorLogs.Ctx
			}

			if len(ctx) < 4 {
				t.Fatalf("expected structured level fields, got %#v", ctx)
			}
			if ctx[2] != "zanzanaLevel" || ctx[3] != tc.expectedLevel {
				t.Fatalf("expected zanzanaLevel=%q, got %#v", tc.expectedLevel, ctx)
			}
		})
	}
}

func TestZanzanaLoggerUnknownLevelFallsBackToInfo(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.emit("trace", "trace message")

	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected fallback to info logger, got %d info calls", fake.InfoLogs.Calls)
	}
	if fake.ErrorLogs.Calls != 0 || fake.WarnLogs.Calls != 0 || fake.DebugLogs.Calls != 0 {
		t.Fatalf("unexpected non-info calls: debug=%d info=%d warn=%d error=%d", fake.DebugLogs.Calls, fake.InfoLogs.Calls, fake.WarnLogs.Calls, fake.ErrorLogs.Calls)
	}
	if len(fake.InfoLogs.Ctx) != 4 {
		t.Fatalf("expected message+level fields, got %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[2] != "zanzanaLevel" || fake.InfoLogs.Ctx[3] != "trace" {
		t.Fatalf("unexpected fallback level context: %#v", fake.InfoLogs.Ctx)
	}
}

func TestZanzanaLoggerUnknownLevelWithFieldsIncludesNormalizedFields(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.emit("trace", "trace message", zap.String("subject", "user-1"))

	if fake.InfoLogs.Calls != 1 {
		t.Fatalf("expected fallback to info logger, got %d info calls", fake.InfoLogs.Calls)
	}
	if fake.ErrorLogs.Calls != 0 || fake.WarnLogs.Calls != 0 || fake.DebugLogs.Calls != 0 {
		t.Fatalf("unexpected non-info calls: debug=%d info=%d warn=%d error=%d", fake.DebugLogs.Calls, fake.InfoLogs.Calls, fake.WarnLogs.Calls, fake.ErrorLogs.Calls)
	}
	if len(fake.InfoLogs.Ctx) != 6 {
		t.Fatalf("expected message+level+fields context, got %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[0] != "zanzanaMessage" || fake.InfoLogs.Ctx[1] != "trace message" {
		t.Fatalf("unexpected fallback message context: %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[2] != "zanzanaLevel" || fake.InfoLogs.Ctx[3] != "trace" {
		t.Fatalf("unexpected fallback level context: %#v", fake.InfoLogs.Ctx)
	}
	if fake.InfoLogs.Ctx[4] != "zanzanaFields" {
		t.Fatalf("expected zanzanaFields key, got %#v", fake.InfoLogs.Ctx)
	}
	fields, ok := fake.InfoLogs.Ctx[5].([]any)
	if !ok {
		t.Fatalf("expected zanzana fields payload as []any, got %#v", fake.InfoLogs.Ctx[5])
	}
	expected := []any{"subject", "user-1"}
	if len(fields) != len(expected) {
		t.Fatalf("unexpected fallback fields length: got=%d want=%d (%#v)", len(fields), len(expected), fields)
	}
	for i := range expected {
		if fields[i] != expected[i] {
			t.Fatalf("unexpected fallback field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expected[i], fields)
		}
	}
}

func TestZanzanaLoggerMethodsIncludeStructuredFields(t *testing.T) {
	testCases := []struct {
		name          string
		emit          func(*ZanzanaLogger)
		targetLogger  string
		expectedLevel string
	}{
		{
			name: "debug",
			emit: func(logger *ZanzanaLogger) {
				logger.Debug("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "debug",
			expectedLevel: "debug",
		},
		{
			name: "info",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "info",
			expectedLevel: "info",
		},
		{
			name: "warn",
			emit: func(logger *ZanzanaLogger) {
				logger.Warn("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "warn",
			expectedLevel: "warn",
		},
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "error",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "panic",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("message", zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "fatal",
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			expectedDebugCalls := 0
			expectedInfoCalls := 0
			expectedWarnCalls := 0
			expectedErrorCalls := 0
			switch tc.targetLogger {
			case "debug":
				expectedDebugCalls = 1
			case "info":
				expectedInfoCalls = 1
			case "warn":
				expectedWarnCalls = 1
			case "error":
				expectedErrorCalls = 1
			default:
				t.Fatalf("unknown target logger %q", tc.targetLogger)
			}

			if fake.DebugLogs.Calls != expectedDebugCalls {
				t.Fatalf("unexpected debug calls: got=%d want=%d", fake.DebugLogs.Calls, expectedDebugCalls)
			}
			if fake.InfoLogs.Calls != expectedInfoCalls {
				t.Fatalf("unexpected info calls: got=%d want=%d", fake.InfoLogs.Calls, expectedInfoCalls)
			}
			if fake.WarnLogs.Calls != expectedWarnCalls {
				t.Fatalf("unexpected warn calls: got=%d want=%d", fake.WarnLogs.Calls, expectedWarnCalls)
			}
			if fake.ErrorLogs.Calls != expectedErrorCalls {
				t.Fatalf("unexpected error calls: got=%d want=%d", fake.ErrorLogs.Calls, expectedErrorCalls)
			}

			var ctx []any
			switch tc.targetLogger {
			case "debug":
				ctx = fake.DebugLogs.Ctx
			case "info":
				ctx = fake.InfoLogs.Ctx
			case "warn":
				ctx = fake.WarnLogs.Ctx
			case "error":
				ctx = fake.ErrorLogs.Ctx
			}

			if len(ctx) != 6 {
				t.Fatalf("expected structured context with fields, got %#v", ctx)
			}
			if ctx[0] != "zanzanaMessage" || ctx[1] != "message" {
				t.Fatalf("unexpected zanzana message context: %#v", ctx)
			}
			if ctx[2] != "zanzanaLevel" || ctx[3] != tc.expectedLevel {
				t.Fatalf("unexpected zanzana level context: %#v", ctx)
			}
			if ctx[4] != "zanzanaFields" {
				t.Fatalf("expected zanzanaFields key, got %#v", ctx)
			}

			fields, ok := ctx[5].([]any)
			if !ok {
				t.Fatalf("expected zanzana fields payload as []any, got %#v", ctx[5])
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
		})
	}
}

func TestZanzanaLoggerContextMethodsIncludeStructuredFields(t *testing.T) {
	testCases := []struct {
		name          string
		emit          func(*ZanzanaLogger)
		expectedLevel string
		targetLogger  string
	}{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "debug",
			targetLogger:  "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "info",
			targetLogger:  "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "warn",
			targetLogger:  "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "error",
			targetLogger:  "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "panic",
			targetLogger:  "error",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "context message", zap.String("subject", "user-1"))
			},
			expectedLevel: "fatal",
			targetLogger:  "error",
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			expectedDebugCalls := 0
			expectedInfoCalls := 0
			expectedWarnCalls := 0
			expectedErrorCalls := 0
			switch tc.targetLogger {
			case "debug":
				expectedDebugCalls = 1
			case "info":
				expectedInfoCalls = 1
			case "warn":
				expectedWarnCalls = 1
			case "error":
				expectedErrorCalls = 1
			default:
				t.Fatalf("unknown target logger %q", tc.targetLogger)
			}

			if fake.DebugLogs.Calls != expectedDebugCalls {
				t.Fatalf("unexpected debug calls: got=%d want=%d", fake.DebugLogs.Calls, expectedDebugCalls)
			}
			if fake.InfoLogs.Calls != expectedInfoCalls {
				t.Fatalf("unexpected info calls: got=%d want=%d", fake.InfoLogs.Calls, expectedInfoCalls)
			}
			if fake.WarnLogs.Calls != expectedWarnCalls {
				t.Fatalf("unexpected warn calls: got=%d want=%d", fake.WarnLogs.Calls, expectedWarnCalls)
			}
			if fake.ErrorLogs.Calls != expectedErrorCalls {
				t.Fatalf("unexpected error calls: got=%d want=%d", fake.ErrorLogs.Calls, expectedErrorCalls)
			}

			var ctx []any
			switch tc.targetLogger {
			case "debug":
				ctx = fake.DebugLogs.Ctx
			case "info":
				ctx = fake.InfoLogs.Ctx
			case "warn":
				ctx = fake.WarnLogs.Ctx
			case "error":
				ctx = fake.ErrorLogs.Ctx
			}

			if len(ctx) != 6 {
				t.Fatalf("expected structured context with fields, got %#v", ctx)
			}
			if ctx[0] != "zanzanaMessage" || ctx[1] != "context message" {
				t.Fatalf("unexpected zanzana message context: %#v", ctx)
			}
			if ctx[2] != "zanzanaLevel" || ctx[3] != tc.expectedLevel {
				t.Fatalf("unexpected zanzana level context: %#v", ctx)
			}
			if ctx[4] != "zanzanaFields" {
				t.Fatalf("expected zanzanaFields key, got %#v", ctx)
			}

			fields, ok := ctx[5].([]any)
			if !ok {
				t.Fatalf("expected zanzana fields payload as []any, got %#v", ctx[5])
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
		})
	}
}

type capturingLogger struct {
	newCalls int
	newCtx   []any
}

func (c *capturingLogger) New(ctx ...any) *infraLog.ConcreteLogger {
	c.newCalls++
	c.newCtx = append([]any(nil), ctx...)
	return infraLog.NewNopLogger()
}

func (c *capturingLogger) Log(_ ...any) error { return nil }

func (c *capturingLogger) Debug(_ string, _ ...any) {}

func (c *capturingLogger) Info(_ string, _ ...any) {}

func (c *capturingLogger) Warn(_ string, _ ...any) {}

func (c *capturingLogger) Error(_ string, _ ...any) {}

func (c *capturingLogger) FromContext(_ context.Context) infraLog.Logger { return c }
