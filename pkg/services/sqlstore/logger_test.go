package sqlstore

import (
	"errors"
	"reflect"
	"testing"
)

func TestSplitSQLStoreLogArgs(t *testing.T) {
	t.Run("parses structured message and attributes", func(t *testing.T) {
		message, attrs, structured := splitSQLStoreLogArgs("SQL event", "table", "user", "attempt", 1)
		if !structured {
			t.Fatal("expected structured arguments")
		}
		if message != "SQL event" {
			t.Fatalf("unexpected message: %q", message)
		}
		expected := []any{"table", "user", "attempt", 1}
		if !reflect.DeepEqual(attrs, expected) {
			t.Fatalf("unexpected attrs: got=%#v want=%#v", attrs, expected)
		}
	})

	t.Run("falls back when first argument is not a string", func(t *testing.T) {
		message, attrs, structured := splitSQLStoreLogArgs(errors.New("boom"))
		if structured {
			t.Fatal("expected unstructured fallback")
		}
		if len(attrs) != 0 {
			t.Fatalf("expected no attrs, got=%#v", attrs)
		}
		if message != "boom" {
			t.Fatalf("unexpected message: %q", message)
		}
	})

	t.Run("falls back when attributes are not key value pairs", func(t *testing.T) {
		message, attrs, structured := splitSQLStoreLogArgs("SQL event", "table")
		if structured {
			t.Fatal("expected unstructured fallback")
		}
		if len(attrs) != 0 {
			t.Fatalf("expected no attrs, got=%#v", attrs)
		}
		if message == "" {
			t.Fatal("expected non-empty fallback message")
		}
	})
}
