// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v0alpha1

type GetTagsRequestParams struct {
	Tag   *string `json:"tag,omitempty"`
	Limit *int64  `json:"limit,omitempty"`
}

// NewGetTagsRequestParams creates a new GetTagsRequestParams object.
func NewGetTagsRequestParams() *GetTagsRequestParams {
	return &GetTagsRequestParams{}
}

// OpenAPIModelName returns the OpenAPI model name for GetTagsRequestParams.
func (GetTagsRequestParams) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.annotation.pkg.apis.annotation.v0alpha1.GetTagsRequestParams"
}
