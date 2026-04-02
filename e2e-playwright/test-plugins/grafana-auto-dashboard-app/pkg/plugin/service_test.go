package main

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestCallResourceGenerate_MockLLM(t *testing.T) {
	t.Setenv("MOCK_LLM", "true")
	t.Setenv("OPENAI_API_KEY", "")

	s := newService()
	var last *backend.CallResourceResponse
	sender := backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		last = resp
		return nil
	})

	body := `{"prompt":"CPU overview","datasources":[{"uid":"prom-uid","type":"prometheus","name":"Prom"}],"maxPanels":4}`
	req := &backend.CallResourceRequest{
		Path:   "generate",
		Method: http.MethodPost,
		Body:   []byte(body),
	}

	if err := s.CallResource(t.Context(), req, sender); err != nil {
		t.Fatal(err)
	}
	if last == nil || last.Status != http.StatusOK {
		t.Fatalf("unexpected response: %+v", last)
	}
	var payload struct {
		Spec DashboardSpec `json:"spec"`
	}
	if err := json.Unmarshal(last.Body, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Spec.Title != "CPU overview" {
		t.Fatalf("title: %q", payload.Spec.Title)
	}
	for _, p := range payload.Spec.Panels {
		if p.DatasourceUID != "prom-uid" {
			t.Fatalf("panel ds uid: %q", p.DatasourceUID)
		}
	}
}
