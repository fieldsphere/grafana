package clientmiddleware

import (
	"context"
	"net/http"
	"strconv"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/contexthandler"
	"github.com/grafana/grafana/pkg/services/query"
)

// NewTracingMiddleware returns a new middleware that creates a new span on every method call.
func NewTracingMiddleware(tracer tracing.Tracer) backend.HandlerMiddleware {
	return backend.HandlerMiddlewareFunc(func(next backend.Handler) backend.Handler {
		return &TracingMiddleware{
			tracer:      tracer,
			BaseHandler: backend.NewBaseHandler(next),
		}
	})
}

type TracingMiddleware struct {
	backend.BaseHandler
	tracer tracing.Tracer
}

func setSpanQueryGroupIDFromHTTPHeader(headers http.Header, span trace.Span) {
	if queryGroupID := headers.Get(query.HeaderQueryGroupID); queryGroupID != "" {
		span.SetAttributes(attribute.String("queryGroupID", queryGroupID))
	}
}

func setSpanDashboardUIDFromHTTPHeader(headers http.Header, span trace.Span) {
	if dashboardUID := headers.Get(query.HeaderDashboardUID); dashboardUID != "" {
		span.SetAttributes(attribute.String("dashboardUID", dashboardUID))
	}
}

// traceWrap returns a new context.Context which wraps a newly created span. The span will also contain attributes for
// plugin id, org id, user login, ds, dashboard and panel info. The second function returned is a cleanup function,
// which should be called by the caller (deferred) and will set the span status/error and end the span.
func (m *TracingMiddleware) traceWrap(
	ctx context.Context, pluginContext backend.PluginContext,
) (context.Context, func(error)) {
	endpoint := backend.EndpointFromContext(ctx)
	ctx, span := m.tracer.Start(ctx, "PluginClient."+string(endpoint), trace.WithAttributes(
		// Attach some plugin context information to span
		attribute.String("pluginID", pluginContext.PluginID),
		attribute.Int64("orgID", pluginContext.OrgID),
	))

	if settings := pluginContext.DataSourceInstanceSettings; settings != nil {
		span.SetAttributes(attribute.String("datasourceName", settings.Name))
		span.SetAttributes(attribute.String("datasourceUID", settings.UID))
	}
	if u := pluginContext.User; u != nil {
		span.SetAttributes(attribute.String("user", u.Login))
	}

	// Additional attributes from http headers
	if reqCtx := contexthandler.FromContext(ctx); reqCtx != nil && reqCtx.Req != nil && len(reqCtx.Req.Header) > 0 {
		if v, err := strconv.Atoi(reqCtx.Req.Header.Get(query.HeaderPanelID)); err == nil {
			span.SetAttributes(attribute.Int("panelID", v))
		}
		setSpanQueryGroupIDFromHTTPHeader(reqCtx.Req.Header, span)
		setSpanDashboardUIDFromHTTPHeader(reqCtx.Req.Header, span)
	}

	// Return ctx with span + cleanup func
	return ctx, func(err error) {
		if err != nil {
			span.SetStatus(codes.Error, err.Error())
			span.RecordError(err)
		}
		span.End()
	}
}

func (m *TracingMiddleware) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.QueryData(ctx, req)
	return resp, err
}

func (m *TracingMiddleware) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	err = m.BaseHandler.CallResource(ctx, req, sender)
	return err
}

func (m *TracingMiddleware) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.CheckHealth(ctx, req)
	return resp, err
}

func (m *TracingMiddleware) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.CollectMetrics(ctx, req)
	return resp, err
}

func (m *TracingMiddleware) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.SubscribeStream(ctx, req)
	return resp, err
}

func (m *TracingMiddleware) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.PublishStream(ctx, req)
	return resp, err
}

func (m *TracingMiddleware) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	err = m.BaseHandler.RunStream(ctx, req, sender)
	return err
}

// ValidateAdmission implements backend.AdmissionHandler.
func (m *TracingMiddleware) ValidateAdmission(ctx context.Context, req *backend.AdmissionRequest) (*backend.ValidationResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.ValidateAdmission(ctx, req)
	return resp, err
}

// MutateAdmission implements backend.AdmissionHandler.
func (m *TracingMiddleware) MutateAdmission(ctx context.Context, req *backend.AdmissionRequest) (*backend.MutationResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.MutateAdmission(ctx, req)
	return resp, err
}

// ConvertObject implements backend.AdmissionHandler.
func (m *TracingMiddleware) ConvertObjects(ctx context.Context, req *backend.ConversionRequest) (*backend.ConversionResponse, error) {
	var err error
	ctx, end := m.traceWrap(ctx, req.PluginContext)
	defer func() { end(err) }()
	resp, err := m.BaseHandler.ConvertObjects(ctx, req)
	return resp, err
}
