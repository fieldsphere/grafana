// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type PublishBody struct {
	Channel string      `json:"channel"`
	Data    interface{} `json:"data,omitempty"`
}

func NewPublishBody() *PublishBody {
	return &PublishBody{}
}

func (PublishBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.PublishBody"
}
