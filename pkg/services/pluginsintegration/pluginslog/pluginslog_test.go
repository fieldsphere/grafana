package pluginslog

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNormalizePluginInfraLogArgs(t *testing.T) {
	t.Run("keeps structured key value args", func(t *testing.T) {
		got := normalizePluginInfraLogArgs("pluginID", "test", "attempt", 1)
		require.Equal(t, []any{"pluginID", "test", "attempt", 1}, got)
	})

	t.Run("wraps odd args", func(t *testing.T) {
		got := normalizePluginInfraLogArgs("pluginID", "test", 1)
		require.Equal(t, "plugin_log_args", got[0])
	})

	t.Run("wraps non-string keys", func(t *testing.T) {
		got := normalizePluginInfraLogArgs(10, "value")
		require.Equal(t, "plugin_log_args", got[0])
	})
}
