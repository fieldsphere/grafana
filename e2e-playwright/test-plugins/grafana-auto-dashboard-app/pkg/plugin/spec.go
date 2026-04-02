package main

import (
	"errors"
	"fmt"
	"strings"
)

const maxPanels = 24

// DashboardSpec is the LLM-facing intermediate schema (keep in sync with dashboardSpec.schema.json).
type DashboardSpec struct {
	Title       string       `json:"title"`
	Description string       `json:"description,omitempty"`
	Panels      []SpecPanel  `json:"panels"`
	Tags        []string     `json:"tags,omitempty"`
}

type SpecPanel struct {
	Title           string `json:"title"`
	Type            string `json:"type"`
	DatasourceUID   string `json:"datasourceUid"`
	Query           string `json:"query"`
	Unit            string `json:"unit,omitempty"`
	LegendFormat    string `json:"legendFormat,omitempty"`
}

func normalizeSpec(s *DashboardSpec) error {
	if s == nil {
		return errors.New("spec is nil")
	}
	s.Title = strings.TrimSpace(s.Title)
	if s.Title == "" {
		return errors.New("spec.title is required")
	}
	if len(s.Panels) == 0 {
		return errors.New("spec.panels must not be empty")
	}
	if len(s.Panels) > maxPanels {
		return fmt.Errorf("spec.panels exceeds max (%d)", maxPanels)
	}
	for i := range s.Panels {
		p := &s.Panels[i]
		p.Title = strings.TrimSpace(p.Title)
		p.Type = strings.ToLower(strings.TrimSpace(p.Type))
		p.DatasourceUID = strings.TrimSpace(p.DatasourceUID)
		p.Query = strings.TrimSpace(p.Query)
		if p.Title == "" {
			return fmt.Errorf("panels[%d].title is required", i)
		}
		if p.Type != "timeseries" && p.Type != "stat" {
			return fmt.Errorf("panels[%d].type must be timeseries or stat", i)
		}
		if p.DatasourceUID == "" {
			return fmt.Errorf("panels[%d].datasourceUid is required", i)
		}
		if p.Query == "" {
			return fmt.Errorf("panels[%d].query is required", i)
		}
	}
	return nil
}
