package v0alpha1

import "strings"

TimeIntervalSpec: {
	// This is referenced by alert rule notification settings.
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^.+$"
	name: string & strings.MinRunes(1) & =~"^.+$"
	time_intervals: [...#Interval]
}

#TimeRange: {
	start_time: string
	end_time:   string
}
#Interval: {
	times?: [...#TimeRange]
	weekdays?: [...string]
	days_of_month?: [...string]
	months?: [...string]
	years?: [...string]
	location?: string
}
