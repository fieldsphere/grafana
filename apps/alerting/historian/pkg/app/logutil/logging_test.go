package logutil

import (
	"context"
	"testing"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"github.com/grafana/grafana-app-sdk/logging"
	"github.com/stretchr/testify/require"
)

const goKitEvent = "Go kit logger event"

type ent struct {
	level string
	msg   string
	kvs   []any
}
type fakeLogger struct {
	logs []ent
}

func (f *fakeLogger) Debug(msg string, args ...any) {
	f.logs = append(f.logs, ent{"debug", msg, args})
}
func (f *fakeLogger) Info(msg string, args ...any) {
	f.logs = append(f.logs, ent{"info", msg, args})
}
func (f *fakeLogger) Warn(msg string, args ...any) {
	f.logs = append(f.logs, ent{"warn", msg, args})
}
func (f *fakeLogger) Error(msg string, args ...any) {
	f.logs = append(f.logs, ent{"error", msg, args})
}
func (f *fakeLogger) With(args ...any) logging.Logger {
	return nil
}
func (f *fakeLogger) WithContext(context.Context) logging.Logger {
	return nil
}

func setup() (*fakeLogger, log.Logger) {
	fake := &fakeLogger{}
	return fake, ToGoKitLogger(fake)
}

func TestToGoKitLogger(t *testing.T) {
	t.Run("debug / 1 args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Debug(gk).Log("msg", "hello world", "foo"))
		require.Equal(t, "debug", fake.logs[0].level)
		require.Equal(t, goKitEvent, fake.logs[0].msg)
		require.Len(t, fake.logs[0].kvs, 6)
		require.Equal(t, "gokit_message", fake.logs[0].kvs[0])
		require.Equal(t, "hello world", fake.logs[0].kvs[1])
		require.Equal(t, "foo", fake.logs[0].kvs[2])
		require.Equal(t, "(MISSING)", fake.logs[0].kvs[3].(error).Error())
		require.Equal(t, "gokit_level", fake.logs[0].kvs[4])
		require.Equal(t, "debug", fake.logs[0].kvs[5])
	})
	t.Run("debug / 2 args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Debug(gk).Log("msg", "hello world", "foo", "bar"))
		require.Equal(t, []ent{{"debug", goKitEvent, []any{"gokit_message", "hello world", "foo", "bar", "gokit_level", "debug"}}}, fake.logs)
	})
	t.Run("debug / 4 args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Debug(gk).Log("msg", "hello world", "foo", "bar", "baz", 1))
		require.Equal(t, []ent{{"debug", goKitEvent, []any{"gokit_message", "hello world", "foo", "bar", "baz", 1, "gokit_level", "debug"}}}, fake.logs)
	})
	t.Run("debug / no args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Debug(gk).Log("msg", "hello world"))
		require.Equal(t, []ent{{"debug", goKitEvent, []any{"gokit_message", "hello world", "gokit_level", "debug"}}}, fake.logs)
	})
	t.Run("info / no args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Info(gk).Log("msg", "hello world"))
		require.Equal(t, []ent{{"info", goKitEvent, []any{"gokit_message", "hello world", "gokit_level", "info"}}}, fake.logs)
	})
	t.Run("warn / no args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Warn(gk).Log("msg", "hello world"))
		require.Equal(t, []ent{{"warn", goKitEvent, []any{"gokit_message", "hello world", "gokit_level", "warn"}}}, fake.logs)
	})
	t.Run("error / no args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, level.Error(gk).Log("msg", "hello world"))
		require.Equal(t, []ent{{"error", goKitEvent, []any{"gokit_message", "hello world", "gokit_level", "error"}}}, fake.logs)
	})
	t.Run("no level / no args", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, gk.Log("msg", "hello world"))
		require.Equal(t, []ent{{"info", goKitEvent, []any{"gokit_message", "hello world", "gokit_level", "info"}}}, fake.logs)
	})
	t.Run("no level / 2 args / no msg", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, gk.Log("foo", "bar"))
		require.Equal(t, []ent{{"info", goKitEvent, []any{"gokit_message", "", "foo", "bar", "gokit_level", "info"}}}, fake.logs)
	})
	t.Run("no level / no args / no msg", func(t *testing.T) {
		fake, gk := setup()
		require.NoError(t, gk.Log())
		require.Equal(t, []ent{{"info", goKitEvent, []any{"gokit_message", "", "gokit_level", "info"}}}, fake.logs)
	})
}
