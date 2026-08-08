# Grafana Alerting Module Investigation

This document provides a comprehensive analysis of the Grafana alerting module, covering architecture, request flows, dependencies, and business logic.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Components](#backend-components)
4. [Frontend Components](#frontend-components)
5. [Request Flows](#request-flows)
6. [Data Models](#data-models)
7. [Dependencies](#dependencies)
8. [Business Logic](#business-logic)

---

## Overview

Grafana's Unified Alerting system is a monitoring and observability platform component that evaluates alert conditions, manages alert state, and sends notifications. It consists of:

- **Backend** (`pkg/services/ngalert/`): Go services handling rule evaluation, state management, and notification routing
- **Frontend** (`public/app/features/alerting/unified/`): React/TypeScript UI for managing alerts, rules, and configurations

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (React/TypeScript)"
        UI[UI Components]
        RTK[RTK Query APIs]
        Redux[Redux State]
    end

    subgraph "Backend (Go)"
        API[HTTP API Layer]
        Scheduler[Rule Scheduler]
        StateManager[State Manager]
        Notifier[Alertmanager]
        Store[Database Store]
    end

    subgraph "External"
        DB[(SQLite/Postgres)]
        ExtAM[External Alertmanagers]
        DataSources[Data Sources]
    end

    UI --> RTK
    RTK --> API
    Redux --> UI

    API --> Store
    API --> Notifier
    Scheduler --> StateManager
    StateManager --> Store
    StateManager --> Notifier
    Scheduler --> DataSources
    Notifier --> ExtAM
    Store --> DB
```

---

## Architecture

### System Components Diagram

```mermaid
flowchart TB
    subgraph "Entry Point"
        AlertNG[AlertNG Service<br/>pkg/services/ngalert/ngalert.go]
    end

    subgraph "API Layer"
        direction LR
        RulerAPI[RulerSrv<br/>Rule CRUD]
        AMAPI[AlertmanagerSrv<br/>Alerts/Silences]
        PromAPI[PrometheusSrv<br/>Rule Status]
        ProvAPI[ProvisioningSrv<br/>Provisioning]
        HistAPI[HistorySrv<br/>State History]
        TestAPI[TestingApiSrv<br/>Testing/Backtesting]
    end

    subgraph "Core Services"
        direction TB
        Schedule[Scheduler<br/>schedule/schedule.go]
        State[State Manager<br/>state/manager.go]
        MAM[MultiOrgAlertmanager<br/>notifier/multiorg_alertmanager.go]
        Router[Alerts Router<br/>sender/router.go]
    end

    subgraph "Storage"
        DBStore[DBstore<br/>store/database.go]
        RuleStore[Alert Rule Store]
        InstanceStore[Instance Store]
        ConfigStore[AM Config Store]
    end

    subgraph "Supporting Services"
        Eval[Evaluator Factory<br/>eval/eval.go]
        Historian[Historian<br/>state/historian/]
        Image[Image Service<br/>image/]
        Provisioning[Provisioning Services<br/>provisioning/]
    end

    AlertNG --> RulerAPI
    AlertNG --> AMAPI
    AlertNG --> PromAPI
    AlertNG --> ProvAPI
    AlertNG --> HistAPI
    AlertNG --> TestAPI

    AlertNG --> Schedule
    AlertNG --> State
    AlertNG --> MAM
    AlertNG --> Router

    Schedule --> State
    Schedule --> Eval
    State --> Historian
    State --> DBStore

    MAM --> ConfigStore
    Router --> MAM

    RulerAPI --> DBStore
    AMAPI --> MAM
    ProvAPI --> Provisioning
```

---

## Backend Components

### Directory Structure

| Directory | Purpose |
|-----------|---------|
| `pkg/services/ngalert/api/` | HTTP API handlers and routes |
| `pkg/services/ngalert/store/` | Database storage layer |
| `pkg/services/ngalert/models/` | Domain models and data structures |
| `pkg/services/ngalert/schedule/` | Alert rule evaluation scheduler |
| `pkg/services/ngalert/state/` | Alert state management and caching |
| `pkg/services/ngalert/notifier/` | Alertmanager integration |
| `pkg/services/ngalert/sender/` | Alert routing to external Alertmanagers |
| `pkg/services/ngalert/eval/` | Rule evaluation logic |
| `pkg/services/ngalert/provisioning/` | Provisioning services |
| `pkg/services/ngalert/accesscontrol/` | RBAC for alerting resources |
| `pkg/services/ngalert/image/` | Screenshot capture for alerts |
| `pkg/services/ngalert/remote/` | Remote Alertmanager integration |
| `pkg/services/ngalert/writer/` | Recording rules remote write |

### Core Service Interfaces

```mermaid
classDiagram
    class ScheduleService {
        <<interface>>
        +Run(ctx context.Context) error
        +Status(ctx, key) RuleStatus, bool
    }

    class AlertInstanceManager {
        <<interface>>
        +GetAll(ctx, orgID) []*State
        +GetStatesForRuleUID(ctx, orgID, uid) []*State
    }

    class AlertsSender {
        <<interface>>
        +Send(ctx, key, alerts)
    }

    class RulesStore {
        <<interface>>
        +GetAlertRulesKeysForScheduling(ctx) []AlertRuleKeyWithVersion
        +GetAlertRulesForScheduling(ctx, query) error
    }

    class InstanceStore {
        <<interface>>
        +ListAlertInstances(ctx, query) []*AlertInstance
        +SaveAlertInstances(ctx, instances) error
        +DeleteAlertInstances(ctx, keys) error
    }

    ScheduleService ..> AlertsSender
    ScheduleService ..> RulesStore
    AlertInstanceManager ..> InstanceStore
```

### API Handlers

| Handler | Registration Method | Purpose |
|---------|-------------------|---------|
| `AlertmanagerSrv` | `RegisterAlertmanagerApiEndpoints` | Alertmanager-compatible APIs (alerts, silences, receivers) |
| `PrometheusSrv` | `RegisterPrometheusApiEndpoints` | Prometheus-compatible APIs (rule status, alerts) |
| `RulerSrv` | `RegisterRulerApiEndpoints` | Cortex Ruler-compatible APIs (rule CRUD) |
| `ProvisioningSrv` | `RegisterProvisioningApiEndpoints` | Provisioning APIs |
| `ConfigSrv` | `RegisterConfigurationApiEndpoints` | Admin configuration |
| `HistorySrv` | `RegisterHistoryApiEndpoints` | State history queries |
| `TestingApiSrv` | `RegisterTestingApiEndpoints` | Rule testing/backtesting |

---

## Frontend Components

### Directory Structure

| Directory | Purpose |
|-----------|---------|
| `public/app/features/alerting/unified/api/` | RTK Query API slices |
| `public/app/features/alerting/unified/components/` | React components by domain |
| `public/app/features/alerting/unified/hooks/` | Reusable custom hooks |
| `public/app/features/alerting/unified/rule-editor/` | Alert rule forms |
| `public/app/features/alerting/unified/rule-list/` | Rules list views |
| `public/app/features/alerting/unified/state/` | Redux state management |
| `public/app/features/alerting/unified/types/` | TypeScript definitions |
| `public/app/features/alerting/unified/utils/` | Utility functions |

### Frontend Component Architecture

```mermaid
graph TB
    subgraph "Page Components"
        RuleList[RuleList.tsx]
        RuleViewer[RuleViewer.tsx]
        RuleEditor[RuleEditor.tsx]
        AlertGroups[AlertGroups.tsx]
        Silences[SilencesPage.tsx]
        ContactPoints[ContactPointsPage.tsx]
        NotifPolicies[NotificationPoliciesPage.tsx]
    end

    subgraph "API Layer (RTK Query)"
        alertRuleApi[alertRuleApi.ts]
        alertmanagerApi[alertmanagerApi.ts]
        prometheusApi[prometheusApi.ts]
        silencesApi[alertSilencesApi.ts]
        templateApi[templateApi.ts]
    end

    subgraph "State Management"
        RTKStore[RTK Query Cache]
        ReduxLegacy[Redux Reducers<br/>Legacy]
        Contexts[Context Providers<br/>AlertmanagerContext<br/>SettingsContext]
    end

    subgraph "Shared Components"
        AlertLabels[Alert Labels]
        RuleState[Rule State]
        Matchers[Matchers]
        TimeIntervals[Time Intervals]
    end

    RuleList --> alertRuleApi
    RuleViewer --> alertRuleApi
    RuleEditor --> alertRuleApi
    AlertGroups --> alertmanagerApi
    Silences --> silencesApi
    ContactPoints --> alertmanagerApi

    alertRuleApi --> RTKStore
    alertmanagerApi --> RTKStore
    Contexts --> RuleList
    Contexts --> AlertGroups
```

### Key Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/alerting` | Home | Alerting home page |
| `/alerting/list` | RuleList | Rules list (v1/v2) |
| `/alerting/new/:type?` | RuleEditor | Create new rule |
| `/alerting/:id/edit` | RuleEditor | Edit existing rule |
| `/alerting/notifications` | ContactPoints | Contact points |
| `/alerting/routes` | NotificationPolicies | Notification policies |
| `/alerting/silences` | Silences | Silence management |

---

## Request Flows

### Rule Evaluation Flow

```mermaid
sequenceDiagram
    participant Ticker as Ticker
    participant Scheduler as Scheduler
    participant RuleStore as Rule Store
    participant Evaluator as Evaluator
    participant DataSource as Data Source
    participant StateManager as State Manager
    participant Historian as Historian
    participant Router as Alerts Router
    participant AM as Alertmanager

    loop Every Base Interval (default 10s)
        Ticker->>Scheduler: Tick
        Scheduler->>RuleStore: GetAlertRulesForScheduling()
        RuleStore-->>Scheduler: Alert Rules

        loop For each due rule
            Scheduler->>Evaluator: Evaluate(rule)
            Evaluator->>DataSource: Execute Query
            DataSource-->>Evaluator: Query Results
            Evaluator-->>Scheduler: Evaluation Results

            Scheduler->>StateManager: ProcessEvaluationResults()
            StateManager->>StateManager: Calculate State Transitions
            StateManager->>Historian: Record State History
            StateManager-->>Scheduler: State Transitions

            Scheduler->>Router: Send(alerts)
            Router->>AM: PostAlerts()
        end
    end
```

### State Transition Logic

```mermaid
stateDiagram-v2
    [*] --> Normal: Initial State

    Normal --> Pending: Condition True
    Normal --> NoData: No Data Received
    Normal --> Error: Evaluation Error

    Pending --> Alerting: For Duration Exceeded
    Pending --> Normal: Condition False
    Pending --> NoData: No Data Received
    Pending --> Error: Evaluation Error

    Alerting --> Normal: Condition False
    Alerting --> NoData: No Data Received
    Alerting --> Error: Evaluation Error

    NoData --> Normal: Data Returns + Condition False
    NoData --> Pending: Data Returns + Condition True
    NoData --> Alerting: NoDataState=Alerting
    NoData --> Error: Evaluation Error

    Error --> Normal: Condition False
    Error --> Pending: Condition True
    Error --> Alerting: ExecErrState=Alerting
    Error --> NoData: No Data Received
```

### Alert Rule CRUD Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as Ruler API
    participant AuthZ as Access Control
    participant Validator as Condition Validator
    participant Store as Rule Store
    participant AM as Alertmanager

    Client->>API: POST /api/ruler/grafana/api/v1/rules/{namespace}
    API->>AuthZ: AuthorizeRuleChanges()
    AuthZ-->>API: Authorized

    API->>Validator: Validate(rule)
    Validator-->>API: Valid

    API->>Store: InsertAlertRules()
    Store-->>API: Rule Created

    API->>AM: Refresh Config (if auto-generation enabled)
    AM-->>API: Config Updated

    API-->>Client: 202 Accepted
```

### Notification Delivery Flow

```mermaid
sequenceDiagram
    participant Router as Alerts Router
    participant MAM as MultiOrgAlertmanager
    participant AM as Alertmanager
    participant Dispatcher as Dispatcher
    participant Stage as Notification Pipeline
    participant Receiver as Receiver (Email/Slack/etc)

    Router->>MAM: Send(orgID, alerts)
    MAM->>AM: PutAlerts(alerts)

    AM->>Dispatcher: DispatchAlerts()
    Dispatcher->>Dispatcher: Match Routing Tree
    Dispatcher->>Stage: Notify(alerts, receiver)

    Stage->>Stage: Inhibit Check
    Stage->>Stage: Silence Check
    Stage->>Stage: Wait for Group Interval
    Stage->>Stage: Deduplicate

    Stage->>Receiver: Send Notification
    Receiver-->>Stage: Success/Failure
```

### Silence Management Flow

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Alertmanager API
    participant SilenceSvc as Silence Service
    participant AuthZ as Silence Access Control
    participant AM as Alertmanager
    participant Store as Silence Store

    UI->>API: POST /api/alertmanager/grafana/api/v2/silences
    API->>SilenceSvc: CreateSilence(silence)
    SilenceSvc->>AuthZ: AuthorizeSilence(silence, rules)
    AuthZ-->>SilenceSvc: Authorized

    SilenceSvc->>AM: SetSilence(silence)
    AM->>Store: Persist Silence
    Store-->>AM: Stored

    AM-->>SilenceSvc: Silence ID
    SilenceSvc-->>API: Silence Created
    API-->>UI: 200 OK {silenceID}
```

---

## Data Models

### Alert Rule Model

```mermaid
erDiagram
    AlertRule {
        int64 ID PK
        string GUID UK
        int64 OrgID
        string UID UK
        string Title
        string Condition
        json Data "AlertQuery[]"
        int64 IntervalSeconds
        duration For
        duration KeepFiringFor
        string NoDataState
        string ExecErrState
        string NamespaceUID FK
        string RuleGroup
        json Annotations
        json Labels
        json NotificationSettings
        json Record
        timestamp Updated
    }

    AlertInstance {
        int64 RuleOrgID PK
        string RuleUID PK
        string Labels PK
        string CurrentState
        timestamp CurrentStateSince
        timestamp LastEvalTime
        string CurrentReason
        string ResultFingerprint
    }

    AlertConfiguration {
        int64 ID PK
        int64 OrgID
        string AlertmanagerConfiguration
        string ConfigurationHash
        int64 ConfigurationVersion
        timestamp CreatedAt
        bool Default
    }

    Silence {
        string ID PK
        json Matchers
        timestamp StartsAt
        timestamp EndsAt
        timestamp UpdatedAt
        string CreatedBy
        string Comment
        string State
    }

    AlertRule ||--o{ AlertInstance : "has instances"
    AlertConfiguration ||--o{ Silence : "contains"
```

### Frontend Type Definitions

```typescript
// Rule Form Types
enum RuleFormType {
  grafana = 'grafana-alerting',
  grafanaRecording = 'grafana-recording',
  cloudAlerting = 'cloud-alerting',
  cloudRecording = 'cloud-recording',
}

interface RuleFormValues {
  name: string;
  type?: RuleFormType;
  dataSourceName: string | null;
  group: string;
  labels: Array<{ key: string; value: string }>;
  annotations: Array<{ key: string; value: string }>;
  queries: AlertQuery[];
  condition: string | null;
  noDataState: GrafanaAlertStateDecision;
  execErrState: GrafanaAlertStateDecision;
  folder: Folder | undefined;
  evaluateEvery: string;
  evaluateFor: string;
}

// Combined Rule (merges Prometheus + Ruler data)
interface CombinedRule {
  name: string;
  query: string;
  labels: Labels;
  annotations: Annotations;
  promRule?: Rule;
  rulerRule?: RulerRuleDTO;
  namespace: CombinedRuleNamespace;
  group: CombinedRuleGroup;
  instanceTotals: AlertInstanceTotals;
}
```

---

## Dependencies

### Backend Dependencies

```mermaid
graph TB
    subgraph "Core Grafana Services"
        DB[db.DB]
        KV[kvstore.KVStore]
        AC[accesscontrol.AccessControl]
        Folder[folder.Service]
        DS[datasources.CacheService]
        Secrets[secrets.Service]
        Quota[quota.Service]
    end

    subgraph "Alerting Services"
        AlertNG[AlertNG]
        Schedule[Scheduler]
        State[State Manager]
        Notifier[MultiOrgAlertmanager]
        Store[DBstore]
    end

    subgraph "External Libraries"
        Prometheus[github.com/prometheus/alertmanager]
        GrafanaAlerting[github.com/grafana/alerting]
    end

    AlertNG --> DB
    AlertNG --> KV
    AlertNG --> AC
    AlertNG --> Folder
    AlertNG --> DS
    AlertNG --> Secrets
    AlertNG --> Quota

    Schedule --> Store
    State --> Store
    Notifier --> Store
    Notifier --> Prometheus
    Notifier --> GrafanaAlerting
```

### Frontend Dependencies

```mermaid
graph TB
    subgraph "Grafana Packages"
        GrafanaUI[@grafana/ui]
        GrafanaData[@grafana/data]
        GrafanaRuntime[@grafana/runtime]
        GrafanaScenes[@grafana/scenes]
        GrafanaAlerting[@grafana/alerting]
        GrafanaAPIClients[@grafana/api-clients]
    end

    subgraph "External Libraries"
        ReactHookForm[react-hook-form v7]
        RTK[@reduxjs/toolkit]
        Emotion[@emotion/css]
        Lodash[lodash]
        MSW[msw - testing]
    end

    subgraph "Alerting Frontend"
        Components[Components]
        APIs[API Slices]
        Hooks[Hooks]
    end

    Components --> GrafanaUI
    Components --> GrafanaData
    Components --> Emotion
    APIs --> RTK
    APIs --> GrafanaAPIClients
    Hooks --> GrafanaRuntime
```

---

## Business Logic

### Rule Evaluation Pipeline

1. **Scheduling**: The scheduler maintains a tick-based loop (default 10s interval)
2. **Rule Fetching**: Queries database for rules due for evaluation based on `IntervalSeconds`
3. **Query Execution**: Evaluator executes data queries against configured data sources
4. **Condition Evaluation**: Expression service evaluates the condition RefID
5. **State Calculation**: State manager determines new state based on:
   - Evaluation results
   - Previous state
   - `For` duration (pending period)
   - `NoDataState` and `ExecErrState` configurations
6. **History Recording**: State transitions recorded to historian (annotations, Loki, or both)
7. **Alert Routing**: Alerts sent to internal Alertmanager or external Alertmanagers

### Alertmanager Processing

```mermaid
flowchart TB
    Alerts[Incoming Alerts] --> Inhibitor{Inhibition Check}
    Inhibitor -->|Not Inhibited| Silencer{Silence Check}
    Inhibitor -->|Inhibited| Drop[Drop Alert]

    Silencer -->|Not Silenced| Router[Routing Tree]
    Silencer -->|Silenced| Drop

    Router --> Group1[Group 1]
    Router --> Group2[Group 2]
    Router --> GroupN[Group N]

    Group1 --> Wait1[Wait Group Interval]
    Group2 --> Wait2[Wait Group Interval]
    GroupN --> WaitN[Wait Group Interval]

    Wait1 --> Dedup1[Deduplicate]
    Wait2 --> Dedup2[Deduplicate]
    WaitN --> DedupN[Deduplicate]

    Dedup1 --> Notify[Notification Pipeline]
    Dedup2 --> Notify
    DedupN --> Notify

    Notify --> Receiver1[Email]
    Notify --> Receiver2[Slack]
    Notify --> ReceiverN[Webhook]
```

### Access Control Model

```mermaid
flowchart TB
    subgraph "Rule Access"
        RuleRead[alerting.rule:read]
        RuleCreate[alerting.rule:create]
        RuleWrite[alerting.rule:write]
        RuleDelete[alerting.rule:delete]
    end

    subgraph "Instance Access"
        InstanceRead[alerting.instance:read]
        InstanceCreate[alerting.instance:create]
        InstanceWrite[alerting.instance:write]
    end

    subgraph "Notification Access"
        NotifRead[alerting.notifications:read]
        NotifWrite[alerting.notifications:write]
    end

    subgraph "Silence Access"
        SilenceRead[alerting.silences:read]
        SilenceCreate[alerting.silences:create]
        SilenceWrite[alerting.silences:write]
    end

    RuleRead --> Viewer[Viewer Role]
    InstanceRead --> Viewer
    NotifRead --> Viewer
    SilenceRead --> Viewer

    RuleCreate --> Editor[Editor Role]
    RuleWrite --> Editor
    RuleDelete --> Editor
    InstanceCreate --> Editor
    InstanceWrite --> Editor
    NotifWrite --> Editor
    SilenceCreate --> Editor
    SilenceWrite --> Editor
```

### Configuration Hierarchy

```mermaid
flowchart TB
    subgraph "Global Config"
        GrafanaINI[grafana.ini / defaults.ini]
        UnifiedAlerting[unified_alerting section]
    end

    subgraph "Organization Level"
        OrgAMConfig[Alertmanager Configuration]
        AdminConfig[Admin Configuration]
    end

    subgraph "Rule Level"
        RuleGroup[Rule Group Settings]
        AlertRule[Individual Rule Settings]
        NotificationSettings[Notification Settings]
    end

    GrafanaINI --> UnifiedAlerting
    UnifiedAlerting --> OrgAMConfig
    UnifiedAlerting --> AdminConfig

    OrgAMConfig --> RuleGroup
    AdminConfig --> RuleGroup

    RuleGroup --> AlertRule
    AlertRule --> NotificationSettings
```

### Multi-Tenancy Model

- Each organization has its own:
  - Alert rules
  - Alert instances
  - Alertmanager configuration
  - Contact points and notification policies
  - Silences and mute timings

```mermaid
flowchart TB
    subgraph "Org 1"
        Rules1[Alert Rules]
        AM1[Alertmanager Instance]
        Config1[AM Configuration]
    end

    subgraph "Org 2"
        Rules2[Alert Rules]
        AM2[Alertmanager Instance]
        Config2[AM Configuration]
    end

    MAM[MultiOrgAlertmanager] --> AM1
    MAM --> AM2

    Scheduler --> Rules1
    Scheduler --> Rules2
```

---

## Key Files Reference

### Backend

| File | Purpose |
|------|---------|
| `pkg/services/ngalert/ngalert.go` | Main service entry point, Wire DI provider |
| `pkg/services/ngalert/schedule/schedule.go` | Rule evaluation scheduler |
| `pkg/services/ngalert/state/manager.go` | Alert state management |
| `pkg/services/ngalert/notifier/multiorg_alertmanager.go` | Multi-tenant Alertmanager |
| `pkg/services/ngalert/api/api.go` | API handler registration |
| `pkg/services/ngalert/store/alert_rule.go` | Rule storage operations |
| `pkg/services/ngalert/models/alert_rule.go` | Alert rule domain model |

### Frontend

| File | Purpose |
|------|---------|
| `public/app/features/alerting/unified/api/alertingApi.ts` | RTK Query base configuration |
| `public/app/features/alerting/unified/api/alertRuleApi.ts` | Rule API endpoints |
| `public/app/features/alerting/unified/state/AlertmanagerContext.tsx` | AM context provider |
| `public/app/features/alerting/unified/hooks/useAbilities.ts` | RBAC hooks |
| `public/app/features/alerting/unified/utils/rules.ts` | Rule type guards |

---

## Summary

The Grafana alerting module is a comprehensive system with:

1. **Backend**: Go services using Wire DI for initialization, with clear separation between API handlers, business logic services, and data storage
2. **Frontend**: React/TypeScript application using RTK Query for data fetching, react-hook-form for forms, and Emotion for styling
3. **Evaluation Loop**: Ticker-based scheduler that evaluates rules against data sources and manages state transitions
4. **Notification Pipeline**: Prometheus Alertmanager-compatible notification routing with support for multiple receivers
5. **Access Control**: Fine-grained RBAC for all alerting resources
6. **Multi-tenancy**: Full organization isolation for rules, configurations, and notifications
