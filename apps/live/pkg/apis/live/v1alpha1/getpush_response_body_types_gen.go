// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type GetPushBody struct {
	Status string `json:"status"`
}

// NewGetPushBody creates a new GetPushBody object.
func NewGetPushBody() *GetPushBody {
	return &GetPushBody{}
}

// OpenAPIModelName returns the OpenAPI model name for GetPushBody.
func (GetPushBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.GetPushBody"
}
