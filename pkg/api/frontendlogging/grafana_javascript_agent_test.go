package frontendlogging

import "testing"

func TestAddMetaToContextSortsMetaKeys(t *testing.T) {
	event := FrontendGrafanaJavascriptAgentEvent{
		Meta: Meta{
			Page: Page{
				URL: "https://example.local/dashboard",
			},
			User: User{
				ID:    "12",
				Email: "alice@example.local",
			},
		},
	}

	got := event.AddMetaToContext(CtxVector{})

	if len(got)%2 != 0 {
		t.Fatalf("expected key/value context shape, got %#v", got)
	}

	lastKey := ""
	for i := 0; i < len(got); i += 2 {
		key, ok := got[i].(string)
		if !ok {
			t.Fatalf("expected key at index %d to be string, got %#v", i, got[i])
		}
		if lastKey != "" && key < lastKey {
			t.Fatalf("expected sorted keys, got %#v", got)
		}
		lastKey = key
	}
}
