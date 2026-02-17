package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/aggregator/apiserver/plugin/admission"
	"github.com/grafana/grafana/pkg/aggregator/apiserver/util"
	grafanasemconv "github.com/grafana/grafana/pkg/semconv"
	"k8s.io/component-base/tracing"
	"k8s.io/klog/v2"
)

func (h *PluginHandler) AdmissionMutationHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		span := tracing.SpanFromContext(ctx)
		span.AddEvent("admissionMutationHandler")
		responder := &util.Responder{ResponseWriter: w}
		ar, err := admission.ParseRequest(h.admissionCodecs, r)
		if err != nil {
			responder.Error(w, r, err)
			return
		}

		span.AddEvent("getPluginContext",
			grafanasemconv.GrafanaPluginId(h.dataplaneService.Spec.PluginID),
		)
		pluginContext, err := h.pluginContextProvider.GetPluginContext(ctx, h.dataplaneService.Spec.PluginID, "")
		if err != nil {
			responder.Error(w, r, fmt.Errorf("unable to get plugin context: %w", err))
			return
		}

		req, err := admission.ToAdmissionRequest(pluginContext, ar)
		if err != nil {
			responder.Error(w, r, fmt.Errorf("unable to convert admission request: %w", err))
			return
		}

		ctx = backend.WithGrafanaConfig(ctx, pluginContext.GrafanaConfig)
		span.AddEvent("mutateAdmissionStart")
		rsp, err := h.client.MutateAdmission(ctx, req)
		if err != nil {
			responder.Error(w, r, err)
			return
		}
		span.AddEvent("mutateAdmissionEnd")

		span.AddEvent("fromMutationResponseStart")
		res, err := admission.FromMutationResponse(ar.Request.Object.Raw, rsp)
		if err != nil {
			responder.Error(w, r, err)
			return
		}
		res.SetGroupVersionKind(ar.GroupVersionKind())
		res.Response.UID = ar.Request.UID

		respBytes, err := json.Marshal(res)
		if err != nil {
			klog.ErrorS(err, "Failed to marshal admission mutation response")
			responder.Error(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if _, err := w.Write(respBytes); err != nil {
			klog.ErrorS(err, "Failed to write admission mutation response")
		}
	})
}

func (h *PluginHandler) AdmissionValidationHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		span := tracing.SpanFromContext(ctx)
		span.AddEvent("admissionValidationHandler")
		responder := &util.Responder{ResponseWriter: w}
		ar, err := admission.ParseRequest(h.admissionCodecs, r)
		if err != nil {
			responder.Error(w, r, err)
			return
		}

		span.AddEvent("getPluginContext",
			grafanasemconv.GrafanaPluginId(h.dataplaneService.Spec.PluginID),
		)
		pluginContext, err := h.pluginContextProvider.GetPluginContext(ctx, h.dataplaneService.Spec.PluginID, "")
		if err != nil {
			responder.Error(w, r, fmt.Errorf("unable to get plugin context: %w", err))
			return
		}

		req, err := admission.ToAdmissionRequest(pluginContext, ar)
		if err != nil {
			responder.Error(w, r, fmt.Errorf("unable to convert admission request: %w", err))
			return
		}

		ctx = backend.WithGrafanaConfig(ctx, pluginContext.GrafanaConfig)
		span.AddEvent("validateAdmissionStart")
		rsp, err := h.client.ValidateAdmission(ctx, req)
		if err != nil {
			responder.Error(w, r, err)
			return
		}
		span.AddEvent("validateAdmissionEnd")

		res := admission.FromValidationResponse(rsp)
		res.SetGroupVersionKind(ar.GroupVersionKind())
		res.Response.UID = ar.Request.UID

		respBytes, err := json.Marshal(res)
		if err != nil {
			klog.ErrorS(err, "Failed to marshal admission validation response")
			responder.Error(w, r, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if _, err := w.Write(respBytes); err != nil {
			klog.ErrorS(err, "Failed to write admission validation response")
		}
	})
}
