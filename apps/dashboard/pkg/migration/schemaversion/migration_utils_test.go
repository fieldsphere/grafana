package schemaversion_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/apps/dashboard/pkg/migration/schemaversion"
)

func TestGetAngularPanelMigration(t *testing.T) {
	tests := []struct {
		name      string
		panelType string
		panel     map[string]interface{}
		expected  string
	}{
		{
			name:      "graph defaults to timeseries",
			panelType: "graph",
			panel:     map[string]interface{}{},
			expected:  "timeseries",
		},
		{
			name:      "graphite defaults to timeseries",
			panelType: "graphite",
			panel:     map[string]interface{}{},
			expected:  "timeseries",
		},
		{
			name:      "graph series mode without legend values becomes barchart",
			panelType: "graph",
			panel: map[string]interface{}{
				"xaxis": map[string]interface{}{"mode": "series"},
			},
			expected: "barchart",
		},
		{
			name:      "graph series mode with legend values becomes bargauge",
			panelType: "graph",
			panel: map[string]interface{}{
				"xaxis":  map[string]interface{}{"mode": "series"},
				"legend": map[string]interface{}{"values": true},
			},
			expected: "bargauge",
		},
		{
			name:      "graph histogram mode becomes histogram",
			panelType: "graph",
			panel: map[string]interface{}{
				"xaxis": map[string]interface{}{"mode": "histogram"},
			},
			expected: "histogram",
		},
		{
			name:      "table-old becomes table",
			panelType: "table-old",
			panel:     map[string]interface{}{},
			expected:  "table",
		},
		{
			name:      "singlestat becomes stat",
			panelType: "singlestat",
			panel:     map[string]interface{}{},
			expected:  "stat",
		},
		{
			name:      "grafana-singlestat-panel becomes stat",
			panelType: "grafana-singlestat-panel",
			panel:     map[string]interface{}{},
			expected:  "stat",
		},
		{
			name:      "grafana-piechart-panel becomes piechart",
			panelType: "grafana-piechart-panel",
			panel:     map[string]interface{}{},
			expected:  "piechart",
		},
		{
			name:      "grafana-worldmap-panel becomes geomap",
			panelType: "grafana-worldmap-panel",
			panel:     map[string]interface{}{},
			expected:  "geomap",
		},
		{
			name:      "natel-discrete-panel becomes state-timeline",
			panelType: "natel-discrete-panel",
			panel:     map[string]interface{}{},
			expected:  "state-timeline",
		},
		{
			name:      "modern panel type returns empty",
			panelType: "timeseries",
			panel:     map[string]interface{}{},
			expected:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := schemaversion.GetAngularPanelMigration(tt.panelType, tt.panel)
			require.Equal(t, tt.expected, result)
		})
	}
}

func TestGetGraphMigrationTarget(t *testing.T) {
	tests := []struct {
		name     string
		panel    map[string]interface{}
		expected string
	}{
		{
			name:     "empty panel defaults to timeseries",
			panel:    map[string]interface{}{},
			expected: "timeseries",
		},
		{
			name: "series mode with explicit legend values false becomes barchart",
			panel: map[string]interface{}{
				"xaxis":  map[string]interface{}{"mode": "series"},
				"legend": map[string]interface{}{"values": false},
			},
			expected: "barchart",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := schemaversion.GetGraphMigrationTarget(tt.panel)
			require.Equal(t, tt.expected, result)
		})
	}
}

func TestIsAngularPanelType(t *testing.T) {
	require.True(t, schemaversion.IsAngularPanelType("graph"))
	require.True(t, schemaversion.IsAngularPanelType("table-old"))
	require.False(t, schemaversion.IsAngularPanelType("timeseries"))
}

func TestAngularPanelMigrationsParity(t *testing.T) {
	for source, target := range schemaversion.AngularPanelMigrations {
		result := schemaversion.GetAngularPanelMigration(source, map[string]interface{}{})
		require.Equal(t, target, result, "mapping for %s", source)
	}
}
