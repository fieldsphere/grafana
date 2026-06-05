package v0alpha1

import (
	"strings"
	"time"
)

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
#PromDurationWMillis: time.Duration & =~"^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
#PromDuration: time.Duration & =~"^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$" & !~"hmuµn"

TemplateString: string
// +k8s:validation:minLength=1
// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
#DatasourceUID: string & strings.MinRunes(1) & =~"^[a-zA-Z0-9_-]+$"

#RuleSpec: {
	// +k8s:validation:minLength=1
	title: string & strings.MinRunes(1)
	paused?: bool
	trigger: #Trigger
	labels?: {
		[string]: TemplateString
	}
	// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
	// +k8s:validation:minProperties=1
	expressions: #ExpressionMap
	...
}

#Trigger: #IntervalTrigger

#IntervalTrigger: {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	interval: #PromDuration
}

#RelativeTimeRange: {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	from: #PromDurationWMillis
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	to: #PromDurationWMillis
}

// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
// +k8s:validation:minProperties=1
#ExpressionMap: {
	[string]: #Expression
}

#Expression: {
	// The type of query if this is a query expression
	queryType?:         string
	relativeTimeRange?: #RelativeTimeRange
	// The UID of the datasource to run this expression against. If omitted, the expression will be run against the `__expr__` datasource
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	datasourceUID?: #DatasourceUID
	model:          _
	// Used to mark the expression to be used as the final source for the rule evaluation
	// Only one expression in a rule can be marked as the source
	// For AlertRules, this is the expression that will be evaluated against the alerting condition
	// For RecordingRules, this is the expression that will be recorded
	source?: bool
}
