// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type CreatePushBody struct {
	Status string `json:"status"`
}

// NewCreatePushBody creates a new CreatePushBody object.
func NewCreatePushBody() *CreatePushBody {
	return &CreatePushBody{}
}

// OpenAPIModelName returns the OpenAPI model name for CreatePushBody.
func (CreatePushBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.CreatePushBody"
}
