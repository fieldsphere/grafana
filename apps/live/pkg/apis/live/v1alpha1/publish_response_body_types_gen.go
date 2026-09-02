// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

// +k8s:openapi-gen=true
type PublishResponseBody struct {
	Channel   string `json:"channel"`
	Accepted  bool   `json:"accepted"`
	Transport string `json:"transport"`
}

func NewPublishResponseBody() *PublishResponseBody {
	return &PublishResponseBody{}
}

func (PublishResponseBody) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.PublishResponseBody"
}
