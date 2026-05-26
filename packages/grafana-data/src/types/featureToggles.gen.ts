// NOTE: This file was auto generated.  DO NOT EDIT DIRECTLY!
// To change feature flags, edit:
//  pkg/services/featuremgmt/registry.go
// Then run tests in:
//  pkg/services/featuremgmt/toggles_gen_test.go

/**
 * Describes available feature toggles in Grafana. These can be configured via
 * conf/custom.ini to enable features under development or not yet available in
 * stable version.
 *
 * Only enabled values will be returned in this interface.
 *
 * NOTE: the possible values may change between versions without notice, although
 * this may cause compilation issues when depending on removed feature keys, the
 * runtime state will continue to work.
 *
 * @public
 */
export interface FeatureToggles {
  /**
  * Search for dashboards using panel title
  * @default false
  */
  panelTitleSearch?: boolean;
  /**
  * Enables public dashboard sharing to be restricted to only allowed emails
  * @default false
  */
  publicDashboardsEmailSharing?: boolean;
  /**
  * Support new streaming approach for loki (prototype, needs special loki build)
  * @default false
  */
  lokiExperimentalStreaming?: boolean;
  /**
  * Highlight Grafana Enterprise features
  * @default false
  */
  featureHighlights?: boolean;
  /**
  * Configurable storage for dashboards, datasources, and resources
  * @default false
  */
  storage?: boolean;
  /**
  * Allow elements nesting
  * @default false
  */
  canvasPanelNesting?: boolean;
  /**
  * Run the GRPC server
  * @default false
  */
  grpcServer?: boolean;
  /**
  * Enables cross-account querying in CloudWatch datasources
  * @default true
  */
  cloudWatchCrossAccountQuerying?: boolean;
  /**
  * Rule backtesting API for alerting
  * @default false
  */
  alertingBacktesting?: boolean;
  /**
  * Sort alert rule groups by folder full path in the Prometheus rules API
  * @default false
  */
  alertingRuleGroupSortByFolderFullpath?: boolean;
  /**
  * Use stream shards to split queries into smaller subqueries
  * @default false
  */
  lokiShardSplitting?: boolean;
  /**
  * Split large interval queries into subqueries with smaller time intervals
  * @default true
  */
  lokiQuerySplitting?: boolean;
  /**
  * Query InfluxDB InfluxQL without the proxy
  * @default true
  */
  influxdbBackendMigration?: boolean;
  /**
  * Registers a live apiserver
  * @default false
  */
  liveAPIServer?: boolean;
  /**
  * populate star status from apiserver
  * @default false
  */
  starsFromAPIServer?: boolean;
  /**
  * Enable streaming JSON parser for InfluxDB datasource InfluxQL query language
  * @default false
  */
  influxqlStreamingParser?: boolean;
  /**
  * Enables running InfluxDB Influxql queries in parallel
  * @default false
  */
  influxdbRunQueriesInParallel?: boolean;
  /**
  * Changes logs responses from Loki to be compliant with the dataplane specification.
  * @default false
  */
  lokiLogsDataplane?: boolean;
  /**
  * Disables dataplane specific processing in server side expressions.
  * @default false
  */
  disableSSEDataplane?: boolean;
  /**
  * Uses JWT-based auth for rendering instead of relying on remote cache
  * @default true
  */
  renderAuthJWT?: boolean;
  /**
  * Refactor time range variables flow to reduce number of API calls made when query variables are chained
  * @default false
  */
  refactorVariablesTimeRange?: boolean;
  /**
  * Enable the data source selector within the Frontend Apps section of the Frontend Observability
  * @default false
  */
  faroDatasourceSelector?: boolean;
  /**
  * Enable Faro session replay for Grafana
  * @default false
  */
  faroSessionReplay?: boolean;
  /**
  * Support temporary security credentials in AWS plugins for Grafana Cloud customers
  * @default true
  */
  awsDatasourcesTempCredentials?: boolean;
  /**
  * Enable support for Machine Learning in server-side expressions
  * @default false
  */
  mlExpressions?: boolean;
  /**
  * Expose some datasources as apiservers.
  * @default false
  */
  datasourceAPIServers?: boolean;
  /**
  * Register experimental APIs with the k8s API server, including all datasources
  * @default false
  */
  grafanaAPIServerWithExperimentalAPIs?: boolean;
  /**
  * Enables Git Sync and as-code provisioning for Grafana resources
  * @default true
  */
  provisioning?: boolean;
  /**
  * Allow setting folder metadata for provisioned folders
  * @default true
  */
  provisioningFolderMetadata?: boolean;
  /**
  * Enable export functionality for provisioned resources
  * @default false
  */
  provisioningExport?: boolean;
  /**
  * Start an additional https handler and write kubectl options
  * @default false
  */
  grafanaAPIServerEnsureKubectlAccess?: boolean;
  /**
  * Enable caching for async queries for Redshift and Athena. Requires that the datasource has caching and async query support enabled
  * @default true
  */
  awsAsyncQueryCaching?: boolean;
  /**
  * Enable changing the scheduler base interval via configuration option unified_alerting.scheduler_tick_interval
  * @default false
  */
  configurableSchedulerTick?: boolean;
  /**
  * Enable AI powered features in dashboards
  * @default true
  */
  dashgpt?: boolean;
  /**
  * Enable AI powered features for dashboards to auto-summary changes when saving
  * @default false
  */
  aiGeneratedDashboardChanges?: boolean;
  /**
  * Enables CSV encoding options in the reporting feature
  * @default false
  */
  reportingCsvEncodingOptions?: boolean;
  /**
  * Enables configuration of PDF report settings
  * @default false
  */
  reportingHeaderSettings?: boolean;
  /**
  * Enables the configurable footer settings for PDF reports
  * @default false
  */
  reportingFooterSettings?: boolean;
  /**
  * Send query to the same datasource in a single request when using server side expressions. The `cloudWatchBatchQueries` feature toggle should be enabled if this used with CloudWatch.
  * @default false
  */
  sseGroupByDatasource?: boolean;
  /**
  * Isolate expression build errors to the broken expression's refID instead of failing the entire pipeline
  * @default false
  */
  sseExpressionErrorIsolation?: boolean;
  /**
  * Enables running Loki queries in parallel
  * @default false
  */
  lokiRunQueriesInParallel?: boolean;
  /**
  * Automatic service account and token setup for plugins
  * @default false
  */
  externalServiceAccounts?: boolean;
  /**
  * Routes snapshot requests from /api to the /apis endpoint
  * @default false
  */
  kubernetesSnapshots?: boolean;
  /**
  * Routes library panel requests from /api to the /apis endpoint
  * @default false
  */
  kubernetesLibraryPanels?: boolean;
  /**
  * Enables k8s short url api and uses it under the hood when handling legacy /api
  * @default false
  */
  kubernetesShortURLs?: boolean;
  /**
  * Routes short url requests from /api to the /apis endpoint in the frontend. Depends on kubernetesShortURLs
  * @default false
  */
  useKubernetesShortURLsAPI?: boolean;
  /**
  * Adds support for Kubernetes correlations
  * @default false
  */
  kubernetesCorrelations?: boolean;
  /**
  * Adds support for Kubernetes unified storage quotas
  * @default false
  */
  kubernetesUnifiedStorageQuotas?: boolean;
  /**
  * Adds support for Kubernetes logs drilldown
  * @default false
  */
  kubernetesLogsDrilldown?: boolean;
  /**
  * Adds support for Kubernetes querycaching
  * @default false
  */
  kubernetesQueryCaching?: boolean;
  /**
  * Disable schema validation for dashboards/v1
  * @default false
  */
  dashboardDisableSchemaValidationV1?: boolean;
  /**
  * Disable schema validation for dashboards/v2
  * @default false
  */
  dashboardDisableSchemaValidationV2?: boolean;
  /**
  * Log schema validation errors so they can be analyzed later
  * @default false
  */
  dashboardSchemaValidationLogging?: boolean;
  /**
  * Enable fallback parsing behavior when scan row encounters invalid dashboard JSON
  * @default false
  */
  scanRowInvalidDashboardParseFallbackEnabled?: boolean;
  /**
  * Show query type endpoints in datasource API servers (currently hardcoded for testdata, expressions, and prometheus)
  * @default false
  */
  datasourceQueryTypes?: boolean;
  /**
  * Register legacy datasource apis that use the numeric id
  * @default false
  */
  datasourceLegacyIdApi?: boolean;
  /**
  * Register /apis/query.grafana.app/ -- will eventually replace /api/ds/query
  * @default false
  */
  queryService?: boolean;
  /**
  * Adds datasource connections to the query service
  * @default false
  */
  queryServiceWithConnections?: boolean;
  /**
  * Use the new datasource API groups for datasource CRUD requests
  * @default false
  */
  useNewAPIsForDatasourceCRUD?: boolean;
  /**
  * Rewrite requests targeting /ds/query to the query service
  * @default false
  */
  queryServiceRewrite?: boolean;
  /**
  * Routes requests to the new query service
  * @default false
  */
  queryServiceFromUI?: boolean;
  /**
  * Handle datasource CRUD requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.
  * @default false
  */
  datasourcesRerouteLegacyCRUDAPIs?: boolean;
  /**
  * Handle datasource resource requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.
  * @default false
  */
  datasourcesApiServerEnableResourceEndpoint?: boolean;
  /**
  * redirect datasource resource requests from the legacy API routes to the new datasource api group endpoints.
  * @default false
  */
  datasourcesApiserverEnableResourceEndpointRedirect?: boolean;
  /**
  * use raw output mode for the data source querier
  * @default false
  */
  datasourcesQuerierRawOutput?: boolean;
  /**
  * Runs CloudWatch metrics queries as separate batches
  * @default false
  */
  cloudWatchBatchQueries?: boolean;
  /**
  * If enabled, the caching backend gradually serializes query responses for the cache, comparing against the configured `[caching]max_value_mb` value as it goes. This can can help prevent Grafana from running out of memory while attempting to cache very large query responses.
  * @default false
  */
  cachingOptimizeSerializationMemoryUsage?: boolean;
  /**
  * Enable Grafana to sync configuration and state with a remote Alertmanager.
  * @default false
  */
  alertmanagerRemoteSecondary?: boolean;
  /**
  * Enables a feature to avoid issues with concurrent writes to the alerting provenance table in MySQL
  * @default false
  */
  alertingProvenanceLockWrites?: boolean;
  /**
  * Enables the UI to use certain backend-side filters
  * @default true
  */
  alertingUIUseBackendFilters?: boolean;
  /**
  * Enables the UI to use rules backend-side filters 100% compatible with the frontend filters
  * @default true
  */
  alertingUIUseFullyCompatBackendFilters?: boolean;
  /**
  * Enables creating alert rules from a panel using a drawer UI
  * @default false
  */
  createAlertRuleFromPanel?: boolean;
  /**
  * Enable Grafana to have a remote Alertmanager instance as the primary Alertmanager.
  * @default false
  */
  alertmanagerRemotePrimary?: boolean;
  /**
  * Change the way annotation permissions work by scoping them to folders and dashboards.
  * @default true
  */
  annotationPermissionUpdate?: boolean;
  /**
  * Enables annotation clustering and switches to refactored annotation code
  * @default false
  */
  annotationsClustering?: boolean;
  /**
  * Enables new dashboard layouts
  * @default true
  */
  dashboardNewLayouts?: boolean;
  /**
  * Enables default layout selector in dashboard settings
  * @default true
  */
  dashboardDefaultLayoutSelector?: boolean;
  /**
  * Enables the assistant prompt popover on panel click in dashboard view mode
  * @default false
  */
  dashboardAssistantPopover?: boolean;
  /**
  * Enables undo/redo in dynamic dashboards
  * @default false
  */
  dashboardUndoRedo?: boolean;
  /**
  * Enables unlimited dashboard panel grouping
  * @default false
  */
  unlimitedLayoutsNesting?: boolean;
  /**
  * Enables CSV export using scenes dashboard architecture
  * @default false
  */
  sceneCsvExport?: boolean;
  /**
  * Enables showing recently used drilldowns or recommendations given by the datasource in the AdHocFilters and GroupBy variables
  * @default false
  */
  drilldownRecommendations?: boolean;
  /**
  * Enables viewing non-applicable drilldowns on a panel level
  * @default false
  */
  perPanelNonApplicableDrilldowns?: boolean;
  /**
  * Enables a group by action per panel
  * @default false
  */
  panelGroupBy?: boolean;
  /**
  * Enables filtering by grouping labels on the panel level through legend or tooltip
  * @default false
  */
  perPanelFiltering?: boolean;
  /**
  * Enables the dashboard filters overview pane
  * @default false
  */
  dashboardFiltersOverview?: boolean;
  /**
  * Enables the feedback button in the dashboard edit sidebar
  * @default true
  */
  feedbackButton?: boolean;
  /**
  * Enables use of the `systemPanelFilterVar` variable to filter panels in a dashboard
  * @default false
  */
  panelFilterVariable?: boolean;
  /**
  * Enables generating table data as PDF in reporting
  * @default false
  */
  pdfTables?: boolean;
  /**
  * Enable v2 dashboard layout support in reports (auto-grid, tabs, rows)
  * @default false
  */
  reportingV2Layouts?: boolean;
  /**
  * Enables render binding support for report rendering
  * @default false
  */
  reportRenderBinding?: boolean;
  /**
  * Allow pan and zoom in canvas panel
  * @default false
  */
  canvasPanelPanZoom?: boolean;
  /**
  * Enables time comparison option in supported panels
  * @default false
  */
  timeComparison?: boolean;
  /**
  * Enables shared crosshair in table panel
  * @default false
  */
  tableSharedCrosshair?: boolean;
  /**
  * Enabled grafana cloud specific RBAC roles
  * @default false
  */
  cloudRBACRoles?: boolean;
  /**
  * Optimizes eligible queries in order to reduce load on datasources
  * @default false
  */
  alertingQueryOptimization?: boolean;
  /**
  * Distributes alert rule evaluations more evenly over time, including spreading out rules within the same group. Disables sequential evaluation if enabled.
  * @default false
  */
  jitterAlertRulesWithinGroups?: boolean;
  /**
  * Enable audit logging with Kubernetes under app platform
  * @default false
  */
  auditLoggingAppPlatform?: boolean;
  /**
  * Enable the secrets management app platform UI
  * @default false
  */
  secretsManagementAppPlatformUI?: boolean;
  /**
  * Enable the Secrets Keeper management UI for configuring external secret storage
  * @default false
  */
  secretsKeeperUI?: boolean;
  /**
  * Writes the state periodically to the database, asynchronous to rule evaluation
  * @default false
  */
  alertingSaveStatePeriodic?: boolean;
  /**
  * Enables the compressed protobuf-based alert state storage. Default is enabled.
  * @default true
  */
  alertingSaveStateCompressed?: boolean;
  /**
  * In-development feature flag for the scope api using the app platform.
  * @default false
  */
  scopeApi?: boolean;
  /**
  * Use the single node endpoint for the scope api. This is used to fetch the scope parent node.
  * @default false
  */
  useScopeSingleNodeEndpoint?: boolean;
  /**
  * Makes the frontend use the 'names' param for fetching multiple scope nodes at once
  * @default false
  */
  useMultipleScopeNodesEndpoint?: boolean;
  /**
  * In-development feature that will allow injection of labels into loki queries.
  * @default false
  */
  logQLScope?: boolean;
  /**
  * Enables SQL Expressions, which can execute SQL queries against data source results.
  * @default false
  */
  sqlExpressions?: boolean;
  /**
  * Enables column autocomplete for SQL Expressions
  * @default false
  */
  sqlExpressionsColumnAutoComplete?: boolean;
  /**
  * Enable grafana's embedded kube-aggregator
  * @default false
  */
  kubernetesAggregator?: boolean;
  /**
  * Enable CAP token based authentication in grafana's embedded kube-aggregator
  * @default false
  */
  kubernetesAggregatorCapTokenAuth?: boolean;
  /**
  * Enable groupBy variable support in scenes dashboards
  * @default false
  */
  groupByVariable?: boolean;
  /**
  * Enables the use of scope filters in Grafana
  * @default false
  */
  scopeFilters?: boolean;
  /**
  * Require that sub claims is present in oauth tokens.
  * @default false
  */
  oauthRequireSubClaim?: boolean;
  /**
  * Require that refresh tokens are present in oauth tokens.
  * @default false
  */
  refreshTokenRequired?: boolean;
  /**
  * Enables filters and group by variables on all new dashboards. Variables are added only if default data source supports filtering.
  * @default false
  */
  newDashboardWithFiltersAndGroupBy?: boolean;
  /**
  * Wraps the ad hoc and group by variables in a single wrapper, with all other variables below it
  * @default false
  */
  dashboardAdHocAndGroupByWrapper?: boolean;
  /**
  * Renders ad hoc filters and group by in a single unified control
  * @default false
  */
  dashboardUnifiedDrilldownControls?: boolean;
  /**
  * Enables configuring default origin filters for ad-hoc filter variables
  * @default false
  */
  adHocFilterDefaultValues?: boolean;
  /**
  * Updates CloudWatch label parsing to be more accurate
  * @default true
  */
  cloudWatchNewLabelParsing?: boolean;
  /**
  * In server-side expressions, disable the sorting of numeric-kind metrics by their metric name or labels.
  * @default false
  */
  disableNumericMetricsSortingInExpressions?: boolean;
  /**
  * Enables Grafana-managed recording rules.
  * @default false
  */
  grafanaManagedRecordingRules?: boolean;
  /**
  * Enables Saved queries (query library) feature
  * @default false
  */
  queryLibrary?: boolean;
  /**
  * Enables RBAC for playlists
  * @default false
  */
  playlistsRBAC?: boolean;
  /**
  * Enables Saved queries (query library) RBAC permissions
  * @default false
  */
  savedQueriesRBAC?: boolean;
  /**
  * Enables the new Saved queries (query library) modal experience
  * @default false
  */
  newSavedQueriesExperience?: boolean;
  /**
  * Enables the new unconfigured panel experience
  * @default true
  */
  newUnconfiguredPanel?: boolean;
  /**
  * Displays datasource provisioned dashboards in dashboard empty page, only when coming from datasource configuration page
  * @default false
  */
  dashboardLibrary?: boolean;
  /**
  * Displays datasource provisioned and community dashboards in dashboard empty page, only when coming from datasource configuration page
  * @default false
  */
  suggestedDashboards?: boolean;
  /**
  * Enables dashboard validator app to run compatibility checks between a dashboard and data source
  * @default false
  */
  dashboardValidatorApp?: boolean;
  /**
  * Enables a flow to get started with a new dashboard from a template
  * @default false
  */
  dashboardTemplates?: boolean;
  /**
  * Enables the Assistant button in the dashboard templates card
  * @default false
  */
  dashboardTemplatesAssistantButton?: boolean;
  /**
  * Enables the 'Customize with Assistant' button on suggested dashboard cards
  * @default false
  */
  suggestedDashboardsAssistantButton?: boolean;
  /**
  * Enables the new alert list view design
  * @default true
  */
  alertingListViewV2?: boolean;
  /**
  * Enables enhanced stat mode for the Alert List panel with thresholds, value mappings, and linking
  * @default false
  */
  alertingAlertListPanelEnhancements?: boolean;
  /**
  * Enables the new Alerting navigation structure with improved menu grouping
  * @default true
  */
  alertingNavigationV2?: boolean;
  /**
  * Disables the ability to send alerts to an external Alertmanager datasource.
  * @default false
  */
  alertingDisableSendAlertsExternal?: boolean;
  /**
  * Use the new k8s API for fetching integration type schemas
  * @default false
  */
  alertingSyncNotifiersApiMigration?: boolean;
  /**
  * Enables possibility to preserve dashboard variables and time range when navigating between dashboards
  * @default false
  */
  preserveDashboardStateWhenNavigating?: boolean;
  /**
  * Enables the new central alert history.
  * @default false
  */
  alertingCentralAlertHistory?: boolean;
  /**
  * Preserve plugin proxy trailing slash.
  * @default false
  */
  pluginProxyPreserveTrailingSlash?: boolean;
  /**
  * Allows configuration of Azure Monitor as a data source that can provide Prometheus exemplars
  * @default true
  */
  azureMonitorPrometheusExemplars?: boolean;
  /**
  * Enables the gRPC server for authorization
  * @default false
  */
  authZGRPCServer?: boolean;
  /**
  * Use openFGA as authorization engine.
  * @default false
  */
  zanzana?: boolean;
  /**
  * Use openFGA as main authorization engine and disable legacy RBAC clietn.
  * @default false
  */
  zanzanaNoLegacyClient?: boolean;
  /**
  * Enables reload of dashboards on scopes, time range and variables changes
  * @default false
  */
  reloadDashboardsOnParamsChange?: boolean;
  /**
  * Enables the scopes usage in Metrics Explore
  * @default false
  */
  enableScopesInMetricsExplore?: boolean;
  /**
  * Round up end time for metric queries to the next minute to avoid missing data
  * @default true
  */
  cloudWatchRoundUpEndTime?: boolean;
  /**
  * Deprecated. Allow override default AAD audience for Azure Prometheus endpoint. Enabled by default. This feature should no longer be used and will be removed in the future.
  * @deprecated
  * @default true
  */
  prometheusAzureOverrideAudience?: boolean;
  /**
  * Enable grafana dataplane aggregator
  * @default false
  */
  dataplaneAggregator?: boolean;
  /**
  * Allows authenticated API calls in actions
  * @default false
  */
  vizActionsAuth?: boolean;
  /**
  * Uses Prometheus rules as the primary source of truth for ruler-enabled data sources
  * @default false
  */
  alertingPrometheusRulesPrimary?: boolean;
  /**
  * Deprecated. Replace with lokiShardSplitting. Used in Logs Drilldown to split queries into multiple queries based on the number of shards
  * @default false
  */
  exploreLogsShardSplitting?: boolean;
  /**
  * Used in Logs Drilldown to query by aggregated metrics
  * @default false
  */
  exploreLogsAggregatedMetrics?: boolean;
  /**
  * Enables the gRPC client to authenticate with the App Platform by using ID & access tokens
  * @default false
  */
  appPlatformGrpcClientAuth?: boolean;
  /**
  * Enable the groupsync extension for managing Group Attribute Sync feature
  * @default false
  */
  groupAttributeSync?: boolean;
  /**
  * Enable the new matcher-based UI and config shape for the Group to Nested Tables transformation
  * @default false
  */
  groupToNestedTableV2?: boolean;
  /**
  * Enables step mode for alerting queries and expressions
  * @default true
  */
  alertingQueryAndExpressionsStepMode?: boolean;
  /**
  * Enables improved support for OAuth external sessions. After enabling this feature, users might need to re-authenticate themselves.
  * @default true
  */
  improvedExternalSessionHandling?: boolean;
  /**
  * Use session storage for handling the redirection after login
  * @default true
  */
  useSessionStorageForRedirection?: boolean;
  /**
  * Enables the new role picker drawer design
  * @default false
  */
  rolePickerDrawer?: boolean;
  /**
  * Pick the dual write mode from database configs
  * @default false
  */
  managedDualWriter?: boolean;
  /**
  * Enables SRI checks for plugin assets
  * @default false
  */
  pluginsSriChecks?: boolean;
  /**
  * Enables to save big objects in blob storage
  * @default false
  */
  unifiedStorageBigObjectsSupport?: boolean;
  /**
  * Enables time pickers sync
  * @default false
  */
  timeRangeProvider?: boolean;
  /**
  * Enables time range panning functionality
  * @default true
  */
  timeRangePan?: boolean;
  /**
  * Enables new keyboard shortcuts for time range zoom operations
  * @default true
  */
  newTimeRangeZoomShortcuts?: boolean;
  /**
  * Disables the log limit restriction for Azure Monitor when true. The limit is enabled by default.
  * @default false
  */
  azureMonitorDisableLogLimit?: boolean;
  /**
  * Enables experimental reconciler for playlists
  * @default false
  */
  playlistsReconciler?: boolean;
  /**
  * Adds support for quotes and special characters in label values for Prometheus queries
  * @default false
  */
  prometheusSpecialCharsInLabelValues?: boolean;
  /**
  * Enables the extension admin page regardless of development mode
  * @default false
  */
  enableExtensionsAdminPage?: boolean;
  /**
  * Enables SCIM support for user and group management
  * @default true
  */
  enableSCIM?: boolean;
  /**
  * Enables browser crash detection reporting to Faro.
  * @default false
  */
  crashDetection?: boolean;
  /**
  * Enables removing the reducer from the alerting UI when creating a new alert rule and using instant query
  * @default true
  */
  alertingUIOptimizeReducer?: boolean;
  /**
  * Enables user auth for Azure Monitor datasource only
  * @default true
  */
  azureMonitorEnableUserAuth?: boolean;
  /**
  * Enable AI-generated alert rules.
  * @default false
  */
  alertingAIGenAlertRules?: boolean;
  /**
  * Enable AI-generated feedback from the Grafana UI.
  * @default false
  */
  alertingAIFeedback?: boolean;
  /**
  * Enable AI-improve alert rules labels and annotations.
  * @default false
  */
  alertingAIImproveAlertRules?: boolean;
  /**
  * Enable AI-generated alerting templates.
  * @default false
  */
  alertingAIGenTemplates?: boolean;
  /**
  * Enable enrichment per rule in the alerting UI.
  * @default false
  */
  alertingEnrichmentPerRule?: boolean;
  /**
  * Enable Assistant Investigations enrichment type.
  * @default false
  */
  alertingEnrichmentAssistantInvestigations?: boolean;
  /**
  * Enable AI-analyze central state history.
  * @default false
  */
  alertingAIAnalyzeCentralStateHistory?: boolean;
  /**
  * Enables simplified step mode in the notifications section
  * @default true
  */
  alertingNotificationsStepMode?: boolean;
  /**
  * Enable unified storage search UI
  * @default false
  */
  unifiedStorageSearchUI?: boolean;
  /**
  * Enables cross cluster search in the Elasticsearch data source
  * @default false
  */
  elasticsearchCrossClusterSearch?: boolean;
  /**
  * Defaults to using the Loki `/labels` API instead of `/series`
  * @default true
  */
  lokiLabelNamesQueryApi?: boolean;
  /**
  * Enables improved support for SAML external sessions. Ensure the NameID format is correctly configured in Grafana for SAML Single Logout to function properly.
  * @default true
  */
  improvedExternalSessionHandlingSAML?: boolean;
  /**
  * Enables LBAC for datasources for Tempo to apply LBAC filtering of traces to the client requests for users in teams
  * @default false
  */
  teamHttpHeadersTempo?: boolean;
  /**
  * Use the Kubernetes TeamLBACRule API for team HTTP headers on datasource query requests
  * @default false
  */
  teamHttpHeadersFromAppPlatform?: boolean;
  /**
  * Use the Kubernetes TeamLBACRule API for reading team LBAC rules in the legacy API server
  * @default false
  */
  teamLBACApiReadFromAppPlatform?: boolean;
  /**
  * Enables Advisor app
  * @default true
  */
  grafanaAdvisor?: boolean;
  /**
  * Enables less memory intensive Elasticsearch result parsing
  * @default false
  */
  elasticsearchImprovedParsing?: boolean;
  /**
  * Shows defined connections for a data source in the plugins detail page
  * @default false
  */
  datasourceConnectionsTab?: boolean;
  /**
  * Use a POST request to list rules by passing down the namespaces user has access to
  * @default false
  */
  fetchRulesUsingPost?: boolean;
  /**
  * Add compact=true when fetching rules
  * @default false
  */
  fetchRulesInCompactMode?: boolean;
  /**
  * Enables the new logs panel
  * @default true
  */
  newLogsPanel?: boolean;
  /**
  * Enables the temporary themes for GrafanaCon
  * @default true
  */
  grafanaconThemes?: boolean;
  /**
  * Enables the new Jira integration for contact points in cloud alert managers.
  * @default false
  */
  alertingJiraIntegration?: boolean;
  /**
  * 
  * @default true
  */
  alertingUseNewSimplifiedRoutingHashAlgorithm?: boolean;
  /**
  * Use the scopes navigation endpoint instead of the dashboardbindings endpoint
  * @default false
  */
  useScopesNavigationEndpoint?: boolean;
  /**
  * Enable scope search to include all levels of the scope node tree
  * @default false
  */
  scopeSearchAllLevels?: boolean;
  /**
  * Enables the alert rule version history restore feature
  * @default true
  */
  alertingRuleVersionHistoryRestore?: boolean;
  /**
  * Enables the report creation drawer in a dashboard
  * @default false
  */
  newShareReportDrawer?: boolean;
  /**
  * Disable pre-loading app plugins when the request is coming from the renderer
  * @default false
  */
  rendererDisableAppPluginsPreload?: boolean;
  /**
  * Enables SRI checks for Grafana JavaScript assets
  * @default false
  */
  assetSriChecks?: boolean;
  /**
  * Enables the alert rule restore feature
  * @default true
  */
  alertRuleRestore?: boolean;
  /**
  * Enables running Infinity queries in parallel
  * @default false
  */
  infinityRunQueriesInParallel?: boolean;
  /**
  * Enables the alerting migration UI, to migrate data source-managed rules to Grafana-managed rules
  * @default true
  */
  alertingMigrationUI?: boolean;
  /**
  * Enables a UI feature for importing rules from a Prometheus file to Grafana-managed rules
  * @default true
  */
  alertingImportYAMLUI?: boolean;
  /**
  * Enables the migration wizard UI to migrate alert rules and notification resources from external sources to Grafana Alerting
  * @default false
  */
  alertingMigrationWizardUI?: boolean;
  /**
  * Enables the logs builder mode for the Azure Monitor data source
  * @default false
  */
  azureMonitorLogsBuilderEditor?: boolean;
  /**
  * Specifies the locale so the correct format for numbers and dates can be shown
  * @deprecated
  * @default false
  */
  localeFormatPreference?: boolean;
  /**
  * Enables the unified storage grpc connection pool
  * @default false
  */
  unifiedStorageGrpcConnectionPool?: boolean;
  /**
  * Enables UI functionality to permanently delete alert rules
  * @default true
  */
  alertingRulePermanentlyDelete?: boolean;
  /**
  * Enables the UI functionality to recover and view deleted alert rules
  * @default true
  */
  alertingRuleRecoverDeleted?: boolean;
  /**
  * use multi-tenant path for awsTempCredentials
  * @default false
  */
  multiTenantTempCredentials?: boolean;
  /**
  * Enables unified navbars
  * @default false
  */
  unifiedNavbars?: boolean;
  /**
  * Enables a control component for the logs panel in Explore
  * @default true
  */
  logsPanelControls?: boolean;
  /**
  * Enables creating metrics from profiles and storing them as recording rules
  * @default false
  */
  metricsFromProfiles?: boolean;
  /**
  * Enables integration with Grafana Assistant in Profiles Drilldown
  * @default true
  */
  grafanaAssistantInProfilesDrilldown?: boolean;
  /**
  * Enables creating alerts from Tempo data source
  * @default false
  */
  tempoAlerting?: boolean;
  /**
  * Enables auto-updating of users installed plugins
  * @default false
  */
  pluginsAutoUpdate?: boolean;
  /**
  * Enables the alerting list view v2 preview toggle
  * @default true
  */
  alertingListViewV2PreviewToggle?: boolean;
  /**
  * Use FiredAt for StartsAt when sending alerts to Alertmaanger
  * @default false
  */
  alertRuleUseFiredAtForStartsAt?: boolean;
  /**
  * Enables the alerting bulk actions in the UI
  * @default true
  */
  alertingBulkActionsInUI?: boolean;
  /**
  * Redirects the traffic from the legacy resource permissions endpoints to the new K8s AuthZ endpoints
  * @default false
  */
  kubernetesAuthZResourcePermissionsRedirect?: boolean;
  /**
  * Registers AuthZ resource permission /apis endpoints
  * @default false
  */
  kubernetesAuthzResourcePermissionApis?: boolean;
  /**
  * Enable sync of Zanzana authorization store on AuthZ CRD mutations
  * @default false
  */
  kubernetesAuthzZanzanaSync?: boolean;
  /**
  * Registers AuthZ Global Roles /apis endpoint
  * @default false
  */
  kubernetesAuthzGlobalRolesApi?: boolean;
  /**
  * Registers AuthZ Roles /apis endpoint
  * @default false
  */
  kubernetesAuthzRolesApi?: boolean;
  /**
  * Registers AuthZ TeamLBACRule /apis endpoint
  * @default false
  */
  kubernetesAuthzTeamLBACRuleApi?: boolean;
  /**
  * Registers AuthZ Role Bindings /apis endpoint
  * @default false
  */
  kubernetesAuthzRoleBindingsApi?: boolean;
  /**
  * Redirects the traffic from the legacy roles and role bindings endpoints to the new K8s AuthZ endpoints
  * @default false
  */
  kubernetesAuthzRolesAndRoleBindingsRedirect?: boolean;
  /**
  * Enables datasource resource permissions via the K8s IAM resource permission APIs
  * @default false
  */
  kubernetesAuthzDatasourceResourcePermissions?: boolean;
  /**
  * Enables restore deleted dashboards feature
  * @default true
  */
  restoreDashboards?: boolean;
  /**
  * Enables recently viewed dashboards section in the browsing dashboard page
  * @default false
  */
  recentlyViewedDashboards?: boolean;
  /**
  * A/A test for recently viewed dashboards feature
  * @default false
  */
  experimentRecentlyViewedDashboards?: boolean;
  /**
  * Enables the created by me search filter on the browse dashboards page
  * @default false
  */
  createdByMeSearchFilter?: boolean;
  /**
  * Enable configuration of alert enrichments in Grafana Cloud.
  * @default false
  */
  alertEnrichment?: boolean;
  /**
  * Allow multiple steps per enrichment.
  * @default false
  */
  alertEnrichmentMultiStep?: boolean;
  /**
  * Enable conditional alert enrichment steps.
  * @default false
  */
  alertEnrichmentConditional?: boolean;
  /**
  * Enable alert enrichment preview (notification-history-based) in view and edit drawers.
  * @default false
  */
  alertEnrichmentPreview?: boolean;
  /**
  * Enables the API to import Alertmanager configuration
  * @default false
  */
  alertingImportAlertmanagerAPI?: boolean;
  /**
  * Disables the DMA feature in the UI
  * @default false
  */
  alertingDisableDMAinUI?: boolean;
  /**
  * Enables image sharing functionality for dashboards
  * @default true
  */
  sharingDashboardImage?: boolean;
  /**
  * Prefer library panel title over viz panel title.
  * @default false
  */
  preferLibraryPanelTitle?: boolean;
  /**
  * Enables new design for the InfluxDB data source configuration page
  * @default false
  */
  newInfluxDSConfigPageDesign?: boolean;
  /**
  * Set this to true to enable all app chrome extensions registered by plugins.
  * @default false
  */
  enableAppChromeExtensions?: boolean;
  /**
  * Set this to true to enable all dashboard empty state extensions registered by plugins.
  * @default false
  */
  enableDashboardEmptyExtensions?: boolean;
  /**
  * Enables use of app platform API for folders
  * @default false
  */
  foldersAppPlatformAPI?: boolean;
  /**
  * Applies OTel formatting templates to displayed logs
  * @default false
  */
  otelLogsFormatting?: boolean;
  /**
  * Enables the notification history feature
  * @default false
  */
  alertingNotificationHistory?: boolean;
  /**
  * Enable dual reader for unified storage search
  * @default false
  */
  unifiedStorageSearchDualReaderEnabled?: boolean;
  /**
  * Supports __from and __to macros that always use the dashboard level time range
  * @default false
  */
  dashboardLevelTimeMacros?: boolean;
  /**
  * Starts Grafana in remote secondary mode pulling the latest state from the remote Alertmanager to avoid duplicate notifications.
  * @default false
  */
  alertmanagerRemoteSecondaryWithRemoteState?: boolean;
  /**
  * Enables sharing a list of APIs with a list of plugins
  * @default true
  */
  restrictedPluginApis?: boolean;
  /**
  * Enable favorite datasources
  * @default false
  */
  favoriteDatasources?: boolean;
  /**
  * New Log Context component
  * @default false
  */
  newLogContext?: boolean;
  /**
  * Enables new design for the Clickhouse data source configuration page
  * @default false
  */
  newClickhouseConfigPageDesign?: boolean;
  /**
  * Enables team folders functionality
  * @default false
  */
  teamFolders?: boolean;
  /**
  * Enables the interactive learning app
  * @default false
  */
  interactiveLearning?: boolean;
  /**
  * Enables the alerting triage feature
  * @default false
  */
  alertingTriage?: boolean;
  /**
  * Shows a promotional banner for the Alerts Activity feature on the Rule List page
  * @default false
  */
  alertingAlertsActivityBanner?: boolean;
  /**
  * Enables the Graphite data source full backend mode
  * @default false
  */
  graphiteBackendMode?: boolean;
  /**
  * Enables the updated Azure Monitor resource picker
  * @default true
  */
  azureResourcePickerUpdates?: boolean;
  /**
  * Checks for deprecated Prometheus authentication methods (SigV4 and Azure), installs the relevant data source, and migrates the Prometheus data sources
  * @deprecated
  * @default true
  */
  prometheusTypeMigration?: boolean;
  /**
  * Enables running plugins in containers
  * @default false
  */
  pluginContainers?: boolean;
  /**
  * Prioritize loading plugins from the CDN before other sources
  * @default false
  */
  cdnPluginsLoadFirst?: boolean;
  /**
  * Enable loading plugins via declarative URLs
  * @default false
  */
  cdnPluginsUrls?: boolean;
  /**
  * Enable syncing plugin installations to the installs API
  * @default false
  */
  pluginInstallAPISync?: boolean;
  /**
  * Enable new visualization suggestions
  * @default true
  */
  newVizSuggestions?: boolean;
  /**
  * Enable style actions (copy/paste) in the panel editor
  * @default false
  */
  panelStyleActions?: boolean;
  /**
  * Enable visualization presets
  * @default false
  */
  vizPresets?: boolean;
  /**
  * Enable all plugins to supply visualization suggestions (including 3rd party plugins)
  * @default true
  */
  externalVizSuggestions?: boolean;
  /**
  * Enable field overrides for FieldType.nestedFrames fields (like in nested tables)
  * @default false
  */
  nestedFramesFieldOverrides?: boolean;
  /**
  * Enable faceted labels filter for series visibility in the legend
  * @default false
  */
  vizLegendFacetedFilter?: boolean;
  /**
  * Enable Y-axis scale configuration options for pre-bucketed heatmap data (heatmap-rows)
  * @default false
  */
  heatmapRowsAxisOptions?: boolean;
  /**
  * Enable gradient color scheme option for the pie chart panel
  * @default false
  */
  pieChartGradientColorScheme?: boolean;
  /**
  * Restrict PanelChrome contents with overflow: hidden;
  * @default true
  */
  preventPanelChromeOverflow?: boolean;
  /**
  * Enable querying trace data through Jaeger's gRPC endpoint (HTTP)
  * @default false
  */
  jaegerEnableGrpcEndpoint?: boolean;
  /**
  * Load plugins on store service startup instead of wire provider, and call RegisterFixedRoles after all plugins are loaded
  * @default false
  */
  pluginStoreServiceLoading?: boolean;
  /**
  * Increases panel padding globally
  * @default true
  */
  newPanelPadding?: boolean;
  /**
  * When storing dashboard and folder resource permissions, only store action sets and not the full list of underlying permission
  * @default true
  */
  onlyStoreActionSets?: boolean;
  /**
  * Exclude redundant individual dashboard/folder permissions from managed roles at query time
  * @default false
  */
  excludeRedundantManagedPermissions?: boolean;
  /**
  * Show insights for plugins in the plugin details page
  * @default false
  */
  pluginInsights?: boolean;
  /**
  * Enables a new panel time settings drawer
  * @default false
  */
  panelTimeSettings?: boolean;
  /**
  * Enables the raw DSL query editor in the Elasticsearch data source
  * @default false
  */
  elasticsearchRawDSLQuery?: boolean;
  /**
  * Enables the ES|QL query editor in the Elasticsearch data source
  * @default false
  */
  elasticsearchESQLQuery?: boolean;
  /**
  * Enables http proxy settings for aws datasources
  * @default false
  */
  awsDatasourcesHttpProxy?: boolean;
  /**
  * Show transformation quick-start cards in empty transformations state
  * @default false
  */
  transformationsEmptyPlaceholder?: boolean;
  /**
  * Run queries through the data source backend
  * @default false
  */
  opentsdbBackendMigration?: boolean;
  /**
  * Enable TTL plugin instance manager
  * @default false
  */
  ttlPluginInstanceManager?: boolean;
  /**
  * Send X-Loki-Query-Limits-Context header to Loki on first split request
  * @default false
  */
  lokiQueryLimitsContext?: boolean;
  /**
  * Enables the new version of rudderstack
  * @default false
  */
  rudderstackUpgrade?: boolean;
  /**
  * Adds support for Kubernetes alerting historian APIs
  * @default false
  */
  kubernetesAlertingHistorian?: boolean;
  /**
  * Enables plugins decoupling from bootdata
  * @default false
  */
  useMTPlugins?: boolean;
  /**
  * Enables support for variables whose values can have multiple properties
  * @default true
  */
  multiPropsVariables?: boolean;
  /**
  * Enables support for section level variables (rows and tabs)
  * @default false
  */
  dashboardSectionVariables?: boolean;
  /**
  * Enables the ASAP smoothing transformation for time series data
  * @default false
  */
  smoothingTransformation?: boolean;
  /**
  * Enables the creation of keepers that manage secrets stored on AWS secrets manager
  * @default false
  */
  secretsManagementAppPlatformAwsKeeper?: boolean;
  /**
  * Enables profiles exemplars support in profiles drilldown
  * @default false
  */
  profilesExemplars?: boolean;
  /**
  * Use synchronized dispatch timer to minimize duplicate notifications across alertmanager HA pods
  * @default false
  */
  alertingSyncDispatchTimer?: boolean;
  /**
  * Enables the Query with Assistant button in the query editor
  * @default false
  */
  queryWithAssistant?: boolean;
  /**
  * Enables next generation query editor experience
  * @default false
  */
  queryEditorNext?: boolean;
  /**
  * Enables search for team bindings in the app platform API
  * @default false
  */
  kubernetesTeamBindings?: boolean;
  /**
  * Enables team APIs in the app platform
  * @default false
  */
  kubernetesTeamsApi?: boolean;
  /**
  * Redirects the request of the team endpoints to the app platform APIs
  * @default false
  */
  kubernetesTeamsRedirect?: boolean;
  /**
  * Enables user APIs in the app platform
  * @default false
  */
  kubernetesUsersApi?: boolean;
  /**
  * Enables service account APIs in the app platform
  * @default false
  */
  kubernetesServiceAccountsApi?: boolean;
  /**
  * Enables service account token APIs in the app platform
  * @default false
  */
  kubernetesServiceAccountTokensApi?: boolean;
  /**
  * Enables SSO settings APIs in the app platform
  * @default false
  */
  kubernetesSsoSettingsApi?: boolean;
  /**
  * Enables external group mapping APIs in the app platform
  * @default false
  */
  kubernetesExternalGroupMappingsApi?: boolean;
  /**
  * Redirects the request of the external group mapping endpoints to the app platform APIs
  * @default false
  */
  kubernetesExternalGroupMappingsRedirect?: boolean;
  /**
  * Use the new APIs for syncing users to teams
  * @default false
  */
  kubernetesTeamSync?: boolean;
  /**
  * Redirects the requests of the user service to the app platform APIs
  * @default false
  */
  kubernetesUsersRedirect?: boolean;
  /**
  * Enables the ability to create multiple alerting policies
  * @default false
  */
  alertingMultiplePolicies?: boolean;
  /**
  * Use notification settings policy field instead of labels for named policy routing in alert rules
  * @default false
  */
  alertingPolicyRoutingSettings?: boolean;
  /**
  * Registers an API server for each backend app plugin exposing a settings endpoint
  * @default false
  */
  appPluginAPIServer?: boolean;
  /**
  * Makes NoData and Error alerts fire immediately, without 'pending' stage
  * @default false
  */
  alertingIgnorePendingForNoDataAndError?: boolean;
  /**
  * Enables the notification history tab in the rule viewer
  * @default false
  */
  alertingNotificationHistoryRuleViewer?: boolean;
  /**
  * Enables the notification history global menu item viewer
  * @default false
  */
  alertingNotificationHistoryGlobal?: boolean;
  /**
  * Enables the notification history timeline in the triage instance details drawer
  * @default false
  */
  alertingNotificationHistoryTriage?: boolean;
  /**
  * Enables the notification history detail page
  * @default false
  */
  alertingNotificationHistoryDetail?: boolean;
  /**
  * Whether to use the new React 19 runtime
  * @default false
  */
  react19?: boolean;
  /**
  * Enables the frontend service to fetch tenant-specific settings overrides from the settings service
  * @default false
  */
  frontendServiceUseSettingsService?: boolean;
  /**
  * Whether to use the new SharedPreferences functional component
  * @default false
  */
  functionalSharedPreferences?: boolean;
  /**
  * Enables managed plugins v2 (expanded rollout, community plugin coverage)
  * @default false
  */
  managedPluginsV2?: boolean;
  /**
  * Remember the last viewed organization for users using SSO
  * @default true
  */
  rememberUserOrgForSso?: boolean;
  /**
  * Registers the dsabstraction app for querying datasources via unified SQL
  * @default false
  */
  dsAbstractionApp?: boolean;
  /**
  * Handle datasource health requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.
  * @default false
  */
  datasourcesApiServerEnableHealthEndpoint?: boolean;
  /**
  * Enables new analytics framework
  * @default false
  */
  analyticsFramework?: boolean;
  /**
  * Send Datsource health requests to /apis/ API routes instead of the legacy /api/datasources/uid/{uid}/health route.
  * @default false
  */
  datasourcesApiServerEnableHealthEndpointFrontend?: boolean;
  /**
  * Enables the new Flame Graph UI containing the Call Tree view
  * @default false
  */
  flameGraphWithCallTree?: boolean;
  /**
  * Enables the advisor report integration with datasource pages
  * @default false
  */
  advisorDatasourceIntegration?: boolean;
  /**
  * Enables an inline version of Log Details that creates no new scrolls
  * @default false
  */
  inlineLogDetailsNoScrolls?: boolean;
  /**
  * Enables the new colorblind-friendly themes
  * @default false
  */
  colorblindThemes?: boolean;
  /**
  * Enables fine-grained Y-axis tick options beyond the auto-ticks
  * @default false
  */
  yAxisTickControl?: boolean;
  /**
  * Enables the logs tableNG panel to replace existing tableRT
  * @default false
  */
  logsTablePanelNG?: boolean;
  /**
  * Enables plugins setting from new apis
  * @default false
  */
  useMTPluginSettings?: boolean;
  /**
  * Returns SSO auto-login information in /bootdata to automatically log in users with SSO when they access Grafana
  * @default false
  */
  frontendServiceSSOAutoLogin?: boolean;
  /**
  * Enables the splash screen modal for introducing new Grafana features on first session
  * @default true
  */
  splashScreen?: boolean;
  /**
  * Enables forwarding team headers from tempo for streaming requests with LBAC rules
  * @default false
  */
  streamingForwardTeamHeadersTempo?: boolean;
  /**
  * Aligns query splitting chunks with UTC midnight
  * @default false
  */
  lokiAlignedQuerySplitting?: boolean;
  /**
  * Enables the query service to fetch the configuration from the settings service
  * @default false
  */
  queryFetchConfigFromSettingsService?: boolean;
  /**
  * Enables the query service to do query caching
  * @default false
  */
  queryServiceQueryCaching?: boolean;
  /**
  * Enables the time seeker in traces drilldown
  * @default false
  */
  tracesDrilldownTimeSeeker?: boolean;
  /**
  * Mitigates React fiber's retention of previous props/state, causing 2x memory use: https://github.com/facebook/react/issues/36176
  * @default false
  */
  clearPreviousFieldValues?: boolean;
  /**
  * Enables loading datasource plugins from the MetaAPI instead of bootData settings
  * @default false
  */
  enableDatasourceMetaApiPluginLoading?: boolean;
  /**
  * Enables new colorblind safe palette and line fill patterns for panels
  * @default false
  */
  enableColorblindSafePanelOptions?: boolean;
  /**
  * Enables cache configs data migration to unified storage
  * @default false
  */
  cacheConfigUnifiedStorageMigration?: boolean;
  /**
  * Boots the frontend using the boot.js script built from TS instead of the embedded boot script
  * @default false
  */
  compiledBootScript?: boolean;
}

export type FeatureToggleDefaultValue = boolean | number | string | Record<string, unknown> | unknown[] | null;

export interface FeatureToggleMeta {
  name: keyof FeatureToggles & string;
  description: string;
  stage: string;
  owner: string;
  defaultExpression: string;
  defaultValue: FeatureToggleDefaultValue;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  hideFromDocs: boolean;
}

export const featureToggleMeta: FeatureToggleMeta[] = [
  {
    name: "panelTitleSearch",
    description: "Search for dashboards using panel title",
    stage: "preview",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "publicDashboardsEmailSharing",
    description: "Enables public dashboard sharing to be restricted to only allowed emails",
    stage: "preview",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "lokiExperimentalStreaming",
    description: "Support new streaming approach for loki (prototype, needs special loki build)",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "featureHighlights",
    description: "Highlight Grafana Enterprise features",
    stage: "GA",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "storage",
    description: "Configurable storage for dashboards, datasources, and resources",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "canvasPanelNesting",
    description: "Allow elements nesting",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grpcServer",
    description: "Run the GRPC server",
    stage: "preview",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cloudWatchCrossAccountQuerying",
    description: "Enables cross-account querying in CloudWatch datasources",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingBacktesting",
    description: "Rule backtesting API for alerting",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingRuleGroupSortByFolderFullpath",
    description: "Sort alert rule groups by folder full path in the Prometheus rules API",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiShardSplitting",
    description: "Use stream shards to split queries into smaller subqueries",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiQuerySplitting",
    description: "Split large interval queries into subqueries with smaller time intervals",
    stage: "GA",
    owner: "@grafana/observability-logs",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "influxdbBackendMigration",
    description: "Query InfluxDB InfluxQL without the proxy",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "liveAPIServer",
    description: "Registers a live apiserver",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: true,
    hideFromDocs: true,
  },
  {
    name: "starsFromAPIServer",
    description: "populate star status from apiserver",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "influxqlStreamingParser",
    description: "Enable streaming JSON parser for InfluxDB datasource InfluxQL query language",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "influxdbRunQueriesInParallel",
    description: "Enables running InfluxDB Influxql queries in parallel",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiLogsDataplane",
    description: "Changes logs responses from Loki to be compliant with the dataplane specification.",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "disableSSEDataplane",
    description: "Disables dataplane specific processing in server side expressions.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "renderAuthJWT",
    description: "Uses JWT-based auth for rendering instead of relying on remote cache",
    stage: "GA",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "refactorVariablesTimeRange",
    description: "Refactor time range variables flow to reduce number of API calls made when query variables are chained",
    stage: "preview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "faroDatasourceSelector",
    description: "Enable the data source selector within the Frontend Apps section of the Frontend Observability",
    stage: "preview",
    owner: "@grafana/app-o11y",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "faroSessionReplay",
    description: "Enable Faro session replay for Grafana",
    stage: "experimental",
    owner: "@grafana/session-replay",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "awsDatasourcesTempCredentials",
    description: "Support temporary security credentials in AWS plugins for Grafana Cloud customers",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "mlExpressions",
    description: "Enable support for Machine Learning in server-side expressions",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourceAPIServers",
    description: "Expose some datasources as apiservers.",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaAPIServerWithExperimentalAPIs",
    description: "Register experimental APIs with the k8s API server, including all datasources",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: true,
    hideFromDocs: false,
  },
  {
    name: "provisioning",
    description: "Enables Git Sync and as-code provisioning for Grafana resources",
    stage: "GA",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "provisioningFolderMetadata",
    description: "Allow setting folder metadata for provisioned folders",
    stage: "GA",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "provisioningExport",
    description: "Enable export functionality for provisioned resources",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaAPIServerEnsureKubectlAccess",
    description: "Start an additional https handler and write kubectl options",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: true,
    hideFromDocs: false,
  },
  {
    name: "awsAsyncQueryCaching",
    description: "Enable caching for async queries for Redshift and Athena. Requires that the datasource has caching and async query support enabled",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "configurableSchedulerTick",
    description: "Enable changing the scheduler base interval via configuration option unified_alerting.scheduler_tick_interval",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "dashgpt",
    description: "Enable AI powered features in dashboards",
    stage: "GA",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "aiGeneratedDashboardChanges",
    description: "Enable AI powered features for dashboards to auto-summary changes when saving",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "reportingCsvEncodingOptions",
    description: "Enables CSV encoding options in the reporting feature",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "reportingHeaderSettings",
    description: "Enables configuration of PDF report settings",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "reportingFooterSettings",
    description: "Enables the configurable footer settings for PDF reports",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "sseGroupByDatasource",
    description: "Send query to the same datasource in a single request when using server side expressions. The `cloudWatchBatchQueries` feature toggle should be enabled if this used with CloudWatch.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "sseExpressionErrorIsolation",
    description: "Isolate expression build errors to the broken expression's refID instead of failing the entire pipeline",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiRunQueriesInParallel",
    description: "Enables running Loki queries in parallel",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "externalServiceAccounts",
    description: "Automatic service account and token setup for plugins",
    stage: "preview",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesSnapshots",
    description: "Routes snapshot requests from /api to the /apis endpoint",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesLibraryPanels",
    description: "Routes library panel requests from /api to the /apis endpoint",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesShortURLs",
    description: "Enables k8s short url api and uses it under the hood when handling legacy /api",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "useKubernetesShortURLsAPI",
    description: "Routes short url requests from /api to the /apis endpoint in the frontend. Depends on kubernetesShortURLs",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesCorrelations",
    description: "Adds support for Kubernetes correlations",
    stage: "experimental",
    owner: "@grafana/datapro",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesUnifiedStorageQuotas",
    description: "Adds support for Kubernetes unified storage quotas",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesLogsDrilldown",
    description: "Adds support for Kubernetes logs drilldown",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesQueryCaching",
    description: "Adds support for Kubernetes querycaching",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardDisableSchemaValidationV1",
    description: "Disable schema validation for dashboards/v1",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardDisableSchemaValidationV2",
    description: "Disable schema validation for dashboards/v2",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardSchemaValidationLogging",
    description: "Log schema validation errors so they can be analyzed later",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "scanRowInvalidDashboardParseFallbackEnabled",
    description: "Enable fallback parsing behavior when scan row encounters invalid dashboard JSON",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourceQueryTypes",
    description: "Show query type endpoints in datasource API servers (currently hardcoded for testdata, expressions, and prometheus)",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourceLegacyIdApi",
    description: "Register legacy datasource apis that use the numeric id",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryService",
    description: "Register /apis/query.grafana.app/ -- will eventually replace /api/ds/query",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryServiceWithConnections",
    description: "Adds datasource connections to the query service",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "useNewAPIsForDatasourceCRUD",
    description: "Use the new datasource API groups for datasource CRUD requests",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryServiceRewrite",
    description: "Rewrite requests targeting /ds/query to the query service",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryServiceFromUI",
    description: "Routes requests to the new query service",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourcesRerouteLegacyCRUDAPIs",
    description: "Handle datasource CRUD requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourcesApiServerEnableResourceEndpoint",
    description: "Handle datasource resource requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourcesApiserverEnableResourceEndpointRedirect",
    description: "redirect datasource resource requests from the legacy API routes to the new datasource api group endpoints.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourcesQuerierRawOutput",
    description: "use raw output mode for the data source querier",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cloudWatchBatchQueries",
    description: "Runs CloudWatch metrics queries as separate batches",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cachingOptimizeSerializationMemoryUsage",
    description: "If enabled, the caching backend gradually serializes query responses for the cache, comparing against the configured `[caching]max_value_mb` value as it goes. This can can help prevent Grafana from running out of memory while attempting to cache very large query responses.",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertmanagerRemoteSecondary",
    description: "Enable Grafana to sync configuration and state with a remote Alertmanager.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingProvenanceLockWrites",
    description: "Enables a feature to avoid issues with concurrent writes to the alerting provenance table in MySQL",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingUIUseBackendFilters",
    description: "Enables the UI to use certain backend-side filters",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingUIUseFullyCompatBackendFilters",
    description: "Enables the UI to use rules backend-side filters 100% compatible with the frontend filters",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "createAlertRuleFromPanel",
    description: "Enables creating alert rules from a panel using a drawer UI",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertmanagerRemotePrimary",
    description: "Enable Grafana to have a remote Alertmanager instance as the primary Alertmanager.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "annotationPermissionUpdate",
    description: "Change the way annotation permissions work by scoping them to folders and dashboards.",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "annotationsClustering",
    description: "Enables annotation clustering and switches to refactored annotation code",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardNewLayouts",
    description: "Enables new dashboard layouts",
    stage: "GA",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardDefaultLayoutSelector",
    description: "Enables default layout selector in dashboard settings",
    stage: "GA",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardAssistantPopover",
    description: "Enables the assistant prompt popover on panel click in dashboard view mode",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardUndoRedo",
    description: "Enables undo/redo in dynamic dashboards",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "unlimitedLayoutsNesting",
    description: "Enables unlimited dashboard panel grouping",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "sceneCsvExport",
    description: "Enables CSV export using scenes dashboard architecture",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "drilldownRecommendations",
    description: "Enables showing recently used drilldowns or recommendations given by the datasource in the AdHocFilters and GroupBy variables",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "perPanelNonApplicableDrilldowns",
    description: "Enables viewing non-applicable drilldowns on a panel level",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "panelGroupBy",
    description: "Enables a group by action per panel",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "perPanelFiltering",
    description: "Enables filtering by grouping labels on the panel level through legend or tooltip",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardFiltersOverview",
    description: "Enables the dashboard filters overview pane",
    stage: "preview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "feedbackButton",
    description: "Enables the feedback button in the dashboard edit sidebar",
    stage: "preview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "panelFilterVariable",
    description: "Enables use of the `systemPanelFilterVar` variable to filter panels in a dashboard",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "pdfTables",
    description: "Enables generating table data as PDF in reporting",
    stage: "preview",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "reportingV2Layouts",
    description: "Enable v2 dashboard layout support in reports (auto-grid, tabs, rows)",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "reportRenderBinding",
    description: "Enables render binding support for report rendering",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "canvasPanelPanZoom",
    description: "Allow pan and zoom in canvas panel",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "timeComparison",
    description: "Enables time comparison option in supported panels",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "tableSharedCrosshair",
    description: "Enables shared crosshair in table panel",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cloudRBACRoles",
    description: "Enabled grafana cloud specific RBAC roles",
    stage: "preview",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingQueryOptimization",
    description: "Optimizes eligible queries in order to reduce load on datasources",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "jitterAlertRulesWithinGroups",
    description: "Distributes alert rule evaluations more evenly over time, including spreading out rules within the same group. Disables sequential evaluation if enabled.",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "auditLoggingAppPlatform",
    description: "Enable audit logging with Kubernetes under app platform",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "secretsManagementAppPlatformUI",
    description: "Enable the secrets management app platform UI",
    stage: "preview",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "secretsKeeperUI",
    description: "Enable the Secrets Keeper management UI for configuring external secret storage",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingSaveStatePeriodic",
    description: "Writes the state periodically to the database, asynchronous to rule evaluation",
    stage: "privatePreview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingSaveStateCompressed",
    description: "Enables the compressed protobuf-based alert state storage. Default is enabled.",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "scopeApi",
    description: "In-development feature flag for the scope api using the app platform.",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "useScopeSingleNodeEndpoint",
    description: "Use the single node endpoint for the scope api. This is used to fetch the scope parent node.",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "useMultipleScopeNodesEndpoint",
    description: "Makes the frontend use the 'names' param for fetching multiple scope nodes at once",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "logQLScope",
    description: "In-development feature that will allow injection of labels into loki queries.",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "sqlExpressions",
    description: "Enables SQL Expressions, which can execute SQL queries against data source results.",
    stage: "preview",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "sqlExpressionsColumnAutoComplete",
    description: "Enables column autocomplete for SQL Expressions",
    stage: "experimental",
    owner: "@grafana/datapro",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesAggregator",
    description: "Enable grafana's embedded kube-aggregator",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesAggregatorCapTokenAuth",
    description: "Enable CAP token based authentication in grafana's embedded kube-aggregator",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "groupByVariable",
    description: "Enable groupBy variable support in scenes dashboards",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "scopeFilters",
    description: "Enables the use of scope filters in Grafana",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "oauthRequireSubClaim",
    description: "Require that sub claims is present in oauth tokens.",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "refreshTokenRequired",
    description: "Require that refresh tokens are present in oauth tokens.",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "newDashboardWithFiltersAndGroupBy",
    description: "Enables filters and group by variables on all new dashboards. Variables are added only if default data source supports filtering.",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "dashboardAdHocAndGroupByWrapper",
    description: "Wraps the ad hoc and group by variables in a single wrapper, with all other variables below it",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "dashboardUnifiedDrilldownControls",
    description: "Renders ad hoc filters and group by in a single unified control",
    stage: "privatePreview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "adHocFilterDefaultValues",
    description: "Enables configuring default origin filters for ad-hoc filter variables",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "cloudWatchNewLabelParsing",
    description: "Updates CloudWatch label parsing to be more accurate",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "disableNumericMetricsSortingInExpressions",
    description: "In server-side expressions, disable the sorting of numeric-kind metrics by their metric name or labels.",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaManagedRecordingRules",
    description: "Enables Grafana-managed recording rules.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "queryLibrary",
    description: "Enables Saved queries (query library) feature",
    stage: "preview",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "playlistsRBAC",
    description: "Enables RBAC for playlists",
    stage: "GA",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "savedQueriesRBAC",
    description: "Enables Saved queries (query library) RBAC permissions",
    stage: "preview",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newSavedQueriesExperience",
    description: "Enables the new Saved queries (query library) modal experience",
    stage: "preview",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newUnconfiguredPanel",
    description: "Enables the new unconfigured panel experience",
    stage: "GA",
    owner: "@grafana/sharing-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardLibrary",
    description: "Displays datasource provisioned dashboards in dashboard empty page, only when coming from datasource configuration page",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "suggestedDashboards",
    description: "Displays datasource provisioned and community dashboards in dashboard empty page, only when coming from datasource configuration page",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardValidatorApp",
    description: "Enables dashboard validator app to run compatibility checks between a dashboard and data source",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardTemplates",
    description: "Enables a flow to get started with a new dashboard from a template",
    stage: "preview",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardTemplatesAssistantButton",
    description: "Enables the Assistant button in the dashboard templates card",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "suggestedDashboardsAssistantButton",
    description: "Enables the 'Customize with Assistant' button on suggested dashboard cards",
    stage: "experimental",
    owner: "@grafana/sharing-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingListViewV2",
    description: "Enables the new alert list view design",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingAlertListPanelEnhancements",
    description: "Enables enhanced stat mode for the Alert List panel with thresholds, value mappings, and linking",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingNavigationV2",
    description: "Enables the new Alerting navigation structure with improved menu grouping",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingDisableSendAlertsExternal",
    description: "Disables the ability to send alerts to an external Alertmanager datasource.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingSyncNotifiersApiMigration",
    description: "Use the new k8s API for fetching integration type schemas",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "preserveDashboardStateWhenNavigating",
    description: "Enables possibility to preserve dashboard variables and time range when navigating between dashboards",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingCentralAlertHistory",
    description: "Enables the new central alert history.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pluginProxyPreserveTrailingSlash",
    description: "Preserve plugin proxy trailing slash.",
    stage: "GA",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "azureMonitorPrometheusExemplars",
    description: "Allows configuration of Azure Monitor as a data source that can provide Prometheus exemplars",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "authZGRPCServer",
    description: "Enables the gRPC server for authorization",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "zanzana",
    description: "Use openFGA as authorization engine.",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "zanzanaNoLegacyClient",
    description: "Use openFGA as main authorization engine and disable legacy RBAC clietn.",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "reloadDashboardsOnParamsChange",
    description: "Enables reload of dashboards on scopes, time range and variables changes",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "enableScopesInMetricsExplore",
    description: "Enables the scopes usage in Metrics Explore",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "cloudWatchRoundUpEndTime",
    description: "Round up end time for metric queries to the next minute to avoid missing data",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "prometheusAzureOverrideAudience",
    description: "Deprecated. Allow override default AAD audience for Azure Prometheus endpoint. Enabled by default. This feature should no longer be used and will be removed in the future.",
    stage: "deprecated",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dataplaneAggregator",
    description: "Enable grafana dataplane aggregator",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "vizActionsAuth",
    description: "Allows authenticated API calls in actions",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingPrometheusRulesPrimary",
    description: "Uses Prometheus rules as the primary source of truth for ruler-enabled data sources",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "exploreLogsShardSplitting",
    description: "Deprecated. Replace with lokiShardSplitting. Used in Logs Drilldown to split queries into multiple queries based on the number of shards",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "exploreLogsAggregatedMetrics",
    description: "Used in Logs Drilldown to query by aggregated metrics",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "appPlatformGrpcClientAuth",
    description: "Enables the gRPC client to authenticate with the App Platform by using ID \u0026 access tokens",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "groupAttributeSync",
    description: "Enable the groupsync extension for managing Group Attribute Sync feature",
    stage: "privatePreview",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "groupToNestedTableV2",
    description: "Enable the new matcher-based UI and config shape for the Group to Nested Tables transformation",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingQueryAndExpressionsStepMode",
    description: "Enables step mode for alerting queries and expressions",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "improvedExternalSessionHandling",
    description: "Enables improved support for OAuth external sessions. After enabling this feature, users might need to re-authenticate themselves.",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "useSessionStorageForRedirection",
    description: "Use session storage for handling the redirection after login",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "rolePickerDrawer",
    description: "Enables the new role picker drawer design",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "managedDualWriter",
    description: "Pick the dual write mode from database configs",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "pluginsSriChecks",
    description: "Enables SRI checks for plugin assets",
    stage: "GA",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "unifiedStorageBigObjectsSupport",
    description: "Enables to save big objects in blob storage",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "timeRangeProvider",
    description: "Enables time pickers sync",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "timeRangePan",
    description: "Enables time range panning functionality",
    stage: "GA",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newTimeRangeZoomShortcuts",
    description: "Enables new keyboard shortcuts for time range zoom operations",
    stage: "GA",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "azureMonitorDisableLogLimit",
    description: "Disables the log limit restriction for Azure Monitor when true. The limit is enabled by default.",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "playlistsReconciler",
    description: "Enables experimental reconciler for playlists",
    stage: "experimental",
    owner: "@grafana/grafana-app-platform-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "prometheusSpecialCharsInLabelValues",
    description: "Adds support for quotes and special characters in label values for Prometheus queries",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "enableExtensionsAdminPage",
    description: "Enables the extension admin page regardless of development mode",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "enableSCIM",
    description: "Enables SCIM support for user and group management",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "crashDetection",
    description: "Enables browser crash detection reporting to Faro.",
    stage: "experimental",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingUIOptimizeReducer",
    description: "Enables removing the reducer from the alerting UI when creating a new alert rule and using instant query",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "azureMonitorEnableUserAuth",
    description: "Enables user auth for Azure Monitor datasource only",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingAIGenAlertRules",
    description: "Enable AI-generated alert rules.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingAIFeedback",
    description: "Enable AI-generated feedback from the Grafana UI.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingAIImproveAlertRules",
    description: "Enable AI-improve alert rules labels and annotations.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingAIGenTemplates",
    description: "Enable AI-generated alerting templates.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingEnrichmentPerRule",
    description: "Enable enrichment per rule in the alerting UI.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingEnrichmentAssistantInvestigations",
    description: "Enable Assistant Investigations enrichment type.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingAIAnalyzeCentralStateHistory",
    description: "Enable AI-analyze central state history.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingNotificationsStepMode",
    description: "Enables simplified step mode in the notifications section",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "unifiedStorageSearchUI",
    description: "Enable unified storage search UI",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "elasticsearchCrossClusterSearch",
    description: "Enables cross cluster search in the Elasticsearch data source",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiLabelNamesQueryApi",
    description: "Defaults to using the Loki `/labels` API instead of `/series`",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "improvedExternalSessionHandlingSAML",
    description: "Enables improved support for SAML external sessions. Ensure the NameID format is correctly configured in Grafana for SAML Single Logout to function properly.",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "teamHttpHeadersTempo",
    description: "Enables LBAC for datasources for Tempo to apply LBAC filtering of traces to the client requests for users in teams",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "teamHttpHeadersFromAppPlatform",
    description: "Use the Kubernetes TeamLBACRule API for team HTTP headers on datasource query requests",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "teamLBACApiReadFromAppPlatform",
    description: "Use the Kubernetes TeamLBACRule API for reading team LBAC rules in the legacy API server",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaAdvisor",
    description: "Enables Advisor app",
    stage: "GA",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "elasticsearchImprovedParsing",
    description: "Enables less memory intensive Elasticsearch result parsing",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "datasourceConnectionsTab",
    description: "Shows defined connections for a data source in the plugins detail page",
    stage: "privatePreview",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "fetchRulesUsingPost",
    description: "Use a POST request to list rules by passing down the namespaces user has access to",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "fetchRulesInCompactMode",
    description: "Add compact=true when fetching rules",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "newLogsPanel",
    description: "Enables the new logs panel",
    stage: "GA",
    owner: "@grafana/observability-logs",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaconThemes",
    description: "Enables the temporary themes for GrafanaCon",
    stage: "GA",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingJiraIntegration",
    description: "Enables the new Jira integration for contact points in cloud alert managers.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingUseNewSimplifiedRoutingHashAlgorithm",
    description: "",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "useScopesNavigationEndpoint",
    description: "Use the scopes navigation endpoint instead of the dashboardbindings endpoint",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "scopeSearchAllLevels",
    description: "Enable scope search to include all levels of the scope node tree",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingRuleVersionHistoryRestore",
    description: "Enables the alert rule version history restore feature",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "newShareReportDrawer",
    description: "Enables the report creation drawer in a dashboard",
    stage: "preview",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "rendererDisableAppPluginsPreload",
    description: "Disable pre-loading app plugins when the request is coming from the renderer",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "assetSriChecks",
    description: "Enables SRI checks for Grafana JavaScript assets",
    stage: "experimental",
    owner: "@grafana/frontend-ops",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertRuleRestore",
    description: "Enables the alert rule restore feature",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "infinityRunQueriesInParallel",
    description: "Enables running Infinity queries in parallel",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingMigrationUI",
    description: "Enables the alerting migration UI, to migrate data source-managed rules to Grafana-managed rules",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingImportYAMLUI",
    description: "Enables a UI feature for importing rules from a Prometheus file to Grafana-managed rules",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingMigrationWizardUI",
    description: "Enables the migration wizard UI to migrate alert rules and notification resources from external sources to Grafana Alerting",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "azureMonitorLogsBuilderEditor",
    description: "Enables the logs builder mode for the Azure Monitor data source",
    stage: "preview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "localeFormatPreference",
    description: "Specifies the locale so the correct format for numbers and dates can be shown",
    stage: "deprecated",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "unifiedStorageGrpcConnectionPool",
    description: "Enables the unified storage grpc connection pool",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingRulePermanentlyDelete",
    description: "Enables UI functionality to permanently delete alert rules",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingRuleRecoverDeleted",
    description: "Enables the UI functionality to recover and view deleted alert rules",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "multiTenantTempCredentials",
    description: "use multi-tenant path for awsTempCredentials",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "unifiedNavbars",
    description: "Enables unified navbars",
    stage: "GA",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "logsPanelControls",
    description: "Enables a control component for the logs panel in Explore",
    stage: "preview",
    owner: "@grafana/observability-logs",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "metricsFromProfiles",
    description: "Enables creating metrics from profiles and storing them as recording rules",
    stage: "experimental",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "grafanaAssistantInProfilesDrilldown",
    description: "Enables integration with Grafana Assistant in Profiles Drilldown",
    stage: "GA",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "tempoAlerting",
    description: "Enables creating alerts from Tempo data source",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pluginsAutoUpdate",
    description: "Enables auto-updating of users installed plugins",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingListViewV2PreviewToggle",
    description: "Enables the alerting list view v2 preview toggle",
    stage: "preview",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertRuleUseFiredAtForStartsAt",
    description: "Use FiredAt for StartsAt when sending alerts to Alertmaanger",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingBulkActionsInUI",
    description: "Enables the alerting bulk actions in the UI",
    stage: "GA",
    owner: "@grafana/alerting-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthZResourcePermissionsRedirect",
    description: "Redirects the traffic from the legacy resource permissions endpoints to the new K8s AuthZ endpoints",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzResourcePermissionApis",
    description: "Registers AuthZ resource permission /apis endpoints",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzZanzanaSync",
    description: "Enable sync of Zanzana authorization store on AuthZ CRD mutations",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzGlobalRolesApi",
    description: "Registers AuthZ Global Roles /apis endpoint",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzRolesApi",
    description: "Registers AuthZ Roles /apis endpoint",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzTeamLBACRuleApi",
    description: "Registers AuthZ TeamLBACRule /apis endpoint",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzRoleBindingsApi",
    description: "Registers AuthZ Role Bindings /apis endpoint",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzRolesAndRoleBindingsRedirect",
    description: "Redirects the traffic from the legacy roles and role bindings endpoints to the new K8s AuthZ endpoints",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesAuthzDatasourceResourcePermissions",
    description: "Enables datasource resource permissions via the K8s IAM resource permission APIs",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "restoreDashboards",
    description: "Enables restore deleted dashboards feature",
    stage: "GA",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "recentlyViewedDashboards",
    description: "Enables recently viewed dashboards section in the browsing dashboard page",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "experimentRecentlyViewedDashboards",
    description: "A/A test for recently viewed dashboards feature",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "createdByMeSearchFilter",
    description: "Enables the created by me search filter on the browse dashboards page",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertEnrichment",
    description: "Enable configuration of alert enrichments in Grafana Cloud.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertEnrichmentMultiStep",
    description: "Allow multiple steps per enrichment.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertEnrichmentConditional",
    description: "Enable conditional alert enrichment steps.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertEnrichmentPreview",
    description: "Enable alert enrichment preview (notification-history-based) in view and edit drawers.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingImportAlertmanagerAPI",
    description: "Enables the API to import Alertmanager configuration",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingDisableDMAinUI",
    description: "Disables the DMA feature in the UI",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "sharingDashboardImage",
    description: "Enables image sharing functionality for dashboards",
    stage: "GA",
    owner: "@grafana/sharing-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "preferLibraryPanelTitle",
    description: "Prefer library panel title over viz panel title.",
    stage: "privatePreview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newInfluxDSConfigPageDesign",
    description: "Enables new design for the InfluxDB data source configuration page",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "enableAppChromeExtensions",
    description: "Set this to true to enable all app chrome extensions registered by plugins.",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "enableDashboardEmptyExtensions",
    description: "Set this to true to enable all dashboard empty state extensions registered by plugins.",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "foldersAppPlatformAPI",
    description: "Enables use of app platform API for folders",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "otelLogsFormatting",
    description: "Applies OTel formatting templates to displayed logs",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingNotificationHistory",
    description: "Enables the notification history feature",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "unifiedStorageSearchDualReaderEnabled",
    description: "Enable dual reader for unified storage search",
    stage: "experimental",
    owner: "@grafana/search-and-storage",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "dashboardLevelTimeMacros",
    description: "Supports __from and __to macros that always use the dashboard level time range",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertmanagerRemoteSecondaryWithRemoteState",
    description: "Starts Grafana in remote secondary mode pulling the latest state from the remote Alertmanager to avoid duplicate notifications.",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "restrictedPluginApis",
    description: "Enables sharing a list of APIs with a list of plugins",
    stage: "GA",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "favoriteDatasources",
    description: "Enable favorite datasources",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newLogContext",
    description: "New Log Context component",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newClickhouseConfigPageDesign",
    description: "Enables new design for the Clickhouse data source configuration page",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "teamFolders",
    description: "Enables team folders functionality",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-navigation",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "interactiveLearning",
    description: "Enables the interactive learning app",
    stage: "preview",
    owner: "@grafana/pathfinder",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingTriage",
    description: "Enables the alerting triage feature",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingAlertsActivityBanner",
    description: "Shows a promotional banner for the Alerts Activity feature on the Rule List page",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "graphiteBackendMode",
    description: "Enables the Graphite data source full backend mode",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "azureResourcePickerUpdates",
    description: "Enables the updated Azure Monitor resource picker",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "prometheusTypeMigration",
    description: "Checks for deprecated Prometheus authentication methods (SigV4 and Azure), installs the relevant data source, and migrates the Prometheus data sources",
    stage: "deprecated",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pluginContainers",
    description: "Enables running plugins in containers",
    stage: "privatePreview",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cdnPluginsLoadFirst",
    description: "Prioritize loading plugins from the CDN before other sources",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cdnPluginsUrls",
    description: "Enable loading plugins via declarative URLs",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pluginInstallAPISync",
    description: "Enable syncing plugin installations to the installs API",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newVizSuggestions",
    description: "Enable new visualization suggestions",
    stage: "GA",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "panelStyleActions",
    description: "Enable style actions (copy/paste) in the panel editor",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "vizPresets",
    description: "Enable visualization presets",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "externalVizSuggestions",
    description: "Enable all plugins to supply visualization suggestions (including 3rd party plugins)",
    stage: "GA",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "nestedFramesFieldOverrides",
    description: "Enable field overrides for FieldType.nestedFrames fields (like in nested tables)",
    stage: "preview",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "vizLegendFacetedFilter",
    description: "Enable faceted labels filter for series visibility in the legend",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "heatmapRowsAxisOptions",
    description: "Enable Y-axis scale configuration options for pre-bucketed heatmap data (heatmap-rows)",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pieChartGradientColorScheme",
    description: "Enable gradient color scheme option for the pie chart panel",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "preventPanelChromeOverflow",
    description: "Restrict PanelChrome contents with overflow: hidden;",
    stage: "preview",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "jaegerEnableGrpcEndpoint",
    description: "Enable querying trace data through Jaeger's gRPC endpoint (HTTP)",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "pluginStoreServiceLoading",
    description: "Load plugins on store service startup instead of wire provider, and call RegisterFixedRoles after all plugins are loaded",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "newPanelPadding",
    description: "Increases panel padding globally",
    stage: "preview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "onlyStoreActionSets",
    description: "When storing dashboard and folder resource permissions, only store action sets and not the full list of underlying permission",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "excludeRedundantManagedPermissions",
    description: "Exclude redundant individual dashboard/folder permissions from managed roles at query time",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "pluginInsights",
    description: "Show insights for plugins in the plugin details page",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "panelTimeSettings",
    description: "Enables a new panel time settings drawer",
    stage: "preview",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "elasticsearchRawDSLQuery",
    description: "Enables the raw DSL query editor in the Elasticsearch data source",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "elasticsearchESQLQuery",
    description: "Enables the ES|QL query editor in the Elasticsearch data source",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "awsDatasourcesHttpProxy",
    description: "Enables http proxy settings for aws datasources",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "transformationsEmptyPlaceholder",
    description: "Show transformation quick-start cards in empty transformations state",
    stage: "preview",
    owner: "@grafana/datapro",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "opentsdbBackendMigration",
    description: "Run queries through the data source backend",
    stage: "GA",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "ttlPluginInstanceManager",
    description: "Enable TTL plugin instance manager",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "lokiQueryLimitsContext",
    description: "Send X-Loki-Query-Limits-Context header to Loki on first split request",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "rudderstackUpgrade",
    description: "Enables the new version of rudderstack",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesAlertingHistorian",
    description: "Adds support for Kubernetes alerting historian APIs",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "useMTPlugins",
    description: "Enables plugins decoupling from bootdata",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "multiPropsVariables",
    description: "Enables support for variables whose values can have multiple properties",
    stage: "GA",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "dashboardSectionVariables",
    description: "Enables support for section level variables (rows and tabs)",
    stage: "experimental",
    owner: "@grafana/dashboards-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "smoothingTransformation",
    description: "Enables the ASAP smoothing transformation for time series data",
    stage: "experimental",
    owner: "@grafana/datapro",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "secretsManagementAppPlatformAwsKeeper",
    description: "Enables the creation of keepers that manage secrets stored on AWS secrets manager",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "profilesExemplars",
    description: "Enables profiles exemplars support in profiles drilldown",
    stage: "experimental",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingSyncDispatchTimer",
    description: "Use synchronized dispatch timer to minimize duplicate notifications across alertmanager HA pods",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "queryWithAssistant",
    description: "Enables the Query with Assistant button in the query editor",
    stage: "experimental",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryEditorNext",
    description: "Enables next generation query editor experience",
    stage: "privatePreview",
    owner: "@grafana/datapro",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "kubernetesTeamBindings",
    description: "Enables search for team bindings in the app platform API",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesTeamsApi",
    description: "Enables team APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesTeamsRedirect",
    description: "Redirects the request of the team endpoints to the app platform APIs",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesUsersApi",
    description: "Enables user APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesServiceAccountsApi",
    description: "Enables service account APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesServiceAccountTokensApi",
    description: "Enables service account token APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesSsoSettingsApi",
    description: "Enables SSO settings APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesExternalGroupMappingsApi",
    description: "Enables external group mapping APIs in the app platform",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesExternalGroupMappingsRedirect",
    description: "Redirects the request of the external group mapping endpoints to the app platform APIs",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesTeamSync",
    description: "Use the new APIs for syncing users to teams",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "kubernetesUsersRedirect",
    description: "Redirects the requests of the user service to the app platform APIs",
    stage: "experimental",
    owner: "@grafana/identity-access-team",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingMultiplePolicies",
    description: "Enables the ability to create multiple alerting policies",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingPolicyRoutingSettings",
    description: "Use notification settings policy field instead of labels for named policy routing in alert rules",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "appPluginAPIServer",
    description: "Registers an API server for each backend app plugin exposing a settings endpoint",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "alertingIgnorePendingForNoDataAndError",
    description: "Makes NoData and Error alerts fire immediately, without 'pending' stage",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingNotificationHistoryRuleViewer",
    description: "Enables the notification history tab in the rule viewer",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingNotificationHistoryGlobal",
    description: "Enables the notification history global menu item viewer",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingNotificationHistoryTriage",
    description: "Enables the notification history timeline in the triage instance details drawer",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "alertingNotificationHistoryDetail",
    description: "Enables the notification history detail page",
    stage: "experimental",
    owner: "@grafana/alerting-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "react19",
    description: "Whether to use the new React 19 runtime",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "frontendServiceUseSettingsService",
    description: "Enables the frontend service to fetch tenant-specific settings overrides from the settings service",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "functionalSharedPreferences",
    description: "Whether to use the new SharedPreferences functional component",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "managedPluginsV2",
    description: "Enables managed plugins v2 (expanded rollout, community plugin coverage)",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "rememberUserOrgForSso",
    description: "Remember the last viewed organization for users using SSO",
    stage: "GA",
    owner: "@grafana/identity-access-team",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "dsAbstractionApp",
    description: "Registers the dsabstraction app for querying datasources via unified SQL",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "datasourcesApiServerEnableHealthEndpoint",
    description: "Handle datasource health requests to the legacy API routes by querying the new datasource api group endpoints behind the scenes.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "analyticsFramework",
    description: "Enables new analytics framework",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "datasourcesApiServerEnableHealthEndpointFrontend",
    description: "Send Datsource health requests to /apis/ API routes instead of the legacy /api/datasources/uid/{uid}/health route.",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "flameGraphWithCallTree",
    description: "Enables the new Flame Graph UI containing the Call Tree view",
    stage: "experimental",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "advisorDatasourceIntegration",
    description: "Enables the advisor report integration with datasource pages",
    stage: "experimental",
    owner: "@grafana/plugins-platform-backend",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "inlineLogDetailsNoScrolls",
    description: "Enables an inline version of Log Details that creates no new scrolls",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "colorblindThemes",
    description: "Enables the new colorblind-friendly themes",
    stage: "GA",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "yAxisTickControl",
    description: "Enables fine-grained Y-axis tick options beyond the auto-ticks",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "logsTablePanelNG",
    description: "Enables the logs tableNG panel to replace existing tableRT",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "useMTPluginSettings",
    description: "Enables plugins setting from new apis",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "frontendServiceSSOAutoLogin",
    description: "Returns SSO auto-login information in /bootdata to automatically log in users with SSO when they access Grafana",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "splashScreen",
    description: "Enables the splash screen modal for introducing new Grafana features on first session",
    stage: "preview",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "true",
    defaultValue: true,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "streamingForwardTeamHeadersTempo",
    description: "Enables forwarding team headers from tempo for streaming requests with LBAC rules",
    stage: "privatePreview",
    owner: "@grafana/data-sources-plugins",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "lokiAlignedQuerySplitting",
    description: "Aligns query splitting chunks with UTC midnight",
    stage: "experimental",
    owner: "@grafana/observability-logs",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryFetchConfigFromSettingsService",
    description: "Enables the query service to fetch the configuration from the settings service",
    stage: "experimental",
    owner: "@grafana/grafana-datasources-core-services",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "queryServiceQueryCaching",
    description: "Enables the query service to do query caching",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "tracesDrilldownTimeSeeker",
    description: "Enables the time seeker in traces drilldown",
    stage: "experimental",
    owner: "@grafana/observability-traces-and-profiling",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "clearPreviousFieldValues",
    description: "Mitigates React fiber's retention of previous props/state, causing 2x memory use: https://github.com/facebook/react/issues/36176",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
  {
    name: "enableDatasourceMetaApiPluginLoading",
    description: "Enables loading datasource plugins from the MetaAPI instead of bootData settings",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "enableColorblindSafePanelOptions",
    description: "Enables new colorblind safe palette and line fill patterns for panels",
    stage: "experimental",
    owner: "@grafana/dataviz-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "cacheConfigUnifiedStorageMigration",
    description: "Enables cache configs data migration to unified storage",
    stage: "experimental",
    owner: "@grafana/grafana-operator-experience-squad",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
    hideFromDocs: false,
  },
  {
    name: "compiledBootScript",
    description: "Boots the frontend using the boot.js script built from TS instead of the embedded boot script",
    stage: "experimental",
    owner: "@grafana/grafana-frontend-platform",
    defaultExpression: "false",
    defaultValue: false,
    frontendOnly: false,
    requiresRestart: false,
    requiresDevMode: false,
    hideFromDocs: true,
  },
];
