package xorm

import (
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
