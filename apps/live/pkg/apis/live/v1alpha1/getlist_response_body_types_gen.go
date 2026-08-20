// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type GetListBody struct {
	Channels []interface{} `json:"channels"`
}

// NewGetListBody creates a new GetListBody object.
func NewGetListBody() *GetListBody {
	return &GetListBody{
		Channels: []interface{}{},
	}
}

// OpenAPIModelName returns the OpenAPI model name for GetListBody.
func (GetListBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.GetListBody"
}
