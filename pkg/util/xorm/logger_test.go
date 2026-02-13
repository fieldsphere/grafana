package xorm

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"
)

func TestSplitLogArgs(t *testing.T) {
	t.Run("single error gets structured error field", func(t *testing.T) {
		err := errors.New("boom")
		msg, attrs := splitLogArgs(err)

		if msg != "XORM error" {
			t.Fatalf("unexpected message: %q", msg)
		}
		expected := []any{"error", err}
		if !reflect.DeepEqual(attrs, expected) {
			t.Fatalf("unexpected attrs: got=%#v want=%#v", attrs, expected)
		}
	})

	t.Run("message with key value attrs remains structured", func(t *testing.T) {
		msg, attrs := splitLogArgs("event", "column", "name", "attempt", 1)
		if msg != "event" {
			t.Fatalf("unexpected message: %q", msg)
		}
		expected := []any{"column", "name", "attempt", 1}
		if !reflect.DeepEqual(attrs, expected) {
			t.Fatalf("unexpected attrs: got=%#v want=%#v", attrs, expected)
		}
	})

	t.Run("odd attrs falls back to sprint", func(t *testing.T) {
		msg, attrs := splitLogArgs("event", 123)
		if len(attrs) != 0 {
			t.Fatalf("expected no attrs, got=%#v", attrs)
		}
		if msg == "" {
			t.Fatal("expected non-empty fallback message")
		}
	})
}

func TestFormatSyslogEvent(t *testing.T) {
	t.Run("single error serializes as structured payload", func(t *testing.T) {
		out := formatSyslogEvent(errors.New("boom"))
		payload := map[string]any{}
		if err := json.Unmarshal([]byte(out), &payload); err != nil {
			t.Fatalf("expected json payload, got %q: %v", out, err)
		}
		if payload["event"] != "XORM log event" {
			t.Fatalf("unexpected event: %#v", payload["event"])
		}
		if payload["message"] != "XORM error" {
			t.Fatalf("unexpected message: %#v", payload["message"])
		}
		if payload["error"] != "boom" {
			t.Fatalf("unexpected error: %#v", payload["error"])
		}
	})

	t.Run("formatted args preserve template context", func(t *testing.T) {
		out := formatSyslogEvent("processed 3 rows", "template", "processed %d rows", "args", []any{3})
		payload := map[string]any{}
		if err := json.Unmarshal([]byte(out), &payload); err != nil {
			t.Fatalf("expected json payload, got %q: %v", out, err)
		}
		if payload["template"] != "processed %d rows" {
			t.Fatalf("unexpected template: %#v", payload["template"])
		}
		args, ok := payload["args"].([]any)
		if !ok || len(args) != 1 || args[0] != float64(3) {
			t.Fatalf("unexpected args payload: %#v", payload["args"])
		}
	})
}
