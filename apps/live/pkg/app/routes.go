package app

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana/apps/live/pkg/apis/live/v1alpha1"
)

// GetSomethingHandler handles requests for the GET /something resource route
// PublishHandler accepts HTTP publish for path consistency with /apis.
// Subscribers remain on /api/live/ws (gzip middleware already special-cases it).
func PublishHandler(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
	var body v1alpha1.PublishBody
	if request.Body != nil {
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			return err
		}
	}
	return json.NewEncoder(writer).Encode(v1alpha1.PublishResponse{
		TypeMeta: metav1.TypeMeta{
			APIVersion: fmt.Sprintf("%s/%s", v1alpha1.APIGroup, v1alpha1.APIVersion),
			Kind:       "PublishResponse",
		},
		PublishResponseBody: v1alpha1.PublishResponseBody{
			Channel:   body.Channel,
			Accepted:  body.Channel != "",
			Transport: "/api/live/ws",
		},
	})
}

func GetSomethingHandler(ctx context.Context, writer app.CustomRouteResponseWriter, request *app.CustomRouteRequest) error {
	message := "This is a namespaced route"
	if request.URL.Query().Has("message") {
		message = request.URL.Query().Get("message")
	}
	return json.NewEncoder(writer).Encode(v1alpha1.GetSomethingResponse{
		TypeMeta: metav1.TypeMeta{
			APIVersion: fmt.Sprintf("%s/%s", v1alpha1.APIGroup, v1alpha1.APIVersion),
		},
		GetSomethingBody: v1alpha1.GetSomethingBody{
			Namespace: request.ResourceIdentifier.Namespace,
			Message:   message,
		},
	})
}
