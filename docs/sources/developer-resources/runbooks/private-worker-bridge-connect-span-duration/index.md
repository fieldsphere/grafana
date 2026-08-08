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

Use this runbook when an Application Performance Monitoring dashboard ranks a Private Worker Bridge `connect` resource as a high p95 latency endpoint. The internal and external `connect` resources are long-lived gRPC streams. Their root span duration usually tracks connection lifetime, not the time spent handling one request.

Before you begin, ensure you have the following:

- Access to the tracing backend for the Private Worker Bridge service.
- Access to the Application Performance Monitoring dashboard or alert that lists the `connect` resource.
- Permission to update dashboard and alert queries for the service.

## Expected behavior and ownership

The Private Worker Bridge keeps a stream open between the bridge and workers. A high duration on the root span can be healthy when the stream remains connected for a long time.

Treat root `connect` spans as connection-lifetime spans. Don't use their wall-clock duration as request latency. Use child spans or separate metrics for per-message work, reconnect behavior, and error handling.

The bridge team owns the shared client and server stream tracing middleware. Product and SRE owners for the Private Worker Bridge dashboards own Application Performance Monitoring filters, alert thresholds, and service objectives.

## Internal and external resources

Use the same triage model for internal and external bridge streams.

| Bridge path | Datadog resource | Expected semantics |
| --- | --- | --- |
| External worker bridge | `resource_name:/agent.v1.privateworkerbridgeexternalservice/connect` | Long-lived stream between an agent-facing bridge endpoint and a worker. |
| Internal worker bridge | `resource_name:/internapi.v1.privateworkerbridgeinternalservice/connect` | Long-lived stream for internal bridge traffic. |

Keep dashboards explicit about which resource they show. Compare the internal and external resources when one stream family changes but the other stays stable.

## Confirm the trace shape

Use trace samples to confirm whether the high p95 duration comes from a streaming connection or from slow per-message work.

1. Filter traces for `service:private-worker-bridge` and the affected `resource_name`.
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

- **Exclude connection-lifetime spans:** Add filters that remove `resource_name:/agent.v1.privateworkerbridgeexternalservice/connect` and `resource_name:/internapi.v1.privateworkerbridgeinternalservice/connect` from endpoint latency rankings.
- **Segment streaming resources:** Move `connect` into a separate streaming connections panel that shows connection count, stream age, reconnect rate, and errors.
- **Rank child operations:** Use child span resources for per-message latency panels.
- **Filter by span metadata:** For gRPC server spans emitted by Grafana's shared stream interceptor, use `grafana.grpc.rpc_type:stream` or `rpc.grpc.stream:true` to separate streams from unary request and response RPCs.
- **Rename panels:** Make panel titles explicit, such as `Endpoint p95 latency excluding streaming connect spans`.

If you use Datadog Application Performance Monitoring queries, keep `service:private-worker-bridge` and add resource exclusions for the latency ranking panel. For example, exclude both `connect` resources from p95 rankings and create a separate query for each resource's reconnect and error signals.

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

Add this runbook link to the Private Worker Bridge dashboard and alerts that include either `connect` resource. For tracing concepts in Grafana, refer to [Traces in Explore](/docs/grafana/<GRAFANA_VERSION>/explore/trace-integration/).
