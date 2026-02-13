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
		if len(got) != 2 || got[0] != "plugin_log_args" {
			t.Fatalf("unexpected fallback context: %#v", got)
		}
	})

	t.Run("wraps non-string keys", func(t *testing.T) {
		got := normalizePluginLoggerContext(10, "my-plugin")
		if len(got) != 2 || got[0] != "plugin_log_args" {
			t.Fatalf("unexpected fallback context: %#v", got)
		}
	})
}
