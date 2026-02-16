package logger

import (
	"context"
	"testing"
	"time"

	"go.uber.org/zap"

	infraLog "github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/log/logtest"
)

const (
	zanzanaEventMessageKey  = "zanzanaMessage"
	zanzanaEventLevelKey    = "zanzanaLevel"
	zanzanaEventFieldsKey   = "zanzanaFields"
	zanzanaEventContextKey  = "zanzanaContext"
	zanzanaEventMessageText = "Zanzana logger event"

	zanzanaMessageLevelContextLen = 4
	zanzanaMessageLevelFieldsLen  = 6
	zanzanaWithContextPayloadLen  = 2
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
	testCases := []targetFieldCase{
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
		},
		{
			name: "skipped field omits zanzana fields",
			emit: func(logger *ZanzanaLogger) {
				logger.Info("token checked", zap.Skip())
			},
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

	runTargetFieldMatrix(t, "info", "token checked", "info", testCases)
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
			name:       "without fields keeps empty context",
			withFields: nil,
		},
		{
			name:       "only skipped fields keep empty context",
			withFields: []zap.Field{zap.Skip()},
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
	testCases := append(standardMethodCases("", false), standardMethodCases("", true)...)
	testCases = filterLoggerCases(testCases, "error", "panic", "fatal", "panicWithContext", "fatalWithContext")

	runLoggerFieldMatrix(t, testCases, nil)
}

func TestZanzanaLoggerContextMethodsPreserveLevelRouting(t *testing.T) {
	testCases := standardMethodCases("", true)

	runLoggerFieldMatrix(t, testCases, nil)
}

func TestZanzanaLoggerUnknownLevelFallsBackToInfo(t *testing.T) {
	fake := &logtest.Fake{}
	logger := New(fake)

	logger.emit("trace", "trace message")

	assertTargetLevelContext(t, fake, "info", "trace message", "trace", false)
}

func TestZanzanaLoggerUnknownLevelFieldPayloadsIncludeNormalizedFields(t *testing.T) {
	testCases := []targetFieldCase{
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

	runTargetFieldMatrix(t, "info", "trace message", "trace", testCases)
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
	runStandardMethodFieldMatrix(t, "message", false, func(t *testing.T, fields []any) {
		assertFieldsEqual(t, fields, []any{"subject", "user-1"})
	}, zap.String("subject", "user-1"))
}

func TestZanzanaLoggerMethodsWithNestedNamespaceIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "nested message", false, func(t *testing.T, fields []any) {
		assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
	}, zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
}

func TestZanzanaLoggerMethodsWithNamespaceOnlyIncludeEmptyNamespacePayload(t *testing.T) {
	runStandardMethodFieldMatrix(t, "namespace only message", false, func(t *testing.T, fields []any) {
		assertNamespacePayloadEmpty(t, fields, "auth")
	}, zap.Namespace("auth"))
}

func TestZanzanaLoggerMethodsWithTopLevelAndNamespacedFieldsIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "mixed message", false, func(t *testing.T, fields []any) {
		assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
	}, zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
}

func TestZanzanaLoggerMethodsWithTopLevelNamespaceAndSkippedFieldIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "mixed skip message", false, func(t *testing.T, fields []any) {
		assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
	}, zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
}

func TestZanzanaLoggerContextMethodsIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "context message", true, func(t *testing.T, fields []any) {
		assertFieldsEqual(t, fields, []any{"subject", "user-1"})
	}, zap.String("subject", "user-1"))
}

func TestZanzanaLoggerContextMethodsWithNamespaceOnlyIncludeEmptyNamespacePayload(t *testing.T) {
	runStandardMethodFieldMatrix(t, "namespace only context message", true, func(t *testing.T, fields []any) {
		assertNamespacePayloadEmpty(t, fields, "auth")
	}, zap.Namespace("auth"))
}

func TestZanzanaLoggerContextMethodsWithTopLevelAndNamespacedFieldsIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "mixed context message", true, func(t *testing.T, fields []any) {
		assertTopLevelAndNamespacedFieldValue(t, fields, "subject", "user-1", "auth", "token", "value")
	}, zap.String("subject", "user-1"), zap.Namespace("auth"), zap.String("token", "value"))
}

func TestZanzanaLoggerContextMethodsWithTopLevelNamespaceAndSkippedFieldIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "mixed skip context message", true, func(t *testing.T, fields []any) {
		assertTopLevelAndEmptyNamespacePayload(t, fields, "subject", "user-1", "auth")
	}, zap.String("subject", "user-1"), zap.Namespace("auth"), zap.Skip())
}

func TestZanzanaLoggerContextMethodsWithNestedNamespaceIncludeStructuredFields(t *testing.T) {
	runStandardMethodFieldMatrix(t, "nested context message", true, func(t *testing.T, fields []any) {
		assertNestedNamespaceSubject(t, fields, "auth", "token", "subject", "user-1")
	}, zap.Namespace("auth"), zap.Namespace("token"), zap.String("subject", "user-1"))
}

func TestStandardMethodCasesBuildsExpectedMetadata(t *testing.T) {
	t.Run("default message non-context", func(t *testing.T) {
		cases := standardMethodCases("", false)
		assertCaseMetadata(t, cases, expectedStandardCaseMetadata("", false))
	})

	t.Run("default message context", func(t *testing.T) {
		cases := standardMethodCases("", true)
		assertCaseMetadata(t, cases, expectedStandardCaseMetadata("", true))
	})

	t.Run("custom message", func(t *testing.T) {
		cases := standardMethodCases("custom message", false)
		assertCaseMetadata(t, cases, expectedStandardCaseMetadata("custom message", false))
	})

	t.Run("custom message context", func(t *testing.T) {
		cases := standardMethodCases("custom context message", true)
		assertCaseMetadata(t, cases, expectedStandardCaseMetadata("custom context message", true))
	})
}

func TestLoggerMethodMessage(t *testing.T) {
	testCases := []struct {
		name    string
		level   string
		message string
		want    string
	}{
		{name: "uses explicit message", level: "info", message: "custom message", want: "custom message"},
		{name: "generates default debug message", level: "debug", message: "", want: "debug message"},
		{name: "generates default fatal message", level: "fatal", message: "", want: "fatal message"},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			got := loggerMethodMessage(tc.level, tc.message)
			if got != tc.want {
				t.Fatalf("unexpected generated message: got=%q want=%q", got, tc.want)
			}
		})
	}
}

func TestEmitByLevelPanicsOnUnknownLevel(t *testing.T) {
	logger := New(&logtest.Fake{})

	assertPanicsWithMessage(t, "unexpected log level: trace", func() {
		emitByLevel(logger, "trace", "trace message")
	})
}

func TestEmitWithContextByLevelPanicsOnUnknownLevel(t *testing.T) {
	logger := New(&logtest.Fake{})

	assertPanicsWithMessage(t, "unexpected context log level: trace", func() {
		emitWithContextByLevel(logger, "trace", "trace message")
	})
}

func assertPanicsWithMessage(t *testing.T, expectedMessage string, fn func()) {
	t.Helper()

	defer func() {
		recovered := recover()
		if recovered == nil {
			t.Fatalf("expected panic with message %q", expectedMessage)
		}
		if recovered != expectedMessage {
			t.Fatalf("unexpected panic payload: %#v", recovered)
		}
	}()

	fn()
}

func TestFilterLoggerCasesPreservesSourceOrder(t *testing.T) {
	cases := standardMethodCases("", true)
	t.Run("preserves source order", func(t *testing.T) {
		filtered := filterLoggerCases(cases, "fatalWithContext", "warnWithContext")
		if len(filtered) != 2 {
			t.Fatalf("unexpected filtered case count: got=%d want=%d", len(filtered), 2)
		}
		if filtered[0].name != "warnWithContext" || filtered[1].name != "fatalWithContext" {
			t.Fatalf("unexpected filtered case order: %#v", []string{filtered[0].name, filtered[1].name})
		}
	})

	t.Run("ignores unknown names", func(t *testing.T) {
		filtered := filterLoggerCases(cases, "missingWithContext", "debugWithContext")
		if len(filtered) != 1 {
			t.Fatalf("unexpected filtered case count: got=%d want=%d", len(filtered), 1)
		}
		if filtered[0].name != "debugWithContext" {
			t.Fatalf("unexpected filtered case: got=%q want=%q", filtered[0].name, "debugWithContext")
		}
	})

	t.Run("empty allowlist returns empty result", func(t *testing.T) {
		filtered := filterLoggerCases(cases)
		if len(filtered) != 0 {
			t.Fatalf("expected empty filtered result for empty allowlist, got %#v", filtered)
		}
	})
}

type loggerFieldCase struct {
	name            string
	emit            func(*ZanzanaLogger)
	targetLogger    string
	expectedLevel   string
	expectedMessage string
}

type loggerMethodSpec struct {
	level        string
	targetLogger string
}

type targetFieldCase struct {
	name         string
	emit         func(*ZanzanaLogger)
	assertFields func(*testing.T, []any)
}

type withContextCase struct {
	name         string
	withFields   []zap.Field
	assertFields func(*testing.T, []any)
}

func standardMethodCases(message string, withContext bool, fields ...zap.Field) []loggerFieldCase {
	fieldCopy := append([]zap.Field(nil), fields...)
	specs := defaultMethodSpecs()

	testCases := make([]loggerFieldCase, 0, len(specs))
	for _, spec := range specs {
		spec := spec
		caseName := spec.level
		if withContext {
			caseName += "WithContext"
		}
		caseMessage := loggerMethodMessage(spec.level, message)

		emit := func(logger *ZanzanaLogger) {
			if withContext {
				emitWithContextByLevel(logger, spec.level, caseMessage, fieldCopy...)
				return
			}

			emitByLevel(logger, spec.level, caseMessage, fieldCopy...)
		}

		testCases = append(testCases, loggerFieldCase{
			name:            caseName,
			emit:            emit,
			targetLogger:    spec.targetLogger,
			expectedLevel:   spec.level,
			expectedMessage: caseMessage,
		})
	}

	return testCases
}

func emitByLevel(logger *ZanzanaLogger, level, message string, fields ...zap.Field) {
	switch level {
	case "debug":
		logger.Debug(message, fields...)
	case "info":
		logger.Info(message, fields...)
	case "warn":
		logger.Warn(message, fields...)
	case "error":
		logger.Error(message, fields...)
	case "panic":
		logger.Panic(message, fields...)
	case "fatal":
		logger.Fatal(message, fields...)
	default:
		panic("unexpected log level: " + level)
	}
}

func emitWithContextByLevel(logger *ZanzanaLogger, level, message string, fields ...zap.Field) {
	switch level {
	case "debug":
		logger.DebugWithContext(context.Background(), message, fields...)
	case "info":
		logger.InfoWithContext(context.Background(), message, fields...)
	case "warn":
		logger.WarnWithContext(context.Background(), message, fields...)
	case "error":
		logger.ErrorWithContext(context.Background(), message, fields...)
	case "panic":
		logger.PanicWithContext(context.Background(), message, fields...)
	case "fatal":
		logger.FatalWithContext(context.Background(), message, fields...)
	default:
		panic("unexpected context log level: " + level)
	}
}

func loggerMethodMessage(level, message string) string {
	if message != "" {
		return message
	}

	return level + " message"
}

func expectedStandardCaseMetadata(message string, withContext bool) []loggerFieldCase {
	specs := defaultMethodSpecs()

	expected := make([]loggerFieldCase, 0, len(specs))
	for _, spec := range specs {
		name := spec.level
		if withContext {
			name += "WithContext"
		}
		expected = append(expected, loggerFieldCase{
			name:            name,
			targetLogger:    spec.targetLogger,
			expectedLevel:   spec.level,
			expectedMessage: loggerMethodMessage(spec.level, message),
		})
	}

	return expected
}

func defaultMethodSpecs() []loggerMethodSpec {
	return []loggerMethodSpec{
		{level: "debug", targetLogger: "debug"},
		{level: "info", targetLogger: "info"},
		{level: "warn", targetLogger: "warn"},
		{level: "error", targetLogger: "error"},
		{level: "panic", targetLogger: "error"},
		{level: "fatal", targetLogger: "error"},
	}
}

func filterLoggerCases(cases []loggerFieldCase, names ...string) []loggerFieldCase {
	allowlist := make(map[string]struct{}, len(names))
	for _, name := range names {
		allowlist[name] = struct{}{}
	}

	filtered := make([]loggerFieldCase, 0, len(cases))
	for _, tc := range cases {
		if _, ok := allowlist[tc.name]; ok {
			filtered = append(filtered, tc)
		}
	}

	return filtered
}

func runLoggerFieldMatrix(t *testing.T, testCases []loggerFieldCase, assertFields func(t *testing.T, fields []any)) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			message := tc.expectedMessage
			if message == "" {
				message = tc.expectedLevel + " message"
			}

			expectFields := assertFields != nil
			fields := assertTargetLevelContext(t, fake, tc.targetLogger, message, tc.expectedLevel, expectFields)
			if assertFields != nil {
				assertFields(t, fields)
			}
		})
	}
}

func runStandardMethodFieldMatrix(t *testing.T, message string, withContext bool, assertFields func(t *testing.T, fields []any), fields ...zap.Field) {
	t.Helper()

	testCases := standardMethodCases(message, withContext, fields...)
	runLoggerFieldMatrix(t, testCases, assertFields)
}

func runTargetFieldMatrix(t *testing.T, targetLogger, expectedMessage, expectedLevel string, testCases []targetFieldCase) {
	t.Helper()

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fake := &logtest.Fake{}
			logger := New(fake)

			tc.emit(logger)

			if tc.assertFields == nil {
				assertTargetLevelContext(t, fake, targetLogger, expectedMessage, expectedLevel, false)
				return
			}

			fields := assertTargetLevelContext(t, fake, targetLogger, expectedMessage, expectedLevel, true)
			tc.assertFields(t, fields)
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

			if tc.assertFields == nil {
				assertSingleNewCallWithoutContext(t, capturing)
				return
			}

			fields := assertSingleNewCallContextFields(t, capturing)
			tc.assertFields(t, fields)
		})
	}
}

func assertSingleTargetLoggerCallAndContext(t *testing.T, fake *logtest.Fake, targetLogger string) []any {
	t.Helper()

	logsByLevel := map[string]*logtest.Logs{
		"debug": &fake.DebugLogs,
		"info":  &fake.InfoLogs,
		"warn":  &fake.WarnLogs,
		"error": &fake.ErrorLogs,
	}

	targetLogs, ok := logsByLevel[targetLogger]
	if !ok {
		t.Fatalf("unknown target logger %q", targetLogger)
	}

	expectedCalls := map[string]int{
		"debug": 0,
		"info":  0,
		"warn":  0,
		"error": 0,
	}
	expectedCalls[targetLogger] = 1

	for level, logs := range logsByLevel {
		if logs.Calls != expectedCalls[level] {
			t.Fatalf("unexpected %s calls: got=%d want=%d", level, logs.Calls, expectedCalls[level])
		}
	}

	if targetLogs.Message != zanzanaEventMessageText {
		t.Fatalf("unexpected logger event message: got=%q want=%q", targetLogs.Message, zanzanaEventMessageText)
	}

	return targetLogs.Ctx
}

func assertMessageAndLevel(t *testing.T, ctx []any, expectedMessage, expectedLevel string) {
	t.Helper()

	if ctx[0] != zanzanaEventMessageKey || ctx[1] != expectedMessage {
		t.Fatalf("unexpected zanzana message context: %#v", ctx)
	}
	if ctx[2] != zanzanaEventLevelKey || ctx[3] != expectedLevel {
		t.Fatalf("unexpected zanzana level context: %#v", ctx)
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

func assertTargetLevelContext(t *testing.T, fake *logtest.Fake, targetLogger, expectedMessage, expectedLevel string, expectFields bool) []any {
	t.Helper()

	ctx := assertSingleTargetLoggerCallAndContext(t, fake, targetLogger)
	assertMessageAndLevel(t, ctx, expectedMessage, expectedLevel)
	if !expectFields {
		if len(ctx) != zanzanaMessageLevelContextLen {
			t.Fatalf("expected message+level fields, got %#v", ctx)
		}
		return nil
	}

	return assertFieldsPayload(t, ctx)
}

func assertContextPayloadFields(t *testing.T, ctx []any) []any {
	t.Helper()

	if len(ctx) != zanzanaWithContextPayloadLen {
		t.Fatalf("expected context payload with two entries, got %#v", ctx)
	}
	if ctx[0] != zanzanaEventContextKey {
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

	if len(ctx) != zanzanaMessageLevelFieldsLen {
		t.Fatalf("expected message+level+fields context, got %#v", ctx)
	}
	if ctx[4] != zanzanaEventFieldsKey {
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

func assertCaseMetadata(t *testing.T, actual, expected []loggerFieldCase) {
	t.Helper()

	if len(actual) != len(expected) {
		t.Fatalf("unexpected case count: got=%d want=%d", len(actual), len(expected))
	}

	for i := range expected {
		if actual[i].name != expected[i].name {
			t.Fatalf("unexpected case name at index %d: got=%q want=%q", i, actual[i].name, expected[i].name)
		}
		if actual[i].targetLogger != expected[i].targetLogger {
			t.Fatalf("unexpected target logger at index %d: got=%q want=%q", i, actual[i].targetLogger, expected[i].targetLogger)
		}
		if actual[i].expectedLevel != expected[i].expectedLevel {
			t.Fatalf("unexpected expectedLevel at index %d: got=%q want=%q", i, actual[i].expectedLevel, expected[i].expectedLevel)
		}
		if actual[i].expectedMessage != expected[i].expectedMessage {
			t.Fatalf("unexpected expectedMessage at index %d: got=%q want=%q", i, actual[i].expectedMessage, expected[i].expectedMessage)
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
