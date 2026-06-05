package v0alpha1

import "strings"

NoDataState:  *"NoData" | "Ok" | "Alerting" | "KeepLast"
ExecErrState: *"Error" | "Ok" | "Alerting" | "KeepLast"

// TimeIntervalRef matches the non-empty TimeIntervalSpec.name validation from the notifications app.
// +k8s:validation:minLength=1
// +k8s:validation:pattern="^.+$"
#TimeIntervalRef: string & strings.MinRunes(1) & =~"^.+$"

AlertRuleSpec: #RuleSpec & {
	annotations?: {
		[string]: TemplateString
	}
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	"for"?: #PromDuration
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	keepFiringFor?: #PromDuration
	// +k8s:validation:minimum=0
	missingSeriesEvalsToResolve?: int & >=0
	noDataState:                  NoDataState
	execErrState:                 ExecErrState
	notificationSettings?:        #NotificationSettings
	panelRef?:                    #PanelRef
}

#PanelRef: {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	dashboardUID: string & strings.MinRunes(1) & =~"^[a-zA-Z0-9_-]+$"
	// +k8s:validation:minimum=0
	// +k8s:validation:exclusiveMinimum
	panelID: int & >0
}

#NotificationSettings: {
	// +k8s:validation:minLength=1
	receiver: string & strings.MinRunes(1)
	groupBy?: [...string]
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	groupWait?: #PromDuration
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	groupInterval?: #PromDuration
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	repeatInterval?: #PromDuration
	// +k8s:validation:items:minLength=1
	// +k8s:validation:items:pattern="^.+$"
	muteTimeIntervals?: [...#TimeIntervalRef]
	// +k8s:validation:items:minLength=1
	// +k8s:validation:items:pattern="^.+$"
	activeTimeIntervals?: [...#TimeIntervalRef]
}
