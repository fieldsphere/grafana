// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v0alpha1

// +k8s:openapi-gen=true
type AlertRuleTrigger = AlertRuleIntervalTrigger

// NewAlertRuleTrigger creates a new AlertRuleTrigger object.
func NewAlertRuleTrigger() *AlertRuleTrigger {
	return NewAlertRuleIntervalTrigger()
}

// +k8s:openapi-gen=true
type AlertRuleIntervalTrigger struct {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	Interval AlertRulePromDuration `json:"interval"`
}

// NewAlertRuleIntervalTrigger creates a new AlertRuleIntervalTrigger object.
func NewAlertRuleIntervalTrigger() *AlertRuleIntervalTrigger {
	return &AlertRuleIntervalTrigger{}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleIntervalTrigger.
func (AlertRuleIntervalTrigger) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleIntervalTrigger"
}

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
// +k8s:openapi-gen=true
type AlertRulePromDuration string

// +k8s:openapi-gen=true
type AlertRuleTemplateString string

// TimeIntervalRef matches the non-empty TimeIntervalSpec.name validation from the notifications app.
// +k8s:validation:minLength=1
// +k8s:validation:pattern="^.+$"
// +k8s:openapi-gen=true
type AlertRuleTimeIntervalRef string

// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
// +k8s:validation:minProperties=1
// +k8s:openapi-gen=true
type AlertRuleExpressionMap map[string]AlertRuleExpression

// OpenAPIModelName returns the OpenAPI model name for AlertRuleExpressionMap.
func (AlertRuleExpressionMap) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleExpressionMap"
}

// +k8s:openapi-gen=true
type AlertRuleExpression struct {
	// The type of query if this is a query expression
	QueryType         *string                     `json:"queryType,omitempty"`
	RelativeTimeRange *AlertRuleRelativeTimeRange `json:"relativeTimeRange,omitempty"`
	// The UID of the datasource to run this expression against. If omitted, the expression will be run against the `__expr__` datasource
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	DatasourceUID *AlertRuleDatasourceUID `json:"datasourceUID,omitempty"`
	Model         interface{}             `json:"model"`
	// Used to mark the expression to be used as the final source for the rule evaluation
	// Only one expression in a rule can be marked as the source
	// For AlertRules, this is the expression that will be evaluated against the alerting condition
	// For RecordingRules, this is the expression that will be recorded
	Source *bool `json:"source,omitempty"`
}

// NewAlertRuleExpression creates a new AlertRuleExpression object.
func NewAlertRuleExpression() *AlertRuleExpression {
	return &AlertRuleExpression{}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleExpression.
func (AlertRuleExpression) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleExpression"
}

// +k8s:openapi-gen=true
type AlertRuleRelativeTimeRange struct {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	From AlertRulePromDurationWMillis `json:"from"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	To AlertRulePromDurationWMillis `json:"to"`
}

// NewAlertRuleRelativeTimeRange creates a new AlertRuleRelativeTimeRange object.
func NewAlertRuleRelativeTimeRange() *AlertRuleRelativeTimeRange {
	return &AlertRuleRelativeTimeRange{}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleRelativeTimeRange.
func (AlertRuleRelativeTimeRange) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleRelativeTimeRange"
}

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
// +k8s:openapi-gen=true
type AlertRulePromDurationWMillis string

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
// +k8s:openapi-gen=true
type AlertRuleDatasourceUID string

// +k8s:openapi-gen=true
type AlertRuleSpec struct {
	// +k8s:validation:minLength=1
	Title       string                             `json:"title"`
	Paused      *bool                              `json:"paused,omitempty"`
	Trigger     AlertRuleTrigger                   `json:"trigger"`
	Labels      map[string]AlertRuleTemplateString `json:"labels,omitempty"`
	Annotations map[string]AlertRuleTemplateString `json:"annotations,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	For *string `json:"for,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	KeepFiringFor *string `json:"keepFiringFor,omitempty"`
	// +k8s:validation:minimum=0
	MissingSeriesEvalsToResolve *int64                                     `json:"missingSeriesEvalsToResolve,omitempty"`
	NoDataState                 string                                     `json:"noDataState"`
	ExecErrState                string                                     `json:"execErrState"`
	NotificationSettings        *AlertRuleV0alpha1SpecNotificationSettings `json:"notificationSettings,omitempty"`
	// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
	// +k8s:validation:minProperties=1
	Expressions AlertRuleExpressionMap         `json:"expressions"`
	PanelRef    *AlertRuleV0alpha1SpecPanelRef `json:"panelRef,omitempty"`
}

// NewAlertRuleSpec creates a new AlertRuleSpec object.
func NewAlertRuleSpec() *AlertRuleSpec {
	return &AlertRuleSpec{
		Trigger:      *NewAlertRuleTrigger(),
		NoDataState:  "NoData",
		ExecErrState: "Error",
	}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleSpec.
func (AlertRuleSpec) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleSpec"
}

// +k8s:openapi-gen=true
type AlertRuleV0alpha1SpecNotificationSettings struct {
	// +k8s:validation:minLength=1
	Receiver string   `json:"receiver"`
	GroupBy  []string `json:"groupBy,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	GroupWait *AlertRulePromDuration `json:"groupWait,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	GroupInterval *AlertRulePromDuration `json:"groupInterval,omitempty"`
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	RepeatInterval *AlertRulePromDuration `json:"repeatInterval,omitempty"`
	// +k8s:validation:items:minLength=1
	// +k8s:validation:items:pattern="^.+$"
	MuteTimeIntervals []AlertRuleTimeIntervalRef `json:"muteTimeIntervals,omitempty"`
	// +k8s:validation:items:minLength=1
	// +k8s:validation:items:pattern="^.+$"
	ActiveTimeIntervals []AlertRuleTimeIntervalRef `json:"activeTimeIntervals,omitempty"`
}

// NewAlertRuleV0alpha1SpecNotificationSettings creates a new AlertRuleV0alpha1SpecNotificationSettings object.
func NewAlertRuleV0alpha1SpecNotificationSettings() *AlertRuleV0alpha1SpecNotificationSettings {
	return &AlertRuleV0alpha1SpecNotificationSettings{}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleV0alpha1SpecNotificationSettings.
func (AlertRuleV0alpha1SpecNotificationSettings) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleV0alpha1SpecNotificationSettings"
}

// +k8s:openapi-gen=true
type AlertRuleV0alpha1SpecPanelRef struct {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	DashboardUID string `json:"dashboardUID"`
	// +k8s:validation:minimum=0
	// +k8s:validation:exclusiveMinimum
	PanelID int64 `json:"panelID"`
}

// NewAlertRuleV0alpha1SpecPanelRef creates a new AlertRuleV0alpha1SpecPanelRef object.
func NewAlertRuleV0alpha1SpecPanelRef() *AlertRuleV0alpha1SpecPanelRef {
	return &AlertRuleV0alpha1SpecPanelRef{}
}

// OpenAPIModelName returns the OpenAPI model name for AlertRuleV0alpha1SpecPanelRef.
func (AlertRuleV0alpha1SpecPanelRef) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.alerting.rules.pkg.apis.alerting.v0alpha1.AlertRuleV0alpha1SpecPanelRef"
}
