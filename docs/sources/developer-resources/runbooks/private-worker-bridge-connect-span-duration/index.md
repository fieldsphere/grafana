---
description: Triage long-lived Private Worker Bridge connect spans in Application Performance Monitoring dashboards.
keywords:
  - apm
  - private worker bridge
  - streaming
  - tracing
  - slo
labels:
  products:
    - cloud
title: Private Worker Bridge connect span duration
menuTitle: Private Worker Bridge connect spans
weight: 100
---

# Private Worker Bridge connect span duration

Use this runbook when an Application Performance Monitoring dashboard ranks the Private Worker Bridge `connect` resource as a high p95 latency endpoint. The `connect` resource is a long-lived gRPC stream. Its root span duration usually tracks the connection lifetime, not the time spent handling one request.

Before you begin, ensure you have the following:

- Access to the tracing backend for the Private Worker Bridge service.
- Access to the Application Performance Monitoring dashboard or alert that lists the `connect` resource.
- Permission to update dashboard and alert queries for the service.

## Expected behavior

The external Private Worker Bridge `connect` path keeps a stream open between the bridge and worker. A high duration on the root span can be healthy when the stream remains connected for a long time.

Treat the root `connect` span as a connection-lifetime span. Don't use its wall-clock duration as a request latency signal. Use child spans or separate metrics for per-message work, reconnect behavior, and error handling.

## Confirm the trace shape

Use trace samples to confirm whether the high p95 duration comes from a streaming connection or from slow per-message work.

1. Filter traces for `service:private-worker-bridge` and `resource_name:/agent.v1.privateworkerbridgeexternalservice/connect`.
1. Open several traces from the high p95 time window.
1. Confirm the root span covers the stream lifetime.
1. Inspect child spans for send, receive, authorization, message handling, or tick work.
1. Check whether errors, reconnects, or large gaps between child spans correlate with the dashboard spike.

If the root span is long and child spans complete quickly, treat the signal as a long-lived connection. If child spans are slow, fail, or backlog, triage the child operation instead of the root span.

## Instrument per-message work

Use child spans to measure work performed inside the stream. Child spans should represent bounded units of work.

- **Message handling:** Create child spans for each inbound or outbound message batch.
- **Tick work:** Create child spans for periodic maintenance work such as heartbeats or lease refreshes.
- **Authentication and authorization:** Keep authentication and authorization spans separate from the stream root.
- **Errors:** Set span status and error attributes on the child span that fails.
- **Backlog:** Record queue length or backlog metrics outside the root span duration.

Keep the root span as the stream lifecycle span. Closing or suppressing the root span early hides connection lifecycle data and makes reconnect investigations harder.

## Use actionable service objectives

Don't define service objectives on raw `connect` span duration. Use signals that map to user impact and operational risk.

- **Time to first byte:** Measure how long it takes a new stream to receive the first useful response.
- **Error rate:** Track failed connection attempts and stream errors.
- **Reconnects:** Alert on elevated reconnect rates or reconnect loops.
- **Backlog:** Track pending work, queue depth, or delayed message processing.
- **Per-message latency:** Measure child span duration for bounded send, receive, and processing work.

These signals show whether the bridge is slow or unhealthy without paging on healthy long-lived streams.

## Update dashboards and alerts

Update latency ranking panels so long-lived `connect` streams don't hide actionable endpoints.

Use one of these approaches:

- **Exclude connection-lifetime spans:** Add a filter that removes `resource_name:/agent.v1.privateworkerbridgeexternalservice/connect` from endpoint latency rankings.
- **Segment streaming resources:** Move `connect` into a separate streaming connections panel that shows connection count, stream age, reconnect rate, and errors.
- **Rank child operations:** Use child span resources for per-message latency panels.
- **Rename panels:** Make panel titles explicit, such as `Endpoint p95 latency excluding streaming connect spans`.

If you use Datadog Application Performance Monitoring queries, keep `service:private-worker-bridge` and add a resource exclusion for the latency ranking panel. For example, exclude `resource_name:/agent.v1.privateworkerbridgeexternalservice/connect` from the p95 ranking and create a separate query for that resource's reconnect and error signals.

## Escalation criteria

Escalate when traces or metrics show a customer-impacting condition.

- The stream fails before processing useful work.
- The time to first byte increases for new streams.
- Reconnect rate rises above normal behavior.
- Child spans for message handling or tick work become slow.
- Backlog grows or messages stop draining.
- Error rate increases on the stream or its child operations.

Don't escalate only because the root `connect` span duration appears in a p95 latency ranking.

## Related resources

Add this runbook link to the Private Worker Bridge dashboard and alerts that include the external `connect` resource. For tracing concepts in Grafana, refer to [Traces in Explore](/docs/grafana/<GRAFANA_VERSION>/explore/trace-integration/).
