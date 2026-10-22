# Grafana Alerting Module Architecture

## Overview

Grafana's unified alerting system spans three layers:

| Layer | Location | Role |
|-------|----------|------|
| K8s API surface | `apps/alerting/{rules,notifications,historian}/` | Declarative CRUD via App SDK |
| Registry bridge | `pkg/registry/apps/alerting/` | Wire DI, authz, legacy SQL adapters |
| Runtime engine | `pkg/services/ngalert/` | Evaluation, scheduling, state, Alertmanager, HTTP API |

The frontend lives in `public/app/features/alerting/unified/` and uses RTK Query against the backend HTTP API.

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph frontend["Frontend (public/app/features/alerting/unified/)"]
        Pages["Page Components<br/>(Home, RuleList, RuleEditor, ContactPoints)"]
        RTKQ["alertingApi (RTK Query)"]
        BackendSrv["Grafana backendSrv"]
        Pages --> RTKQ --> BackendSrv
    end

    subgraph api_layer["API Layer"]
        LegacyHTTP["Legacy HTTP API<br/>(pkg/services/ngalert/api/)"]
        K8sAPI["K8s-style API<br/>(apps/alerting/*)"]
        Bridge["Legacy Storage Bridge<br/>(pkg/registry/apps/alerting/)"]
        K8sAPI --> Bridge --> LegacyHTTP
    end

    subgraph runtime["Runtime Engine (pkg/services/ngalert/)"]
        Scheduler["Scheduler"]
        EvalEngine["Eval Engine (SSE)"]
        StateMgr["State Manager"]
        MOA["MultiOrg Alertmanager"]
        Router["AlertsRouter"]
        DBStore["DBstore (SQL)"]
    end

    BackendSrv --> LegacyHTTP
    BackendSrv --> K8sAPI
    LegacyHTTP --> DBStore
    Scheduler --> EvalEngine --> StateMgr --> Router --> MOA
    Scheduler --> DBStore
    StateMgr --> DBStore
```

---

## Backend Package Structure

```mermaid
graph LR
    subgraph ngalert["pkg/services/ngalert/"]
        root["ngalert.go (AlertNG)"]
        api["api/"]
        schedule["schedule/"]
        eval["eval/"]
        state["state/"]
        notifier["notifier/"]
        sender["sender/"]
        store["store/"]
        models["models/"]
        provisioning["provisioning/"]
        accesscontrol["accesscontrol/"]
        image["image/"]
        remote["remote/"]
    end

    root --> api
    root --> schedule
    root --> state
    root --> notifier
    root --> sender
    root --> store

    api --> provisioning
    api --> accesscontrol
    schedule --> eval
    schedule --> state
    state --> store
    state --> image
    notifier --> store
    sender --> notifier
```

---

## Service Initialization (Wire DI)

```mermaid
sequenceDiagram
    participant Wire as wire.go
    participant NGAlert as AlertNG
    participant Init as init()
    participant Run as Run()

    Wire->>NGAlert: ProvideService(~30 deps)
    NGAlert->>Init: init()
    Init->>Init: Build MultiOrgAlertmanager
    Init->>Init: Build eval.EvaluatorFactory
    Init->>Init: Build state.Manager
    Init->>Init: Build schedule.SchedulerCfg
    Init->>Init: Build provisioning services
    Init->>Init: api.API.RegisterAPIEndpoints()

    Note over Run: Called as background service
    Run->>Run: MultiOrgAlertmanager.Run()
    Run->>Run: AlertsRouter.Run()
    Run->>Run: evaluationRunner.run()
```

---

## HTTP Request Flow

### API Endpoint Groups

| Group | Prefix | Purpose |
|-------|--------|---------|
| Alertmanager | `/api/alertmanager/grafana/...` | Config, silences, receivers |
| Ruler | `/api/ruler/grafana/api/v1/rules/...` | Rule CRUD |
| Prometheus | `/api/prometheus/grafana/api/v1/rules` | Rule status (compat) |
| Provisioning | `/api/v1/provisioning/...` | File/API provisioning |
| Testing | `/api/ruler/grafana/api/v1/rules/test` | Rule/contact point testing |
| History | `/api/v1/state/history` | State history queries |
| Convert | `/api/convert/prometheus/...` | Prometheus rule import |
| Admin | `/api/admin/alerting/...` | External AM config |

### Forking Pattern (Grafana vs External Datasource)

```mermaid
flowchart TD
    Request["HTTP Request"] --> RouteRegister
    RouteRegister --> Auth["authorize()"]
    Auth --> Metrics["Instrument()"]
    Metrics --> Forking{"Forking Handler"}

    Forking -->|"/grafana/..."| GrafanaImpl["Grafana Implementation<br/>(AlertmanagerSrv, RulerSrv, PrometheusSrv)"]
    Forking -->|"/{datasourceUID}/..."| LotexImpl["Lotex Proxy<br/>(LotexAM, LotexRuler, LotexProm)"]

    GrafanaImpl --> DBStore["DBstore"]
    GrafanaImpl --> StateMgr["State Manager"]
    GrafanaImpl --> MOA["MultiOrgAlertmanager"]
    LotexImpl --> ExternalAM["External AM (Mimir/Cortex)"]
```

### Route Registration Middleware Stack

```mermaid
flowchart LR
    A["requestmeta.SetOwner"] --> B["requestmeta.SetSLOGroup"]
    B --> C["api.authorize()"]
    C --> D["metrics.Instrument()"]
    D --> E["api.Hooks.Wrap(handler)"]
```

---

## Rule Evaluation Pipeline

```mermaid
flowchart TD
    subgraph scheduler["Scheduler (schedule/)"]
        Tick["ticker.T (base interval 10s)"]
        ProcessTick["processTick()"]
        FetchRules["Fetch rules from DB"]
        Registry["ruleRegistry (per-rule goroutines)"]
        Jitter["Jitter dispatch"]
    end

    subgraph per_rule["Per-Rule Goroutine"]
        EvalCh["evalCh receives tick"]
        Create["evalFactory.Create(condition)"]
        Execute["ruleEval.Evaluate(now)"]
        Process["stateManager.ProcessEvalResults()"]
        Send["alertRule.send()"]
    end

    subgraph eval_engine["Eval Engine (eval/)"]
        BuildPipeline["expr.Service.BuildPipeline()"]
        ExecutePipeline["expr.Service.ExecutePipeline()"]
        ParseResults["Convert QueryDataResponse to Results"]
    end

    Tick --> ProcessTick
    ProcessTick --> FetchRules
    FetchRules --> Registry
    Registry --> Jitter
    Jitter --> EvalCh

    EvalCh --> Create
    Create --> BuildPipeline
    BuildPipeline --> Execute
    Execute --> ExecutePipeline
    ExecutePipeline --> ParseResults
    ParseResults --> Process
    Process --> Send
```

### Evaluation Result Classification

```mermaid
flowchart LR
    Val{"Condition value"}
    Val -->|"nil"| NoData["NoData"]
    Val -->|"0"| Normal["Normal"]
    Val -->|"non-zero"| Alerting["Alerting"]
```

### State Transitions

```mermaid
stateDiagram-v2
    [*] --> Normal
    Normal --> Pending : condition fires
    Pending --> Alerting : for duration elapsed
    Pending --> Normal : condition clears
    Alerting --> Normal : condition clears
    Alerting --> Recovering : condition clears (keepFiringFor)
    Recovering --> Normal : keepFiringFor elapsed
    Normal --> NoData : no data received
    Normal --> Error : evaluation error
    Alerting --> NoData : no data received
    Alerting --> Error : evaluation error
```

---

## State Management Flow

```mermaid
flowchart TD
    EvalResults["Evaluation Results"] --> SetNext["setNextStateForRule()"]
    SetNext --> MissingSeries["processMissingSeriesStates()"]
    MissingSeries --> Transitions["Compute StateTransitions"]
    Transitions --> UpdateSent["updateLastSentAt()"]
    UpdateSent --> Persist["persister.Sync() (DB)"]
    Persist --> History["historian.Record()"]
    History --> Callback["send callback (alerts)"]

    subgraph persistence["Persistence Strategies"]
        Sync["SyncStatePersister (default)"]
        Async["AsyncStatePersister (periodic)"]
        SyncComp["SyncRuleStatePersister (compressed)"]
        AsyncComp["AsyncRuleStatePersister (compressed+periodic)"]
    end
```

### State Manager Lifecycle

```mermaid
sequenceDiagram
    participant Runner as evaluationRunner
    participant SM as State Manager
    participant DB as InstanceStore (DB)
    participant Sched as Scheduler

    Runner->>SM: Warm() (load all instances from DB)
    Runner->>Sched: Run() (start tick loop)
    Runner->>SM: Run() (start async persister)

    loop Every evaluation
        Sched->>SM: ProcessEvalResults()
        SM->>SM: Compute state transitions
        SM->>DB: Persist instances
        SM->>SM: Record history
        SM-->>Sched: Return transitions for sending
    end
```

---

## Notification Pipeline

```mermaid
flowchart TD
    subgraph send_flow["Alert Sending"]
        AlertRule["alertRule.send()"]
        Router["AlertsRouter.Send()"]
    end

    subgraph routing_decision["Routing Decision"]
        Check{"sendAlertsTo config"}
        Internal["Internal path"]
        External["External path"]
        Both["Both paths"]
    end

    subgraph internal["Internal Alertmanager"]
        MOA["MultiOrgAlertmanager"]
        PerOrg["Per-org Alertmanager instance"]
        PutAlerts["PutAlerts()"]
        Dispatcher["Dispatcher"]
        Routes["Notification Policy Tree"]
        Receivers["Receivers"]
        Integrations["Integrations<br/>(email, Slack, PagerDuty, etc.)"]
    end

    subgraph external["External Alertmanager"]
        Sender["sender.Sender"]
        HTTPSend["HTTP POST to external AM"]
        ExternalAM["Mimir / Cortex AM"]
    end

    AlertRule --> Router
    Router --> Check
    Check -->|InternalAlertmanager| Internal
    Check -->|ExternalAlertmanagers| External
    Check -->|AllAlertmanagers| Both
    Both --> Internal
    Both --> External

    Internal --> MOA --> PerOrg --> PutAlerts --> Dispatcher --> Routes --> Receivers --> Integrations
    External --> Sender --> HTTPSend --> ExternalAM
```

### MultiOrgAlertmanager Structure

```mermaid
flowchart TD
    MOA["MultiOrgAlertmanager"]
    MOA --> Org1["Alertmanager (Org 1)"]
    MOA --> Org2["Alertmanager (Org 2)"]
    MOA --> OrgN["Alertmanager (Org N)"]

    Org1 --> Config1["Config from DB"]
    Org1 --> Silences1["Silences (KV store)"]
    Org1 --> NfLog1["Notification Log (KV store)"]

    subgraph ha["HA Clustering"]
        Redis["Redis / Memberlist"]
        Broadcast["BroadcastAlerts()"]
    end

    MOA -.-> ha
```

---

## K8s App SDK Layer

```mermaid
flowchart TD
    subgraph apps["apps/alerting/"]
        RulesApp["rules app<br/>(AlertRule, RecordingRule, RuleSequence)"]
        NotifApp["notifications app<br/>(Receiver, RoutingTree, TemplateGroup,<br/>TimeInterval, InhibitionRule)"]
        HistApp["historian app<br/>(state history, notification queries)"]
    end

    subgraph registry["pkg/registry/apps/alerting/"]
        RulesReg["rules/register.go"]
        NotifReg["notifications/register.go"]
        HistReg["historian/register.go"]
    end

    subgraph ngalert["pkg/services/ngalert/"]
        RulerAPI["Api.AlertRules"]
        ReceiverSvc["ReceiverService"]
        RoutesSvc["routes.Service"]
        HistSvc["Historian backends"]
    end

    RulesApp --> RulesReg
    NotifApp --> NotifReg
    HistApp --> HistReg

    RulesReg -->|LegacyStorage| RulerAPI
    NotifReg -->|LegacyStorage| ReceiverSvc
    NotifReg -->|LegacyStorage| RoutesSvc
    HistReg -->|Custom routes| HistSvc
```

---

## Frontend Architecture

```mermaid
flowchart TD
    subgraph pages["Pages"]
        Home["Home / Insights"]
        RuleList["RuleList (v1/v2)"]
        RuleEditor["RuleEditor (react-hook-form)"]
        ContactPoints["ContactPoints"]
        NotifPolicies["NotificationPolicies"]
        Silences["Silences"]
        Triage["Triage (feature-flagged)"]
    end

    subgraph data_layer["Data Layer"]
        RTKQ["alertingApi (RTK Query)"]
        GenClients["@grafana/api-clients (generated)"]
        BackendSrv["backendSrvBaseQuery"]
    end

    subgraph state["State"]
        Cache["RTK Query Cache"]
        LegacyRedux["Legacy Redux (deprecated)"]
        AMContext["AlertmanagerContext"]
        SettingsCtx["SettingsContext"]
    end

    subgraph backend_apis["Backend API Endpoints"]
        Ruler["/api/ruler/..."]
        Prom["/api/prometheus/..."]
        AM["/api/alertmanager/..."]
        Provisioning["/api/v1/provisioning/..."]
        History["/api/v1/rules/history"]
    end

    pages --> RTKQ
    pages --> AMContext
    RTKQ --> GenClients
    RTKQ --> BackendSrv
    BackendSrv --> Ruler
    BackendSrv --> Prom
    BackendSrv --> AM
    BackendSrv --> Provisioning
    BackendSrv --> History
    RTKQ --> Cache
```

### Frontend Routing

| Path | Component | Purpose |
|------|-----------|---------|
| `/alerting` | Home | Landing + insights |
| `/alerting/list` | RuleList | Rules (v1 or v2 via feature flag) |
| `/alerting/new/:type?` | RuleEditor | Create rule |
| `/alerting/:id/edit` | RuleEditor | Edit rule |
| `/alerting/notifications` | ContactPoints | Contact points CRUD |
| `/alerting/routes` | NotificationPolicies | Routing tree |
| `/alerting/silences` | Silences | Silence list |
| `/alerting/groups` | AlertGroups | Active alert groups |
| `/alerting/history` | CentralAlertHistoryPage | State history |
| `/alerting/alerts` | Triage | Triage workbench |
| `/alerting/admin/alertmanager` | Settings | Admin config |

---

## End-to-End Request Flow: Rule Evaluation

```mermaid
sequenceDiagram
    participant Ticker as Ticker (10s)
    participant Sched as Scheduler
    participant DB as DBstore
    participant Rule as Per-Rule Goroutine
    participant Eval as EvaluatorFactory
    participant SSE as expr.Service (SSE)
    participant DS as Datasource
    participant State as State Manager
    participant Router as AlertsRouter
    participant AM as Alertmanager
    participant Integ as Integration (email/Slack)

    Ticker->>Sched: tick
    Sched->>DB: fetchSchedulableRules()
    DB-->>Sched: []AlertRule
    Sched->>Rule: Eval(&Evaluation{rule, tick})

    Rule->>Eval: Create(rule.GetEvalCondition())
    Eval->>SSE: BuildPipeline(queries + expressions)
    Rule->>SSE: ExecutePipeline(now)
    SSE->>DS: Query datasource(s)
    DS-->>SSE: QueryDataResponse
    SSE-->>Rule: Results[]

    Rule->>State: ProcessEvalResults(rule, results)
    State->>State: setNextStateForRule()
    State->>State: processMissingSeriesStates()
    State->>DB: Persist instances
    State->>State: Record history

    State-->>Rule: StateTransitions (to send)
    Rule->>Router: Send(alerts)
    Router->>AM: PutAlerts()
    AM->>AM: Dispatch through routing tree
    AM->>Integ: Send notification
```

---

## End-to-End Request Flow: Rule CRUD (API)

```mermaid
sequenceDiagram
    participant UI as Frontend (RuleEditor)
    participant RTKQ as RTK Query
    participant HTTP as HTTP Layer
    participant Auth as authorize()
    participant Ruler as RulerSrv
    participant Prov as Provisioning
    participant Store as DBstore
    participant Quota as QuotaService

    UI->>RTKQ: createAlertRule(formData)
    RTKQ->>HTTP: POST /api/ruler/grafana/api/v1/rules/{namespace}
    HTTP->>Auth: Check RBAC permissions
    Auth->>Ruler: RoutePostNameRulesConfig()
    Ruler->>Quota: Check rule quota
    Ruler->>Store: InsertAlertRules()
    Store-->>Ruler: Created rule
    Ruler-->>HTTP: 202 Accepted
    HTTP-->>RTKQ: Response
    RTKQ-->>UI: Invalidate cache, refetch
```

---

## Dependencies Between Components

```mermaid
flowchart TD
    subgraph external["External Dependencies"]
        ExprSvc["expr.Service (SSE)"]
        DSCache["datasources.CacheService"]
        Secrets["secrets.Service"]
        KVStore["kvstore.KVStore"]
        SQLStore["db.DB (SQLite/Postgres/MySQL)"]
        Rendering["rendering.Service"]
        Folders["folder.Service"]
        ACL["accesscontrol.AccessControl"]
        Bus["bus.Bus"]
        Tracer["tracing.Tracer"]
    end

    subgraph ngalert_deps["ngalert Internal"]
        AlertNG["AlertNG"]
        Schedule["schedule.Scheduler"]
        EvalFactory["eval.EvaluatorFactory"]
        StateMgr["state.Manager"]
        MOA["notifier.MultiOrgAlertmanager"]
        AlertsRouter["sender.AlertsRouter"]
        DBStore["store.DBstore"]
        ImageSvc["image.ImageService"]
        Historian["state.Historian"]
        API["api.API"]
    end

    AlertNG --> Schedule
    AlertNG --> EvalFactory
    AlertNG --> StateMgr
    AlertNG --> MOA
    AlertNG --> AlertsRouter
    AlertNG --> DBStore
    AlertNG --> API

    Schedule --> EvalFactory
    Schedule --> StateMgr
    Schedule --> AlertsRouter
    EvalFactory --> ExprSvc
    EvalFactory --> DSCache
    StateMgr --> DBStore
    StateMgr --> ImageSvc
    StateMgr --> Historian
    MOA --> DBStore
    MOA --> KVStore
    MOA --> Secrets
    AlertsRouter --> MOA
    DBStore --> SQLStore
    DBStore --> Folders
    DBStore --> ACL
    ImageSvc --> Rendering
    API --> ACL
    API --> StateMgr
    API --> MOA
    API --> DBStore
```

---

## HA (High Availability) Mode

```mermaid
flowchart TD
    subgraph cluster["HA Cluster"]
        Primary["Primary Node"]
        Secondary["Secondary Node(s)"]
    end

    subgraph primary_flow["Primary"]
        Coord["EvaluationCoordinator"]
        EvalRunner["evaluationRunner"]
        SchedRun["Scheduler.Run()"]
        StateRun["StateManager.Run()"]
    end

    subgraph secondary_flow["Secondary"]
        CoordS["EvaluationCoordinator"]
        APIOnly["API serves from DB"]
        StoreReader["StoreStateReader"]
    end

    Coord -->|"Updates() = true"| EvalRunner
    EvalRunner --> SchedRun
    EvalRunner --> StateRun

    CoordS -->|"Updates() = false"| APIOnly
    APIOnly --> StoreReader

    Primary -.->|"Memberlist / Redis"| Secondary
```

---

## Key Data Models

| Model | Identity | Purpose |
|-------|----------|---------|
| `AlertRule` | `{OrgID, UID}` | Full rule definition (queries, condition, labels, for duration) |
| `AlertInstance` | `{RuleOrgID, RuleUID, LabelsHash}` | Persisted alert state per label set |
| `AlertConfiguration` | `{OrgID}` | Serialized Alertmanager config |
| `Receiver` | name within config | Contact point (integrations list) |
| `NotificationSettings` | embedded in rule | Override default routing for a rule |
| `State` (runtime) | `CacheID (Fingerprint)` | In-memory state with timing and transition data |

---

## Feature Flags Affecting Alerting

| Flag | Effect |
|------|--------|
| `alertingListViewV2` | Switches rule list to v2 implementation |
| `alertingTriage` | Enables triage workbench UI |
| `alertingSaveStatePeriodic` | Async state persistence |
| `alertingSaveStateCompressed` | Protobuf-compressed state persistence |
| `kubernetesAlertingHistorian` | Enables K8s historian app |
| Feature flags for remote AM | Switches to Mimir/Cortex Alertmanager modes |
