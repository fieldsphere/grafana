# Technical specification template (fallback)

Use only if Confluence cannot be read. Prefer `getConfluencePage` on the live **Template** page under **Technical Specifications**.

**Demo site template URL (example):** `https://fe-anysphere-demo.atlassian.net/wiki/spaces/GRAFANA/pages/80904198/Template`

---

## Template markdown (copy)

```markdown
# [Feature or system name]

| Field | Value |
| --- | --- |
| **Status** | Draft | In review | Approved | Superseded |
| **Authors** |  |
| **Reviewers** |  |
| **Created** | YYYY-MM-DD |
| **Last updated** | YYYY-MM-DD |
| **Related** | Links to RFCs, design docs, tickets, ADRs |

---

## 1. Summary

One short paragraph: what we are building or changing and why it matters.

---

## 2. Problem statement

* **Current state:** What exists today and what hurts (users, operators, cost, risk).
* **Desired state:** What "good" looks like after this work.

---

## 3. Goals and non-goals

### Goals

* …

### Non-goals

* … (explicitly out of scope to prevent scope creep)

---

## 4. Users and stakeholders

| Role | Needs |
| --- | --- |
| e.g. End user / Admin / SRE | … |

---

## 5. Requirements

### Functional

| ID | Requirement | Priority (Must / Should / Could) |
| --- | --- | --- |
| F-1 | … |  |

### Non-functional

| ID | Requirement | Target / measurement |
| --- | --- | --- |
| N-1 | Performance, availability, scale, … |  |
| N-2 | Security, compliance, … |  |
| N-3 | Observability (metrics, logs, traces) |  |

---

## 6. Proposed design

### 6.1 Overview

High-level approach: main components, data flow, and how this fits existing systems.

### 6.2 Architecture

Optional diagram (link or embed). Describe boundaries between services, processes, or packages.

### 6.3 Key decisions

| Decision | Options considered | Choice | Rationale |
| --- | --- | --- | --- |
|  |  |  |  |

---

## 7. Interfaces and contracts

### APIs

* Endpoints, protocols, versioning, auth, rate limits.

### Events / messages

* Topics, schemas, ordering, idempotency, failure handling.

### Configuration

* New settings, defaults, feature flags, migration of old config.

---

## 8. Data model and storage

* Entities, relationships, retention, migrations, backward compatibility.

---

## 9. Security and privacy

* Threat model summary, authZ/authN, secrets, PII, audit logging.

---

## 10. Reliability and operations

* Failure modes, retries, timeouts, degradation, runbooks, SLOs if applicable.

---

## 11. Rollout and migration

* Phases, feature flags, dual-write / backfill, rollback plan, communication.

---

## 12. Testing strategy

* Unit, integration, E2E, load; what must pass before release.

---

## 13. Open questions

| # | Question | Owner | Resolution |
| --- | --- | --- | --- |
| 1 |  |  |  |

---

## 14. Appendix

* Glossary, references, prior art, alternatives rejected.
```

**Parent page title in tree:** Technical Specifications (child: Template). New specs normally sit as **siblings** of Template under that parent.
