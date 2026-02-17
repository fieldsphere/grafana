package grpcplugin

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestLogWrapper(t *testing.T) {
	tcs := []struct {
		args           []any
		expectedResult []any
	}{
		{args: []any{}, expectedResult: []any{}},
		{args: []any{"1", "2", "3"}, expectedResult: []any{"pluginLogArgs", []any{"1", "2", "3"}}},
		{args: []any{"1", "2"}, expectedResult: []any{"1", "2"}},
		{args: []any{"1", "2", "timestamp", time.Now()}, expectedResult: []any{"1", "2"}},
		{args: []any{"1", "2", "timestamp", time.Now(), "3", "4"}, expectedResult: []any{"1", "2", "3", "4"}},
		{args: []any{"1", "2", 3, "4"}, expectedResult: []any{"pluginLogArgs", []any{"1", "2", 3, "4"}}},
	}

	for i, tc := range tcs {
		t.Run(fmt.Sprintf("formatArgs testcase %d", i), func(t *testing.T) {
			res := formatArgs(tc.args...)
			assert.Exactly(t, tc.expectedResult, res)
		})
	}
}

func TestWrapPluginLogArgsEncapsulatesContext(t *testing.T) {
	t.Run("adds pluginContext when args are provided", func(t *testing.T) {
		got := wrapPluginLogArgs("plugin started", "info", "pluginID", "test", "attempt", 1)
		expected := []any{
			"pluginMessage", "plugin started",
			"pluginLogLevel", "info",
			"pluginContext", []any{"pluginID", "test", "attempt", 1},
		}
		assert.Exactly(t, expected, got)
	})

	t.Run("omits pluginContext when args are empty", func(t *testing.T) {
		got := wrapPluginLogArgs("plugin started", "info")
		expected := []any{
			"pluginMessage", "plugin started",
			"pluginLogLevel", "info",
		}
		assert.Exactly(t, expected, got)
	})
}
