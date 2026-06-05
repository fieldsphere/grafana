// Code generated - EDITING IS FUTILE. DO NOT EDIT.

export type Trigger = IntervalTrigger;

export const defaultTrigger = (): Trigger => (defaultIntervalTrigger());

export interface IntervalTrigger {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	interval: PromDuration;
}

export const defaultIntervalTrigger = (): IntervalTrigger => ({
	interval: defaultPromDuration(),
});

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
export type PromDuration = string;

export const defaultPromDuration = (): PromDuration => ("");

export type TemplateString = string;

export const defaultTemplateString = (): TemplateString => ("");

// TimeIntervalRef matches the non-empty TimeIntervalSpec.name validation from the notifications app.
// +k8s:validation:minLength=1
// +k8s:validation:pattern="^.+$"
export type TimeIntervalRef = string;

export const defaultTimeIntervalRef = (): TimeIntervalRef => ("");

// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
// +k8s:validation:minProperties=1
export type ExpressionMap = Record<string, Expression>;

export const defaultExpressionMap = (): ExpressionMap => ({});

export interface Expression {
	// The type of query if this is a query expression
	queryType?: string;
	relativeTimeRange?: RelativeTimeRange;
	// The UID of the datasource to run this expression against. If omitted, the expression will be run against the `__expr__` datasource
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
	datasourceUID?: DatasourceUID;
	model: any;
	// Used to mark the expression to be used as the final source for the rule evaluation
	// Only one expression in a rule can be marked as the source
	// For AlertRules, this is the expression that will be evaluated against the alerting condition
	// For RecordingRules, this is the expression that will be recorded
	source?: boolean;
}

export const defaultExpression = (): Expression => ({
	model: {},
});

export interface RelativeTimeRange {
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	from: PromDurationWMillis;
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
	to: PromDurationWMillis;
}

export const defaultRelativeTimeRange = (): RelativeTimeRange => ({
	from: defaultPromDurationWMillis(),
	to: defaultPromDurationWMillis(),
});

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)$"
export type PromDurationWMillis = string;

export const defaultPromDurationWMillis = (): PromDurationWMillis => ("");

// +k8s:validation:minLength=1
// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
export type DatasourceUID = string;

export const defaultDatasourceUID = (): DatasourceUID => ("");

export interface Spec {
	// +k8s:validation:minLength=1
	title: string;
	paused?: boolean;
	trigger: Trigger;
	labels?: Record<string, TemplateString>;
	annotations?: Record<string, TemplateString>;
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	for?: string;
	// +k8s:validation:minLength=1
	// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
	keepFiringFor?: string;
	// +k8s:validation:minimum=0
	missingSeriesEvalsToResolve?: number;
	noDataState: string;
	execErrState: string;
	notificationSettings?: {
		// +k8s:validation:minLength=1
		receiver: string;
		groupBy?: string[];
		// +k8s:validation:minLength=1
		// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
		groupWait?: PromDuration;
		// +k8s:validation:minLength=1
		// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
		groupInterval?: PromDuration;
		// +k8s:validation:minLength=1
		// +k8s:validation:pattern="^((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?|0)$"
		repeatInterval?: PromDuration;
		// +k8s:validation:items:minLength=1
		// +k8s:validation:items:pattern="^.+$"
		muteTimeIntervals?: TimeIntervalRef[];
		// +k8s:validation:items:minLength=1
		// +k8s:validation:items:pattern="^.+$"
		activeTimeIntervals?: TimeIntervalRef[];
	};
	// Expressions must contain at least one entry. Admission validation enforces exactly one expression with source=true.
	// +k8s:validation:minProperties=1
	expressions: ExpressionMap;
	panelRef?: {
		// +k8s:validation:minLength=1
		// +k8s:validation:pattern="^[a-zA-Z0-9_-]+$"
		dashboardUID: string;
		// +k8s:validation:minimum=0
		// +k8s:validation:exclusiveMinimum
		panelID: number;
	};
}

export const defaultSpec = (): Spec => ({
	title: "",
	trigger: defaultTrigger(),
	noDataState: "NoData",
	execErrState: "Error",
	expressions: defaultExpressionMap(),
});

