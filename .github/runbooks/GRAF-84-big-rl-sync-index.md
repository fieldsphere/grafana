# Big RL `sync_index` latency runbook

This runbook covers high p95 latency for the Big RL environment sync endpoint:
`/cursor_big_rl/environment/sync_index` on service `ml-infra-server`.

Use it when Datadog APM shows a slow root resource for this endpoint, or when
RL jobs fail near environment sync and indexing steps.

## Before you begin

Ensure you have the following:

- Access to the [Big RL Run Reliability](https://us5.datadoghq.com/dashboard/h87-dhx-kvc) dashboard.
- Access to the [ML Infra Token Usage](https://us5.datadoghq.com/dashboard/7j3-mgi-3va) dashboard.
- Datadog APM access for service `ml-infra-server`.
- Deploy access to the repository that owns the `cursor_big_rl` environment service.

## First response

Use the root resource only to detect that the endpoint is slow. Triage and alert
on inner spans so the responder can tell whether the tail comes from data
download, extraction, index writes, or validation.

1. Open Datadog APM for service `ml-infra-server`.
1. Filter resources to `/cursor_big_rl/environment/sync_index`.
1. Set the lookback window to the incident window and compare it with the prior
   healthy window.
1. Sort traces by duration and inspect the slowest p95 traces.
1. Save the trace waterfall or screenshot in the incident or Jira ticket.

## Trace breakdown

Break each slow trace into these phases. If a span is missing, add it before
tuning the endpoint.

| Phase | Span name | What to check | Tail-latency signal |
| --- | --- | --- | --- |
| Download | `sync_index.download` | Source size, S3 latency, retries, network errors, cache misses. | Long client spans or retry loops dominate the waterfall. |
| Extract | `sync_index.extract` | Archive size, file count, decompression CPU, temporary disk pressure. | CPU-bound spans grow with payload size. |
| Index write | `sync_index.index_write` | Batch size, write concurrency, lock contention, downstream throttling. | Wide fan-out or serial writes dominate p95. |
| Validation | `sync_index.validation` | Full scans, schema validation, duplicate checks, per-record lookups. | Validation runs after successful writes and extends request time. |

Tag each span with bounded cardinality values:

- `environment_id`
- `sync_size_bucket`
- `index_batch_count`
- `retry_count`
- `async_job_id` when the work moves behind a job boundary

Do not tag spans with raw file names, user-provided paths, or unbounded object
keys.

## Bound synchronous work

Choose the smallest mitigation that targets the dominant phase.

### Download dominates

Apply these controls when download spans drive p95:

- Stream payloads instead of loading the full archive into memory.
- Add request deadlines for object-store calls.
- Retry transient object-store errors with bounded exponential backoff.
- Record retry count and final error class on the download span.

### Extract dominates

Apply these controls when extraction spans drive p95:

- Process archives in chunks and stop when the request deadline has too little
  time left to complete safely.
- Reject payloads that exceed configured size or file-count limits.
- Move CPU-heavy decompression into an async job when extraction routinely
  consumes most of the request budget.

### Index writes dominate

Apply these controls when index write spans drive p95:

- Write in fixed-size batches and emit `index_batch_count`.
- Bound write concurrency so large syncs don't starve normal jobs.
- Add idempotency keys around batches so retries don't duplicate index records.
- Prefer an async job with polling if p95 remains high after batching.

### Validation dominates

Apply these controls when validation spans drive p95:

- Validate incrementally during extraction or batch writes.
- Cache repeated schema or environment metadata lookups for the request.
- Fail fast for known invalid payloads before write work starts.

## Async boundary

Move the endpoint behind an async job when the p95 request time is close to the
HTTP timeout or when one sync can monopolize workers.

Use this contract:

- `POST /cursor_big_rl/environment/sync_index` validates the request, creates a
  sync job, and returns `202 Accepted` with `job_id`.
- `GET /cursor_big_rl/environment/sync_index/{job_id}` returns `queued`,
  `running`, `succeeded`, or `failed`.
- Workers process bounded chunks and checkpoint progress after each chunk.
- Retries resume from the last checkpoint.
- The root request span links to the worker trace through `async_job_id`.

## Alerting

Alert on inner span p95, not only on the root resource. Root-resource p95 tells
you that the endpoint is slow, but inner span p95 tells you which team or
dependency should act.

Create monitors for these spans:

- `sync_index.download`
- `sync_index.extract`
- `sync_index.index_write`
- `sync_index.validation`

Group monitors by `span.name`, `env`, and `sync_size_bucket`. Keep
`environment_id` available for dashboards and trace search, but avoid paging on
one alert instance per environment unless the environment set is small.

Use separate alerts for:

- High p95 latency on each inner span.
- Error rate on each inner span.
- Worker queue age when the async boundary is enabled.
- OOM, container restarts, and object-store error rates from the reliability
  dashboard.

## Measure impact

After applying a mitigation, record the result in the Jira ticket or incident
summary.

Include:

- The dominant phase before the change.
- The p95 root resource latency before and after the change.
- The p95 inner span latency before and after the change.
- The request volume and sync size distribution for both windows.
- Any trade-off, such as higher queue age after moving work async.

Use the same lookback duration before and after the change so the comparison is
stable.

## Escalation

Escalate to the ML infra owner when:

- The dominant phase is unclear because spans are missing.
- The root request approaches the configured HTTP timeout.
- Sync jobs correlate with RL job failures, OOM events, or object-store errors.
- An async worker queue builds up while the root endpoint p95 looks healthy.

Link this runbook from the service on-call page and from alerts for
`/cursor_big_rl/environment/sync_index`.
