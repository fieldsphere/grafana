# Frontend Console.log Migration Guide

## Executive Summary

**Recommended Target API**: Use `@grafana/runtime` logging utilities (`logInfo`, `logWarning`, `logDebug`, `logError`, `logMeasurement`) for migrating `console.log` calls. These utilities wrap Grafana Faro SDK and provide a safe, structured logging interface that respects feature flags and integrates with backend logging infrastructure.

## Logging Frameworks Found

### 1. **@grafana/runtime Logging Utilities** ⭐ **RECOMMENDED**

**Location**: `packages/grafana-runtime/src/utils/logging.ts`

**Status**: Primary structured logging API for frontend code

**Features**:
- Respects `config.grafanaJavascriptAgent.enabled` feature flag
- Structured logging with context support
- Integrates with Grafana Faro SDK backend
- Backend endpoint: `/log-grafana-javascript-agent`
- Logs are forwarded to backend Go logger (`pkg/infra/log`)

**API Methods**:
- `logInfo(message: string, contexts?: LogContext)`
- `logWarning(message: string, contexts?: LogContext)`
- `logDebug(message: string, contexts?: LogContext)`
- `logError(err: Error, contexts?: LogContext)`
- `logMeasurement(type: string, values: MeasurementValues, context?: LogContext)`
- `createMonitoringLogger(source: string, defaultContext?: LogContext): MonitoringLogger`

**Import Pattern**:
```typescript
import { logInfo, logWarning, logDebug, logError, logMeasurement } from '@grafana/runtime';
```

**Usage Examples**:
```typescript
// Simple info log
logInfo('Dashboard loaded successfully');

// With context
logInfo('Panel rendered', {
  panelId: '1',
  panelType: 'timeseries',
  dashboardId: '123'
});

// Error logging
try {
  // ...
} catch (err) {
  logError(err, {
    component: 'PanelRenderer',
    panelId: panelId
  });
}

// Measurement logging
logMeasurement('panel_render_time', {
  durationMs: 150,
  panelType: 'timeseries'
}, {
  panelId: '1',
  dashboardId: '123'
});

// Scoped logger (recommended for components/modules)
const logger = createMonitoringLogger('PanelRenderer', {
  component: 'PanelRenderer'
});

logger.logInfo('Panel initialized', { panelId: '1' });
logger.logError(error, { panelId: '1' });
```

**Backend Integration**: Logs are received at `/log-grafana-javascript-agent` endpoint and processed by `pkg/api/frontend_logging.go`, which forwards them to the backend structured logger (`pkg/infra/log`).

---

### 2. **Grafana Faro SDK** (Direct Usage)

**Location**: `@grafana/faro-web-sdk`

**Status**: Underlying framework (prefer runtime utilities)

**Direct API**:
```typescript
import { faro } from '@grafana/faro-web-sdk';

faro.api.pushLog([message], { level: LogLevel.INFO, context: {...} });
faro.api.pushError(error, { context: {...} });
faro.api.pushEvent(eventName, eventData);
faro.api.pushMeasurement(measurement, { context: {...} });
```

**When to Use**: Only when runtime utilities don't meet specific needs (e.g., custom event types). Prefer runtime utilities for standard logging.

**Found Usage**:
- `public/app/features/dashboard/dashgrid/panelOptionsLogger.ts` - Panel option change events
- `public/app/features/dashboard/dashgrid/PanelLoadTimeMonitor.tsx` - Performance measurements

---

### 3. **EchoSrv** (Analytics/Telemetry)

**Location**: `@grafana/runtime` (`getEchoSrv()`)

**Status**: **NOT for logging** - Used for analytics/telemetry events

**Purpose**: Routes events to backends (including Faro) for analytics, not structured logging

**When to Use**: User interactions, analytics events, performance telemetry

**Example**:
```typescript
import { getEchoSrv, EchoEventType } from '@grafana/runtime';

getEchoSrv().addEvent({
  type: EchoEventType.Performance,
  payload: { name: 'dashboard_load', value: 150 }
});
```

---

### 4. **appEvents** (UI Alerts)

**Location**: `app/core/app_events.ts`

**Status**: **NOT for logging** - Legacy event emitter for UI notifications

**Purpose**: Emits UI alert events (success, error, warning notifications)

**When to Use**: Displaying user-facing notifications/alerts

**Example**:
```typescript
import { appEvents } from 'app/core/app_events';
import { AppEvents } from '@grafana/data';

appEvents.emit(AppEvents.alertError, ['Error message']);
```

---

### 5. **Scene Performance Logger**

**Location**: `public/app/features/dashboard/services/ScenePerformanceLogger.ts`

**Status**: Specialized performance logging for Scene framework

**Purpose**: Performance marks/measures for dashboard/panel operations

**API**: Uses `writePerformanceLog` from `@grafana/scenes`

**When to Use**: Performance profiling within Scene-based dashboards

---

## Migration Strategy

### Step 1: Identify Log Type

- **Informational messages** → `logInfo()`
- **Warnings** → `logWarning()`
- **Debug messages** → `logDebug()`
- **Errors** → `logError()`
- **Performance metrics** → `logMeasurement()`
- **User notifications** → Keep `appEvents` (not logging)
- **Analytics events** → Use `EchoSrv` (not logging)

### Step 2: Migration Patterns

#### Pattern 1: Simple Console.log → logInfo

**Before**:
```typescript
console.log('Dashboard loaded');
```

**After**:
```typescript
import { logInfo } from '@grafana/runtime';

logInfo('Dashboard loaded');
```

#### Pattern 2: Console.log with Objects → Structured Context

**Before**:
```typescript
console.log('Panel rendered', { panelId: 1, type: 'timeseries' });
```

**After**:
```typescript
import { logInfo } from '@grafana/runtime';

logInfo('Panel rendered', {
  panelId: '1',
  panelType: 'timeseries'
});
```

#### Pattern 3: Console.error → logError

**Before**:
```typescript
console.error('Failed to load panel', error);
```

**After**:
```typescript
import { logError } from '@grafana/runtime';

logError(error, {
  component: 'PanelLoader',
  panelId: panelId
});
```

#### Pattern 4: Console.warn → logWarning

**Before**:
```typescript
console.warn('Deprecated API used');
```

**After**:
```typescript
import { logWarning } from '@grafana/runtime';

logWarning('Deprecated API used', {
  api: 'oldApi',
  component: 'DataTransformer'
});
```

#### Pattern 5: Component/Module Scoped Logger

**Before**:
```typescript
console.log('[PanelRenderer] Initializing panel', panelId);
console.log('[PanelRenderer] Panel loaded', panelId);
```

**After**:
```typescript
import { createMonitoringLogger } from '@grafana/runtime';

const logger = createMonitoringLogger('PanelRenderer');

logger.logInfo('Initializing panel', { panelId });
logger.logInfo('Panel loaded', { panelId });
```

### Step 3: Context Best Practices

**Include relevant context**:
- Component/module name
- User/session identifiers (when available)
- Request IDs or operation IDs
- Resource identifiers (dashboardId, panelId, etc.)
- State information (loading, error states)

**Avoid sensitive data**:
- Passwords, tokens, API keys
- PII (unless necessary and properly handled)
- Full request/response bodies (use summaries)

**Example**:
```typescript
logInfo('Query executed', {
  datasource: datasource.name,
  datasourceType: datasource.type,
  queryType: query.queryType,
  durationMs: endTime - startTime,
  // Avoid: queryBody: query (may contain sensitive data)
});
```

---

## Feature Flag Behavior

All runtime logging utilities respect `config.grafanaJavascriptAgent.enabled`. When disabled:
- Logs are silently ignored (no-op)
- No performance overhead
- No backend requests

This allows logging to be feature-flagged for production control.

---

## Backend Processing

Frontend logs are:
1. Sent to `/log-grafana-javascript-agent` endpoint
2. Processed by `pkg/api/frontend_logging.go`
3. Forwarded to backend structured logger (`pkg/infra/log`)
4. Include metadata: user, session, page, browser, SDK info
5. Rate-limited and batched

---

## Testing Considerations

**Mocking in Tests**:
```typescript
jest.mock('@grafana/runtime', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  // ...
}));
```

**Verification**:
```typescript
import { logInfo } from '@grafana/runtime';

expect(logInfo).toHaveBeenCalledWith('Expected message', {
  expectedContext: 'value'
});
```

---

## Summary

**For console.log migrations, use**:
```typescript
import { logInfo, logWarning, logDebug, logError, logMeasurement, createMonitoringLogger } from '@grafana/runtime';
```

**Key Benefits**:
- ✅ Structured logging with context
- ✅ Feature flag support
- ✅ Backend integration
- ✅ Type-safe API
- ✅ Scoped logger support
- ✅ Respects Grafana logging conventions

**Avoid**:
- ❌ Direct Faro SDK usage (unless necessary)
- ❌ EchoSrv for logging (use for analytics)
- ❌ appEvents for logging (use for UI alerts)
- ❌ console.log/warn/error (migrate to runtime utilities)
