// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v1alpha1

import (
	"github.com/grafana/grafana-app-sdk/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// +k8s:openapi-gen=true
type CreatePushResponse struct {
	metav1.TypeMeta `json:",inline"`
	CreatePushBody  `json:",inline"`
}

func NewCreatePushResponse() *CreatePushResponse {
	return &CreatePushResponse{}
}

func (t *CreatePushBody) DeepCopyInto(dst *CreatePushBody) {
	_ = resource.CopyObjectInto(dst, t)
}

func (o *CreatePushResponse) DeepCopyObject() runtime.Object {
	dst := NewCreatePushResponse()
	o.DeepCopyInto(dst)
	return dst
}

func (o *CreatePushResponse) DeepCopyInto(dst *CreatePushResponse) {
	dst.TypeMeta.APIVersion = o.TypeMeta.APIVersion
	dst.TypeMeta.Kind = o.TypeMeta.Kind
	o.CreatePushBody.DeepCopyInto(&dst.CreatePushBody)
}

func (CreatePushResponse) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.live.pkg.apis.live.v1alpha1.CreatePushResponse"
}

var _ runtime.Object = NewCreatePushResponse()
