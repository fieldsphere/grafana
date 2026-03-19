package main

import "testing"

func TestNormalizeSpec(t *testing.T) {
	err := normalizeSpec(nil)
	if err == nil {
		t.Fatal("expected error")
	}

	s := &DashboardSpec{Title: "OK", Panels: []SpecPanel{{Title: "P", Type: "timeseries", DatasourceUID: "x", Query: "up"}}}
	if err := normalizeSpec(s); err != nil {
		t.Fatal(err)
	}

	s.Panels[0].Type = "pie"
	if err := normalizeSpec(s); err == nil {
		t.Fatal("expected type error")
	}
}
