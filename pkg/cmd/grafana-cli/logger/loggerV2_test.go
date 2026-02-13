package logger

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"testing"
)

func captureCLILogRecord(t *testing.T, run func()) map[string]any {
	t.Helper()

	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, nil)))
	defer slog.SetDefault(previous)

	run()

	var record map[string]any
	if err := json.Unmarshal(buf.Bytes(), &record); err != nil {
		t.Fatalf("failed to decode slog output %q: %v", buf.String(), err)
	}

	return record
}

func TestCLILoggerInfoPreservesStructuredFields(t *testing.T) {
	record := captureCLILogRecord(t, func() {
		New(false).Info("Install plugin", "pluginID", "example")
	})

	if record["msg"] != "Grafana CLI info" {
		t.Fatalf("unexpected log message: %#v", record["msg"])
	}
	if record["message"] != "Install plugin" {
		t.Fatalf("unexpected event message: %#v", record["message"])
	}
	if record["pluginID"] != "example" {
		t.Fatalf("unexpected pluginID: %#v", record["pluginID"])
	}
}

func TestCLILoggerInfofIncludesTemplateAndArgs(t *testing.T) {
	record := captureCLILogRecord(t, func() {
		New(false).Infof("Installed %s", "example")
	})

	if record["message"] != "Installed example" {
		t.Fatalf("unexpected event message: %#v", record["message"])
	}
	if record["template"] != "Installed %s" {
		t.Fatalf("unexpected template: %#v", record["template"])
	}
	args, ok := record["args"].([]any)
	if !ok || len(args) != 1 || args[0] != "example" {
		t.Fatalf("unexpected args payload: %#v", record["args"])
	}
}
