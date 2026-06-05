package v0alpha1

import "strings"

RecordingRuleSpec: #RuleSpec & {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z_:][a-zA-Z0-9_:]*$"
	metric: #MetricName
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	targetDatasourceUID: #DatasourceUID
}

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^[a-zA-Z_:][a-zA-Z0-9_:]*$"
#MetricName: string & strings.MinRunes(1) & =~"^[a-zA-Z_:][a-zA-Z0-9_:]*$"
