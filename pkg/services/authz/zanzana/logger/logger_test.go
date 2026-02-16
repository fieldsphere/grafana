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

func TestZanzanaLoggerInfoFieldNormalization(t *testing.T) {
	testCases := []infoFieldCase{
		{
			name: "adds structured context",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.String("subject", "user-1"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertFieldsEqual(t, fields, []any{"subject", "user-1"})
			},
		},
		{
			name: "without fields omits zanzana fields",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked")
			},
			expectFields: false,
		},
		{
			name: "skipped field omits zanzana fields",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Skip())
			},
			expectFields: false,
		},
		{
			name: "namespace field keeps nested payload",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Namespace("auth"), zap.String("subject", "user-1"), zap.Int("attempt", 2))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespaceSubjectAndAttempt(t, fields, "auth", "user-1", 2)
			},
		},
		{
			name: "namespace only keeps empty namespace payload",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Namespace("auth"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespacePayloadEmpty(t, fields, "auth")
			},
		},
		{
			name: "namespace and skipped field keeps empty namespace payload",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Namespace("auth"), zap.Skip())
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespacePayloadEmpty(t, fields, "auth")
			},
		},
		{
			name: "nested namespace field keeps nested payload",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
			},
		},
		{
			name: "top-level and namespaced fields keep both payloads",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
			},
		},
		{
			name: "top-level namespace and skipped field keeps payload",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
			},
		},
	}

	runInfoFieldMatrix(t, testCases, "token checked")
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
	assertFieldsEqual(t, args, expected)
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
	assertFieldsEqual(t, args, expected)
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
	assertIntLikeValue(t, namespacePayload["attempt"], 2, namespacePayload)
}

func TestZapFieldsToArgsNamespaceOnlyProducesEmptyNamespacePayload(t *testing.T) {
	args := zapFieldsToArgs([]zap.Field{zap.Namespace("auth")})

	assertNamespacePayloadEmpty(t, args, "auth")
}

func TestZapFieldsToArgsNamespaceWithSkippedFieldKeepsEmptyNamespacePayload(t *testing.T) {
	args := zapFieldsToArgs([]zap.Field{zap.Namespace("auth"), zap.Skip()})

	assertNamespacePayloadEmpty(t, args, "auth")
}

func TestZapFieldsToArgsPreservesNestedNamespaceHierarchy(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.Namespace("auth"),
			zap.Namespace("token"),
			zap.String("subject", "user-1"),
		},
	)

	assertNestedNamespaceSubject(t, args, "auth", "token", "subject", "user-1")
}

func TestZapFieldsToArgsPreservesTopLevelAndNamespacedFields(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.String("subject", "user-1"),
			zap.Namespace("auth"),
			zap.String("token", "value"),
		},
	)

	assertTopLevelAndNamespacedFieldValue(t, args, "subject", "user-1", "auth", "token", "value")
}

func TestZapFieldsToArgsPreservesTopLevelAndEmptyNamespaceWhenSkipped(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.String("subject", "user-1"),
			zap.Namespace("auth"),
			zap.Skip(),
		},
	)

	assertTopLevelAndEmptyNamespacePayload(t, args, "subject", "user-1", "auth")
}

func TestZapFieldsToArgsPreservesDuplicateKeyOrder(t *testing.T) {
	args := zapFieldsToArgs(
		[]zap.Field{
			zap.String("scope", "first"),
			zap.String("scope", "second"),
		},
	)

	expected := []any{"scope", "first", "scope", "second"}
	assertFieldsEqual(t, args, expected)
}

func TestZanzanaLoggerWithContextNormalization(t *testing.T) {
	testCases := []withContextCase{
		{
			name:       "adds structured context",
			withFields: []zap.Field{zap.String("subject", "user-1"), zap.Int("count", 2)},
			assertFields: func(t *testing.T, fields []any) {
				assertFieldsEqual(t, fields, []any{"subject", "user-1", "count", int64(2)})
			},
		},
		{
			name:       "namespace field keeps nested context",
			withFields: []zap.Field{zap.Namespace("auth"), zap.String("subject", "user-1"), zap.Int("attempt", 2)},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespaceSubjectAndAttempt(t, fields, "auth", "user-1", 2)
			},
		},
		{
			name:       "namespace only keeps empty context",
			withFields: []zap.Field{zap.Namespace("auth")},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespacePayloadEmpty(t, fields, "auth")
			},
		},
		{
			name:       "namespace and skipped field keeps empty context",
			withFields: []zap.Field{zap.Namespace("auth"), zap.Skip()},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespacePayloadEmpty(t, fields, "auth")
			},
		},
		{
			name:       "nested namespace field keeps nested context",
			withFields: []zap.Field{zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1")},
			assertFields: func(t *testing.T, fields []any) {
				assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
			},
		},
		{
			name:       "top-level and namespaced fields keep both payloads",
			withFields: []zap.Field{zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value")},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
			},
		},
		{
			name:       "top-level namespace and skipped field keeps payload",
			withFields: []zap.Field{zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip()},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
			},
		},
		{
			name:          "without fields keeps empty context",
			withFields:    nil,
			expectContext: false,
		},
		{
			name:          "only skipped fields keep empty context",
			withFields:    []zap.Field{zap.Skip()},
			expectContext: false,
		},
		{
			name:       "mixed skipped fields filter skipped",
			withFields: []zap.Field{zap.Skip(), zap.String("subject", "user-1")},
			assertFields: func(t *testing.T, fields []any) {
				assertFieldsEqual(t, fields, []any{"subject", "user-1"})
			},
		},
		{
			name:       "preserves duplicate key order",
			withFields: []zap.Field{zap.String("scope", "first"), zap.String("scope", "second")},
			assertFields: func(t *testing.T, fields []any) {
				assertFieldsEqual(t, fields, []any{"scope", "first", "scope", "second"})
			},
		},
	}

	runWithContextMatrix(t, testCases)
}

func TestZanzanaLoggerErrorFamilyPreservesOriginalLevel(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("error message")
			},
			targetLogger:    "error",
			expectedLevel:   "error",
			expectedMessage: "error message",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("panic message")
			},
			targetLogger:    "error",
			expectedLevel:   "panic",
			expectedMessage: "panic message",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("fatal message")
			},
			targetLogger:    "error",
			expectedLevel:   "fatal",
			expectedMessage: "fatal message",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "panic message")
			},
			targetLogger:    "error",
			expectedLevel:   "panic",
			expectedMessage: "panic message",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "fatal message")
			},
			targetLogger:    "error",
			expectedLevel:   "fatal",
			expectedMessage: "fatal message",
		},
	}

	runLoggerLevelMatrix(t, testCases)
}

func TestZanzanaLoggerContextMethodsPreserveLevelRouting(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "debug message")
			},
			targetLogger:    "debug",
			expectedLevel:   "debug",
			expectedMessage: "debug message",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "info message")
			},
			targetLogger:    "info",
			expectedLevel:   "info",
			expectedMessage: "info message",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "warn message")
			},
			targetLogger:    "warn",
			expectedLevel:   "warn",
			expectedMessage: "warn message",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "error message")
			},
			targetLogger:    "error",
			expectedLevel:   "error",
			expectedMessage: "error message",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "panic message")
			},
			targetLogger:    "error",
			expectedLevel:   "panic",
			expectedMessage: "panic message",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "fatal message")
			},
			targetLogger:    "error",
			expectedLevel:   "fatal",
			expectedMessage: "fatal message",
		},
	}

	runLoggerLevelMatrix(t, testCases)
}

func TestZanzanaLoggerUnknownLevelFallsBackToInfo(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.emit("trace", "trace message")

	assertUnknownLevelContext(t, fake, "trace message", "trace", false)
}

func TestZanzanaLoggerUnknownLevelFieldPayloadsIncludeNormalizedFields(t *testing.T) {
	testCases := []unknownLevelFieldCase{
		{
			name: "flat fields",
			emit: func(logger *ZanzanaLogger) {
				logger.emit("trace", "trace message", zap.String("subject", "user-1"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertFieldsEqual(t, fields, []any{"subject", "user-1"})
			},
		},
		{
			name: "nested namespace fields",
			emit: func(logger *ZanzanaLogger) {
				logger.emit("trace", "trace message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
			},
		},
		{
			name: "namespace-only fields",
			emit: func(logger *ZanzanaLogger) {
				logger.emit("trace", "trace message", zap.Namespace("auth"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertNamespacePayloadEmpty(t, fields, "auth")
			},
		},
		{
			name: "top-level and namespaced fields",
			emit: func(logger *ZanzanaLogger) {
				logger.emit("trace", "trace message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
			},
		},
		{
			name: "top-level namespace and skipped field",
			emit: func(logger *ZanzanaLogger) {
				logger.emit("trace", "trace message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			assertFields: func(t *testing.T, fields []any) {
				assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
			},
		},
	}

	runUnknownLevelFieldMatrix(t, testCases, "trace message", "trace")
}

func TestZanzanaLoggerInfoWithContextAndNestedNamespaceFieldKeepsNestedPayload(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.InfoWithContext(context.Background(), "context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))

	ctx := assertSingleTargetLoggerCallAndContext(t, fake, "info")
	fields := assertFieldsPayload(t, ctx)
	assertMessageAndLevel(t, ctx, "context message", "info")
	assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
}

func TestZanzanaLoggerMethodsIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
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

	runLoggerFieldMatrix(t, testCases, "message", func(t *testing.T, fields []any) {
		assertFieldsEqual(t, fields, []any{"subject", "user-1"})
	})
}

func TestZanzanaLoggerMethodsWithNestedNamespaceIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debug",
			emit: func(logger *ZanzanaLogger) {
				logger.Debug("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "debug",
			expectedLevel: "debug",
		},
		{
			name: "info",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "info",
			expectedLevel: "info",
		},
		{
			name: "warn",
			emit: func(logger *ZanzanaLogger) {
				logger.Warn("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "warn",
			expectedLevel: "warn",
		},
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "error",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "panic",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("nested message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			targetLogger:  "error",
			expectedLevel: "fatal",
		},
	}

	runLoggerFieldMatrix(t, testCases, "nested message", func(t *testing.T, fields []any) {
		assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
	})
}

func TestZanzanaLoggerMethodsWithNamespaceOnlyIncludeEmptyNamespacePayload(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debug",
			emit: func(logger *ZanzanaLogger) {
				logger.Debug("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "debug",
			expectedLevel: "debug",
		},
		{
			name: "info",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "info",
			expectedLevel: "info",
		},
		{
			name: "warn",
			emit: func(logger *ZanzanaLogger) {
				logger.Warn("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "warn",
			expectedLevel: "warn",
		},
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "error",
			expectedLevel: "error",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "error",
			expectedLevel: "panic",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("namespace only message", zap.Namespace("auth"))
			},
			targetLogger:  "error",
			expectedLevel: "fatal",
		},
	}

	runLoggerFieldMatrix(t, testCases, "namespace only message", func(t *testing.T, fields []any) {
		assertNamespacePayloadEmpty(t, fields, "auth")
	})
}

func TestZanzanaLoggerMethodsWithTopLevelAndNamespacedFieldsIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debug",
			emit: func(logger *ZanzanaLogger) {
				logger.Debug("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "debug",
			expectedLevel: "debug",
		},
		{
			name: "info",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "info",
			expectedLevel: "info",
		},
		{
			name: "warn",
			emit: func(logger *ZanzanaLogger) {
				logger.Warn("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "warn",
			expectedLevel: "warn",
		},
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "error",
			expectedLevel: "error",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "error",
			expectedLevel: "panic",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("mixed message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			targetLogger:  "error",
			expectedLevel: "fatal",
		},
	}

	runLoggerFieldMatrix(t, testCases, "mixed message", func(t *testing.T, fields []any) {
		assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
	})
}

func TestZanzanaLoggerMethodsWithTopLevelNamespaceAndSkippedFieldIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debug",
			emit: func(logger *ZanzanaLogger) {
				logger.Debug("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "debug",
			expectedLevel: "debug",
		},
		{
			name: "info",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "info",
			expectedLevel: "info",
		},
		{
			name: "warn",
			emit: func(logger *ZanzanaLogger) {
				logger.Warn("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "warn",
			expectedLevel: "warn",
		},
		{
			name: "error",
			emit: func(logger *ZanzanaLogger) {
				logger.Error("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "error",
			expectedLevel: "error",
		},
		{
			name: "panic",
			emit: func(logger *ZanzanaLogger) {
				logger.Panic("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "error",
			expectedLevel: "panic",
		},
		{
			name: "fatal",
			emit: func(logger *ZanzanaLogger) {
				logger.Fatal("mixed skip message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			targetLogger:  "error",
			expectedLevel: "fatal",
		},
	}

	runLoggerFieldMatrix(t, testCases, "mixed skip message", func(t *testing.T, fields []any) {
		assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
	})
}

func TestZanzanaLoggerContextMethodsIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
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

	runLoggerFieldMatrix(t, testCases, "context message", func(t *testing.T, fields []any) {
		assertFieldsEqual(t, fields, []any{"subject", "user-1"})
	})
}

func TestZanzanaLoggerContextMethodsWithNamespaceOnlyIncludeEmptyNamespacePayload(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "debug",
			targetLogger:  "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "info",
			targetLogger:  "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "warn",
			targetLogger:  "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "error",
			targetLogger:  "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "panic",
			targetLogger:  "error",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "namespace only context message", zap.Namespace("auth"))
			},
			expectedLevel: "fatal",
			targetLogger:  "error",
		},
	}

	runLoggerFieldMatrix(t, testCases, "namespace only context message", func(t *testing.T, fields []any) {
		assertNamespacePayloadEmpty(t, fields, "auth")
	})
}

func TestZanzanaLoggerContextMethodsWithTopLevelAndNamespacedFieldsIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "debug",
			targetLogger:  "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "info",
			targetLogger:  "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "warn",
			targetLogger:  "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "error",
			targetLogger:  "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "panic",
			targetLogger:  "error",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "mixed context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
			},
			expectedLevel: "fatal",
			targetLogger:  "error",
		},
	}

	runLoggerFieldMatrix(t, testCases, "mixed context message", func(t *testing.T, fields []any) {
		assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
	})
}

func TestZanzanaLoggerContextMethodsWithTopLevelNamespaceAndSkippedFieldIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "debug",
			targetLogger:  "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "info",
			targetLogger:  "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "warn",
			targetLogger:  "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "error",
			targetLogger:  "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "panic",
			targetLogger:  "error",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "mixed skip context message", zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
			},
			expectedLevel: "fatal",
			targetLogger:  "error",
		},
	}

	runLoggerFieldMatrix(t, testCases, "mixed skip context message", func(t *testing.T, fields []any) {
		assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
	})
}

func TestZanzanaLoggerContextMethodsWithNestedNamespaceIncludeStructuredFields(t *testing.T) {
	testCases := []loggerFieldCase{
		{
			name: "debugWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.DebugWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "debug",
			targetLogger:  "debug",
		},
		{
			name: "infoWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.InfoWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "info",
			targetLogger:  "info",
		},
		{
			name: "warnWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.WarnWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "warn",
			targetLogger:  "warn",
		},
		{
			name: "errorWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.ErrorWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "error",
			targetLogger:  "error",
		},
		{
			name: "panicWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.PanicWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "panic",
			targetLogger:  "error",
		},
		{
			name: "fatalWithContext",
			emit: func(logger *ZanzanaLogger) {
				logger.FatalWithContext(context.Background(), "nested context message", zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
			},
			expectedLevel: "fatal",
			targetLogger:  "error",
		},
	}

	runLoggerFieldMatrix(t, testCases, "nested context message", func(t *testing.T, fields []any) {
		assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
	})
}

type loggerFieldCase struct {
	name            string
	emit            func(*ZanzanaLogger)
	targetLogger    string
	expectedLevel   string
	expectedMessage string
}

type unknownLevelFieldCase struct {
	name         string
	emit         func(*ZanzanaLogger)
	assertFields func(*testing.T, []any)
}

type infoFieldCase struct {
	name         string
	emit         func(*ZanzanaLogger)
	expectFields bool
	assertFields func(*testing.T, []any)
}

type withContextCase struct {
	name          string
	withFields    []zap.Field
	expectContext bool
	assertFields  func(*testing.T, []any)
}

func runLoggerFieldMatrix(t *testing.T, testCases []loggerFieldCase, expectedMessage string, assertFields func(t *testing.T, fields []any)) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			ctx := assertSingleTargetLoggerCallAndContext(t, fake, tc.targetLogger)
			fields := assertFieldsPayload(t, ctx)
			assertMessageAndLevel(t, ctx, expectedMessage, tc.expectedLevel)
			assertFields(t, fields)
		})
	}
}

func runLoggerLevelMatrix(t *testing.T, testCases []loggerFieldCase) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)
			ctx := assertSingleTargetLoggerCallAndContext(t, fake, tc.targetLogger)
			assertTargetLoggerEventMessage(t, fake, tc.targetLogger, "Zanzana logger event")
			if len(ctx) != 4 {
				t.Fatalf("expected structured level fields, got %#v", ctx)
			}

			expectedMessage := tc.expectedMessage
			if expectedMessage == "" {
				expectedMessage = tc.expectedLevel + " message"
			}
			assertMessageAndLevel(t, ctx, expectedMessage, tc.expectedLevel)
		})
	}
}

func runUnknownLevelFieldMatrix(t *testing.T, testCases []unknownLevelFieldCase, expectedMessage, expectedLevel string) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)
			fields := assertUnknownLevelContext(t, fake, expectedMessage, expectedLevel, true)
			tc.assertFields(t, fields)
		})
	}
}

func runInfoFieldMatrix(t *testing.T, testCases []infoFieldCase, expectedMessage string) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			expectFields := tc.expectFields || tc.assertFields != nil
			fields := assertInfoContext(t, fake, expectedMessage, expectFields)
			if tc.assertFields != nil {
				tc.assertFields(t, fields)
			}
		})
	}
}

func runWithContextMatrix(t *testing.T, testCases []withContextCase) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			capturing := &capturingLogger{}
			logger := New(capturing)

			child := logger.With(tc.withFields...)
			if child == nil {
				t.Fatal("expected non-nil logger")
			}

			expectContext := tc.expectContext || tc.assertFields != nil
			if !expectContext {
				assertSingleNewCallWithoutContext(t, capturing)
				return
			}

			fields := assertSingleNewCallContextFields(t, capturing)
			if tc.assertFields == nil {
				t.Fatal("expected assertFields callback when context payload is expected")
			}
			tc.assertFields(t, fields)
		})
	}
}

func assertSingleTargetLoggerCallAndContext(t *testing.T, fake *logtest.Fake, targetLogger string) []any {
	t.Helper()

	expectedDebugCalls := 0
	expectedInfoCalls := 0
	expectedWarnCalls := 0
	expectedErrorCalls := 0
	switch targetLogger {
	case "debug":
		expectedDebugCalls = 1
	case "info":
		expectedInfoCalls = 1
	case "warn":
		expectedWarnCalls = 1
	case "error":
		expectedErrorCalls = 1
	default:
		t.Fatalf("unknown target logger %q", targetLogger)
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

	switch targetLogger {
	case "debug":
		return fake.DebugLogs.Ctx
	case "info":
		return fake.InfoLogs.Ctx
	case "warn":
		return fake.WarnLogs.Ctx
	case "error":
		return fake.ErrorLogs.Ctx
	default:
		t.Fatalf("unknown target logger %q", targetLogger)
		return nil
	}
}

func assertMessageAndLevel(t *testing.T, ctx []any, expectedMessage, expectedLevel string) {
	t.Helper()

	if ctx[0] != "zanzanaMessage" || ctx[1] != expectedMessage {
		t.Fatalf("unexpected zanzana message context: %#v", ctx)
	}
	if ctx[2] != "zanzanaLevel" || ctx[3] != expectedLevel {
		t.Fatalf("unexpected zanzana level context: %#v", ctx)
	}
}

func assertTargetLoggerEventMessage(t *testing.T, fake *logtest.Fake, targetLogger, expectedMessage string) {
	t.Helper()

	var actualMessage string
	switch targetLogger {
	case "debug":
		actualMessage = fake.DebugLogs.Message
	case "info":
		actualMessage = fake.InfoLogs.Message
	case "warn":
		actualMessage = fake.WarnLogs.Message
	case "error":
		actualMessage = fake.ErrorLogs.Message
	default:
		t.Fatalf("unknown target logger %q", targetLogger)
	}

	if actualMessage != expectedMessage {
		t.Fatalf("unexpected logger event message: got=%q want=%q", actualMessage, expectedMessage)
	}
}

func assertSingleNewCallContextFields(t *testing.T, capturing *capturingLogger) []any {
	t.Helper()

	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}

	return assertContextPayloadFields(t, capturing.newCtx)
}

func assertSingleNewCallWithoutContext(t *testing.T, capturing *capturingLogger) {
	t.Helper()

	if capturing.newCalls != 1 {
		t.Fatalf("expected 1 call to New, got %d", capturing.newCalls)
	}
	if len(capturing.newCtx) != 0 {
		t.Fatalf("expected no context args, got %#v", capturing.newCtx)
	}
}

func assertUnknownLevelContext(t *testing.T, fake *logtest.Fake, expectedMessage, expectedLevel string, expectFields bool) []any {
	t.Helper()

	ctx := assertSingleTargetLoggerCallAndContext(t, fake, "info")
	assertMessageAndLevel(t, ctx, expectedMessage, expectedLevel)
	if !expectFields {
		if len(ctx) != 4 {
			t.Fatalf("expected message+level fields, got %#v", ctx)
		}
		return nil
	}

	return assertFieldsPayload(t, ctx)
}

func assertInfoContext(t *testing.T, fake *logtest.Fake, expectedMessage string, expectFields bool) []any {
	t.Helper()

	ctx := assertSingleTargetLoggerCallAndContext(t, fake, "info")
	assertMessageAndLevel(t, ctx, expectedMessage, "info")
	if !expectFields {
		if len(ctx) != 4 {
			t.Fatalf("expected message+level fields, got %#v", ctx)
		}
		return nil
	}

	return assertFieldsPayload(t, ctx)
}

func assertContextPayloadFields(t *testing.T, ctx []any) []any {
	t.Helper()

	if len(ctx) != 2 {
		t.Fatalf("expected context payload with two entries, got %#v", ctx)
	}
	if ctx[0] != "zanzanaContext" {
		t.Fatalf("expected zanzanaContext key, got %#v", ctx)
	}
	fields, ok := ctx[1].([]any)
	if !ok {
		t.Fatalf("expected zanzanaContext payload as []any, got %#v", ctx[1])
	}

	return fields
}

func assertFieldsPayload(t *testing.T, ctx []any) []any {
	t.Helper()

	if len(ctx) != 6 {
		t.Fatalf("expected message+level+fields context, got %#v", ctx)
	}
	if ctx[4] != "zanzanaFields" {
		t.Fatalf("expected zanzanaFields key, got %#v", ctx)
	}
	fields, ok := ctx[5].([]any)
	if !ok {
		t.Fatalf("expected zanzana fields payload as []any, got %#v", ctx[5])
	}

	return fields
}

func assertFieldsEqual(t *testing.T, fields []any, expected []any) {
	t.Helper()

	if len(fields) != len(expected) {
		t.Fatalf("unexpected fields length: got=%d want=%d (%#v)", len(fields), len(expected), fields)
	}
	for i := range expected {
		if fields[i] != expected[i] {
			t.Fatalf("unexpected field at index %d: got=%#v want=%#v (%#v)", i, fields[i], expected[i], fields)
		}
	}
}

func assertNamespacePayload(t *testing.T, fields []any, namespace string) map[string]any {
	t.Helper()

	if len(fields) != 2 {
		t.Fatalf("unexpected namespace payload length: got=%d want=%d (%#v)", len(fields), 2, fields)
	}
	if fields[0] != namespace {
		t.Fatalf("unexpected namespace key: got=%#v want=%#v (%#v)", fields[0], namespace, fields)
	}
	namespacePayload, ok := fields[1].(map[string]any)
	if !ok {
		t.Fatalf("expected namespace payload as map[string]any, got %#v", fields[1])
	}

	return namespacePayload
}

func assertNamespaceSubjectAndAttempt(t *testing.T, fields []any, namespace, expectedSubject string, expectedAttempt int64) {
	t.Helper()

	namespacePayload := assertNamespacePayload(t, fields, namespace)
	if namespacePayload["subject"] != expectedSubject {
		t.Fatalf("unexpected namespace subject payload: %#v", namespacePayload)
	}
	assertIntLikeValue(t, namespacePayload["attempt"], expectedAttempt, namespacePayload)
}

func assertNestedNamespacePayload(t *testing.T, payload map[string]any, namespace string) map[string]any {
	t.Helper()

	nestedPayloadValue, ok := payload[namespace]
	if !ok {
		t.Fatalf("expected nested namespace payload %q in %#v", namespace, payload)
	}
	nestedPayload, ok := nestedPayloadValue.(map[string]any)
	if !ok {
		t.Fatalf("expected nested namespace payload as map[string]any, got %#v", nestedPayloadValue)
	}

	return nestedPayload
}

func assertNamespacePayloadEmpty(t *testing.T, fields []any, namespace string) {
	t.Helper()

	namespacePayload := assertNamespacePayload(t, fields, namespace)
	if len(namespacePayload) != 0 {
		t.Fatalf("expected empty namespace payload for namespace-only field, got %#v", namespacePayload)
	}
}

func assertNestedNamespaceSubject(t *testing.T, fields []any, outerNamespace, innerNamespace, subjectKey, subjectValue string) {
	t.Helper()

	outerPayload := assertNamespacePayload(t, fields, outerNamespace)
	innerPayload := assertNestedNamespacePayload(t, outerPayload, innerNamespace)
	if innerPayload[subjectKey] != subjectValue {
		t.Fatalf("unexpected nested namespace subject payload: %#v", innerPayload)
	}
}

func assertNamespaceFieldValue(t *testing.T, fields []any, namespace, key, wantValue string) {
	t.Helper()

	namespacePayload := assertNamespacePayload(t, fields, namespace)
	if namespacePayload[key] != wantValue {
		t.Fatalf("unexpected namespace payload value for %q: got=%#v want=%#v (%#v)", key, namespacePayload[key], wantValue, namespacePayload)
	}
}

func assertTopLevelAndNamespacedFieldValue(t *testing.T, fields []any, topLevelKey string, topLevelValue any, namespace, namespaceKey, namespaceValue string) {
	t.Helper()

	if len(fields) != 4 {
		t.Fatalf("unexpected fields length: got=%d want=%d (%#v)", len(fields), 4, fields)
	}
	if fields[0] != topLevelKey || fields[1] != topLevelValue {
		t.Fatalf("unexpected top-level payload: %#v", fields)
	}
	assertNamespaceFieldValue(t, fields[2:], namespace, namespaceKey, namespaceValue)
}

func assertTopLevelAndEmptyNamespacePayload(t *testing.T, fields []any, topLevelKey string, topLevelValue any, namespace string) {
	t.Helper()

	if len(fields) != 4 {
		t.Fatalf("unexpected fields length: got=%d want=%d (%#v)", len(fields), 4, fields)
	}
	if fields[0] != topLevelKey || fields[1] != topLevelValue {
		t.Fatalf("unexpected top-level payload: %#v", fields)
	}
	assertNamespacePayloadEmpty(t, fields[2:], namespace)
}

func assertIntLikeValue(t *testing.T, value any, want int64, payload any) {
	t.Helper()

	switch actual := value.(type) {
	case int:
		if int64(actual) != want {
			t.Fatalf("unexpected integer payload: got=%d want=%d (%#v)", actual, want, payload)
		}
	case int64:
		if actual != want {
			t.Fatalf("unexpected integer payload: got=%d want=%d (%#v)", actual, want, payload)
		}
	default:
		t.Fatalf("unexpected integer payload type: %T (%#v)", value, payload)
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
