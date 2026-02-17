package log

import "testing"

func TestNormalizePluginLoggerContext(t *testing.T) {
	t.Run("passes through key value pairs", func(t *testing.T) {
		got := normalizePluginLoggerContext("pluginID", "my-plugin", "attempt", 1)
		if len(got) != 4 {
			t.Fatalf("unexpected context length: %#v", got)
		}
		if got[0] != "pluginID" || got[1] != "my-plugin" || got[2] != "attempt" || got[3] != 1 {
			t.Fatalf("unexpected context values: %#v", got)
		}
	})

	t.Run("wraps odd argument lists", func(t *testing.T) {
		got := normalizePluginLoggerContext("pluginID", "my-plugin", 10)
		if len(got) != 2 || got[0] != "pluginLogArgs" {
			t.Fatalf("unexpected fallback context: %#v", got)
		}
	})

	t.Run("wraps non-string keys", func(t *testing.T) {
		got := normalizePluginLoggerContext(10, "my-plugin")
		if len(got) != 2 || got[0] != "pluginLogArgs" {
			t.Fatalf("unexpected fallback context: %#v", got)
		}
	})
}

func TestWrapPluginLoggerContextEncapsulatesContext(t *testing.T) {
	t.Run("adds pluginContext when ctx values exist", func(t *testing.T) {
		got := wrapPluginLoggerContext("plugin started", "info", "pluginID", "my-plugin", "attempt", 1)
		expected := []any{
			"pluginMessage", "plugin started",
			"pluginLogLevel", "info",
			"pluginContext", []any{"pluginID", "my-plugin", "attempt", 1},
		}
		if len(got) != len(expected) {
			t.Fatalf("unexpected wrapped context length: got=%d want=%d (%#v)", len(got), len(expected), got)
		}
		for i := range expected {
			if i == 5 {
				// nested []any comparison for pluginContext payload
				gotNested, ok := got[i].([]any)
				if !ok {
					t.Fatalf("expected nested []any at index %d, got %#v", i, got[i])
				}
				expNested := expected[i].([]any)
				if len(gotNested) != len(expNested) {
					t.Fatalf("unexpected nested length: got=%d want=%d (%#v)", len(gotNested), len(expNested), gotNested)
				}
				for j := range expNested {
					if gotNested[j] != expNested[j] {
						t.Fatalf("unexpected nested value at index %d: got=%#v want=%#v (%#v)", j, gotNested[j], expNested[j], gotNested)
					}
				}
				continue
			}
			if got[i] != expected[i] {
				t.Fatalf("unexpected wrapped context value at index %d: got=%#v want=%#v (%#v)", i, got[i], expected[i], got)
			}
		}
	})

	t.Run("omits pluginContext when no ctx values", func(t *testing.T) {
		got := wrapPluginLoggerContext("plugin started", "info")
		expected := []any{
			"pluginMessage", "plugin started",
			"pluginLogLevel", "info",
		}
		if len(got) != len(expected) {
			t.Fatalf("unexpected wrapped context length: got=%d want=%d (%#v)", len(got), len(expected), got)
		}
		for i := range expected {
			if got[i] != expected[i] {
				t.Fatalf("unexpected wrapped context value at index %d: got=%#v want=%#v (%#v)", i, got[i], expected[i], got)
			}
		}
	})
}
