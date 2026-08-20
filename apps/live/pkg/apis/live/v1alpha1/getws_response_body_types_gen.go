// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type GetWsBody struct {
	Status string `json:"status"`
}

// NewGetWsBody creates a new GetWsBody object.
func NewGetWsBody() *GetWsBody {
	return &GetWsBody{}
}

// OpenAPIModelName returns the OpenAPI model name for GetWsBody.
func (GetWsBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.GetWsBody"
}
