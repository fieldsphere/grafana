// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

import (
	"github.com/grafana/grafana-app-sdk/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// +k8s:openapi-gen=true
type GetWsResponse struct {
	metav1.TypeMeta `json:",inline"`
	GetWsBody       `json:",inline"`
}

func NewGetWsResponse() *GetWsResponse {
	return &GetWsResponse{}
}

func (t *GetWsBody) DeepCopyInto(dst *GetWsBody) {
	_ = resource.CopyObjectInto(dst, t)
}

func (o *GetWsResponse) DeepCopyObject() runtime.Object {
	dst := NewGetWsResponse()
	o.DeepCopyInto(dst)
	return dst
}

func (o *GetWsResponse) DeepCopyInto(dst *GetWsResponse) {
	dst.TypeMeta.APIVersion = o.TypeMeta.APIVersion
	dst.TypeMeta.Kind = o.TypeMeta.Kind
	o.GetWsBody.DeepCopyInto(&dst.GetWsBody)
}

func (GetWsResponse) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.GetWsResponse"
}

var _ runtime.Object = NewGetWsResponse()
