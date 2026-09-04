// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

import (
	"github.com/grafana/grafana-app-sdk/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// +k8s:openapi-gen=true
type PublishResponse struct {
	metav1.TypeMeta     `json:",inline"`
	PublishResponseBody `json:",inline"`
}

func NewPublishResponse() *PublishResponse {
	return &PublishResponse{}
}

func (t *PublishResponseBody) DeepCopyInto(dst *PublishResponseBody) {
	_ = resource.CopyObjectInto(dst, t)
}

func (o *PublishResponse) DeepCopyObject() runtime.Object {
	dst := NewPublishResponse()
	o.DeepCopyInto(dst)
	return dst
}

func (o *PublishResponse) DeepCopyInto(dst *PublishResponse) {
	dst.TypeMeta.APIVersion = o.TypeMeta.APIVersion
	dst.TypeMeta.Kind = o.TypeMeta.Kind
	o.PublishResponseBody.DeepCopyInto(&dst.PublishResponseBody)
}

func (PublishResponse) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.PublishResponse"
}

var _ runtime.Object = NewPublishResponse()
