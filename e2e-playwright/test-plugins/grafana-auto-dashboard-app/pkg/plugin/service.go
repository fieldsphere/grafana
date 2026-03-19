package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type service struct {
	logger log.Logger
}

func newService() *service {
	return &service{logger: log.DefaultLogger}
}

func (s *service) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	path := strings.TrimPrefix(req.Path, "/")
	if path != "generate" || req.Method != http.MethodPost {
		return sender.Send(&backend.CallResourceResponse{
			Status:  http.StatusNotFound,
			Headers: map[string][]string{"Content-Type": {"application/json"}},
			Body:    []byte(`{"error":"not found"}`),
		})
	}

	var genReq generateRequest
	if err := json.Unmarshal(req.Body, &genReq); err != nil {
		return s.jsonErr(sender, http.StatusBadRequest, "invalid json body")
	}
	if strings.TrimSpace(genReq.Prompt) == "" {
		return s.jsonErr(sender, http.StatusBadRequest, "prompt is required")
	}
	if len(genReq.Datasources) == 0 {
		return s.jsonErr(sender, http.StatusBadRequest, "datasources is required")
	}
	if genReq.MaxPanels <= 0 {
		genReq.MaxPanels = 12
	}

	var spec *DashboardSpec
	var err error
	if useMockLLM() {
		spec = mockSpec()
		// Point mock panels at first provided datasource
		ds0 := genReq.Datasources[0].UID
		for i := range spec.Panels {
			spec.Panels[i].DatasourceUID = ds0
		}
		spec.Title = strings.TrimSpace(genReq.Prompt)
		if spec.Title == "" {
			spec.Title = "Auto dashboard"
		}
	} else {
		key, base, model := openAIConfigFromEnv()
		spec, err = callOpenAIForSpec(genReq, key, base, model)
		if err != nil {
			s.logger.Error("llm call failed", "error", err)
			return s.jsonErr(sender, http.StatusBadGateway, err.Error())
		}
	}

	if err := normalizeSpec(spec); err != nil {
		return s.jsonErr(sender, http.StatusUnprocessableEntity, err.Error())
	}

	allowed := make(map[string]struct{}, len(genReq.Datasources))
	for _, d := range genReq.Datasources {
		allowed[d.UID] = struct{}{}
	}
	for i, p := range spec.Panels {
		if _, ok := allowed[p.DatasourceUID]; !ok {
			return s.jsonErr(sender, http.StatusUnprocessableEntity, "panel uses unknown datasourceUid: "+p.DatasourceUID)
		}
		_ = i
	}

	out, err := json.Marshal(map[string]any{"spec": spec})
	if err != nil {
		return s.jsonErr(sender, http.StatusInternalServerError, "marshal response")
	}
	return sender.Send(&backend.CallResourceResponse{
		Status:  http.StatusOK,
		Headers: map[string][]string{"Content-Type": {"application/json"}},
		Body:    out,
	})
}

func (s *service) jsonErr(sender backend.CallResourceResponseSender, status int, msg string) error {
	b, _ := json.Marshal(map[string]string{"error": msg})
	return sender.Send(&backend.CallResourceResponse{
		Status:  status,
		Headers: map[string][]string{"Content-Type": {"application/json"}},
		Body:    b,
	})
}
