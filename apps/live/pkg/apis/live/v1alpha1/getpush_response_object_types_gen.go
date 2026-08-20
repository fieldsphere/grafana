// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

import (
	"github.com/grafana/grafana-app-sdk/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// +k8s:openapi-gen=true
type GetPushResponse struct {
	metav1.TypeMeta `json:",inline"`
	GetPushBody     `json:",inline"`
}

func NewGetPushResponse() *GetPushResponse {
	return &GetPushResponse{}
}

func (t *GetPushBody) DeepCopyInto(dst *GetPushBody) {
	_ = resource.CopyObjectInto(dst, t)
}

func (o *GetPushResponse) DeepCopyObject() runtime.Object {
	dst := NewGetPushResponse()
	o.DeepCopyInto(dst)
	return dst
}

func (o *GetPushResponse) DeepCopyInto(dst *GetPushResponse) {
	dst.TypeMeta.APIVersion = o.TypeMeta.APIVersion
	dst.TypeMeta.Kind = o.TypeMeta.Kind
	o.GetPushBody.DeepCopyInto(&dst.GetPushBody)
}

func (GetPushResponse) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.GetPushResponse"
}

var _ runtime.Object = NewGetPushResponse()
