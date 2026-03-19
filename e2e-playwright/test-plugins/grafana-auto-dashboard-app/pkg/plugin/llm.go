package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type generateRequest struct {
	Prompt      string   `json:"prompt"`
	Datasources []dsRef  `json:"datasources"`
	MaxPanels   int      `json:"maxPanels"`
	MetricHints []string `json:"metricHints,omitempty"`
}

type dsRef struct {
	UID  string `json:"uid"`
	Type string `json:"type"`
	Name string `json:"name"`
}

type openAIChatRequest struct {
	Model       string              `json:"model"`
	Messages    []openAIChatMessage `json:"messages"`
	Temperature float64             `json:"temperature"`
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func extractJSON(content string) string {
	s := strings.TrimSpace(content)
	if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimLeft(s, " \t")
		if nl := strings.IndexByte(s, '\n'); nl >= 0 {
			if strings.EqualFold(strings.TrimSpace(s[:nl]), "json") {
				s = s[nl+1:]
			}
		}
		s = strings.TrimSpace(s)
		if idx := strings.LastIndex(s, "```"); idx >= 0 {
			s = strings.TrimSpace(s[:idx])
		}
	}
	return s
}

func callOpenAIForSpec(req generateRequest, apiKey, baseURL, model string) (*DashboardSpec, error) {
	if apiKey == "" {
		return nil, errors.New("OPENAI_API_KEY is not set")
	}
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	if model == "" {
		model = "gpt-4o-mini"
	}

	system := buildSystemPrompt(req.MaxPanels)
	user := buildUserPrompt(req)

	body := openAIChatRequest{
		Model: model,
		Messages: []openAIChatMessage{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
		Temperature: 0.2,
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest(http.MethodPost, strings.TrimSuffix(baseURL, "/")+"/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body := strings.TrimSpace(string(respBody))
		if body == "" {
			return nil, fmt.Errorf("openai http %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("openai http %d: %s", resp.StatusCode, truncate(body, 500))
	}

	var parsed openAIChatResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode openai response: %w", err)
	}
	if len(parsed.Choices) == 0 {
		return nil, errors.New("openai returned no choices")
	}
	content := extractJSON(parsed.Choices[0].Message.Content)
	var spec DashboardSpec
	if err := json.Unmarshal([]byte(content), &spec); err != nil {
		return nil, fmt.Errorf("parse model json: %w (content=%q)", err, truncate(content, 500))
	}
	return &spec, nil
}

func buildSystemPrompt(maxPanels int) string {
	if maxPanels <= 0 {
		maxPanels = 12
	}
	return fmt.Sprintf(`You are a Grafana dashboard assistant. Respond with a single JSON object only (no markdown fences) matching this shape:
{"title":"string","description":"optional string","tags":["optional"],"panels":[{"title":"string","type":"timeseries"|"stat","datasourceUid":"string","query":"PromQL or LogQL expression","unit":"optional e.g. percent, bytes, s","legendFormat":"optional"}]}
Rules:
- Use only datasource UIDs provided by the user.
- Prefer rate() for counters; use histogram_quantile for histograms when appropriate.
- At most %d panels.
- Queries must be valid for the datasource type (Prometheus: PromQL).`, maxPanels)
}

func buildUserPrompt(req generateRequest) string {
	var b strings.Builder
	b.WriteString("User goal:\n")
	b.WriteString(req.Prompt)
	b.WriteString("\n\nDatasources (use these UIDs exactly):\n")
	for _, d := range req.Datasources {
		fmt.Fprintf(&b, "- uid=%q type=%q name=%q\n", d.UID, d.Type, d.Name)
	}
	if len(req.MetricHints) > 0 {
		b.WriteString("\nSample metric names (hints only):\n")
		for _, m := range req.MetricHints {
			if m != "" {
				b.WriteString("- ")
				b.WriteString(m)
				b.WriteString("\n")
			}
		}
	}
	if req.MaxPanels > 0 {
		fmt.Fprintf(&b, "\nMax panels: %d\n", req.MaxPanels)
	}
	return b.String()
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

func mockSpec() *DashboardSpec {
	return &DashboardSpec{
		Title:       "Generated service overview",
		Description: "Mock LLM output (set OPENAI_API_KEY or unset MOCK_LLM)",
		Tags:        []string{"auto-generated"},
		Panels: []SpecPanel{
			{
				Title:         "Request rate",
				Type:          "timeseries",
				DatasourceUID: "replace-me",
				Query:         `sum(rate(http_requests_total[5m]))`,
				LegendFormat:  "{{job}}",
			},
			{
				Title:         "Error rate",
				Type:          "stat",
				DatasourceUID: "replace-me",
				Query:         `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`,
				Unit:          "percentunit",
			},
		},
	}
}

func useMockLLM() bool {
	return strings.EqualFold(os.Getenv("MOCK_LLM"), "true") || os.Getenv("OPENAI_API_KEY") == ""
}

func openAIConfigFromEnv() (apiKey, baseURL, model string) {
	apiKey = os.Getenv("OPENAI_API_KEY")
	baseURL = os.Getenv("OPENAI_BASE_URL")
	model = os.Getenv("OPENAI_MODEL")
	return
}
