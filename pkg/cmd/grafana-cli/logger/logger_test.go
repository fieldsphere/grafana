package logger

import (
	"errors"
	"reflect"
	"testing"
)

func TestSplitCLIArgs(t *testing.T) {
	t.Run("string message only", func(t *testing.T) {
		message, attrs, structured := splitCLIArgs("hello")
		if !structured {
			t.Fatalf("expected structured=true")
		}
		if message != "hello" {
			t.Fatalf("unexpected message: %q", message)
		}
		if len(attrs) != 0 {
			t.Fatalf("expected no attrs, got: %#v", attrs)
		}
	})

	t.Run("string with key value attrs", func(t *testing.T) {
		message, attrs, structured := splitCLIArgs("event", "repoURL", "https://example", "attempt", 1)
		if !structured {
			t.Fatalf("expected structured=true")
		}
		if message != "event" {
			t.Fatalf("unexpected message: %q", message)
		}
		expected := []any{"repoURL", "https://example", "attempt", 1}
		if !reflect.DeepEqual(attrs, expected) {
			t.Fatalf("unexpected attrs: got=%#v want=%#v", attrs, expected)
		}
	})

	t.Run("odd args falls back to plain message", func(t *testing.T) {
		message, attrs, structured := splitCLIArgs("event", errors.New("boom"))
		if structured {
			t.Fatalf("expected structured=false")
		}
		if len(attrs) != 0 {
			t.Fatalf("expected no attrs, got: %#v", attrs)
		}
		if message == "" {
			t.Fatalf("expected fallback message to be non-empty")
		}
	})
}
