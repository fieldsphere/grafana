// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v0alpha1

// +k8s:openapi-gen=true
type RecordingRuleTrigger = RecordingRuleIntervalTrigger

// NewRecordingRuleTrigger creates a new RecordingRuleTrigger object.
func NewRecordingRuleTrigger() *RecordingRuleTrigger {
	return NewRecordingRuleIntervalTrigger()
}

// +k8s:openapi-gen=true
type RecordingRuleIntervalTrigger struct {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	Interval RecordingRulePromDuration `json:"interval"`
}

// NewRecordingRuleIntervalTrigger creates a new RecordingRuleIntervalTrigger object.
func NewRecordingRuleIntervalTrigger() *RecordingRuleIntervalTrigger {
	return &RecordingRuleIntervalTrigger{}
}

// OpenAPIModelName returns the OpenAPI model name for RecordingRuleIntervalTrigger.
func (RecordingRuleIntervalTrigger) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.RecordingRuleIntervalTrigger"
}

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
// +k8s:openapi-gen=true
type RecordingRulePromDuration string

// +k8s:openapi-gen=true
type RecordingRuleTemplateString string

// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
// +k8s:validation:minProperties=1
// +k8s:openapi-gen=true
type RecordingRuleExpressionMap map[string]RecordingRuleExpression

// OpenAPIModelName returns the OpenAPI model name for RecordingRuleExpressionMap.
func (RecordingRuleExpressionMap) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.RecordingRuleExpressionMap"
}

// +k8s:openapi-gen=true
type RecordingRuleExpression struct {
	// The type of query if this is a query expression
	QueryType         *string                         `json:"queryType,omitempty"`
	RelativeTimeRange *RecordingRuleRelativeTimeRange `json:"relativeTimeRange,omitempty"`
	// The UID of the datasource to run this expression against. If omitted, the expression will be run against the `__expr__` datasource
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	DatasourceUID *RecordingRuleDatasourceUID `json:"datasourceUID,omitempty"`
	Model         interface{}                 `json:"model"`
	// Used to mark the expression to be used as the final source for the rule evaluation
	// Only one expression in a rule can be marked as the source
	// For AlertRules, this is the expression that will be evaluated against the alerting condition
	// For RecordingRules, this is the expression that will be recorded
	Source *bool `json:"source,omitempty"`
}

// NewRecordingRuleExpression creates a new RecordingRuleExpression object.
func NewRecordingRuleExpression() *RecordingRuleExpression {
	return &RecordingRuleExpression{}
}

// OpenAPIModelName returns the OpenAPI model name for RecordingRuleExpression.
func (RecordingRuleExpression) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.RecordingRuleExpression"
}

// +k8s:openapi-gen=true
type RecordingRuleRelativeTimeRange struct {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	From RecordingRulePromDurationWMillis `json:"from"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	To RecordingRulePromDurationWMillis `json:"to"`
}

// NewRecordingRuleRelativeTimeRange creates a new RecordingRuleRelativeTimeRange object.
func NewRecordingRuleRelativeTimeRange() *RecordingRuleRelativeTimeRange {
	return &RecordingRuleRelativeTimeRange{}
}

// OpenAPIModelName returns the OpenAPI model name for RecordingRuleRelativeTimeRange.
func (RecordingRuleRelativeTimeRange) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.RecordingRuleRelativeTimeRange"
}

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
// +k8s:openapi-gen=true
type RecordingRulePromDurationWMillis string

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
// +k8s:openapi-gen=true
type RecordingRuleDatasourceUID string

// +k8s:openapi-gen=true
type RecordingRuleSpec struct {
	// +k8s:validation:minLength=1
	Title   string                                 `json:"title"`
	Paused  *bool                                  `json:"paused,omitempty"`
	Trigger RecordingRuleTrigger                   `json:"trigger"`
	Labels  map[string]RecordingRuleTemplateString `json:"labels,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z_:][a-zA-Z0-9_:]*$"
	Metric string `json:"metric"`
	// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
	// +k8s:validation:minProperties=1
	Expressions RecordingRuleExpressionMap `json:"expressions"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	TargetDatasourceUID string `json:"targetDatasourceUID"`
}

// NewRecordingRuleSpec creates a new RecordingRuleSpec object.
func NewRecordingRuleSpec() *RecordingRuleSpec {
	return &RecordingRuleSpec{
		Trigger: *NewRecordingRuleTrigger(),
	}
}

// OpenAPIModelName returns the OpenAPI model name for RecordingRuleSpec.
func (RecordingRuleSpec) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.RecordingRuleSpec"
}
