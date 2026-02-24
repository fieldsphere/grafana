// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v0alpha1

type GetSearchRequestParams struct {
	DashboardUID   *string  `json:"dashboardUID,omitempty"`
	PanelID        *int64   `json:"panelID,omitempty"`
	From           *int64   `json:"from,omitempty"`
	To             *int64   `json:"to,omitempty"`
	Limit          int64    `json:"limit,omitempty"`
	Continue       *string  `json:"continue,omitempty"`
	Tag            []string `json:"tag,omitempty"`
	TagsMatchAny   *bool    `json:"tagsMatchAny,omitempty"`
	Scope          []string `json:"scope,omitempty"`
	ScopesMatchAny *bool    `json:"scopesMatchAny,omitempty"`
}

// NewGetSearchRequestParams creates a new GetSearchRequestParams object.
func NewGetSearchRequestParams() *GetSearchRequestParams {
	return &GetSearchRequestParams{}
}

// OpenAPIModelName returns the OpenAPI model name for GetSearchRequestParams.
func (GetSearchRequestParams) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.annotation.pkg.apis.annotation.v0alpha1.GetSearchRequestParams"
}
