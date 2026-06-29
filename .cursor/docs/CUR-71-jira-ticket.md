# CUR-71 Jira ticket

Summary: feature flags dashboard

Specification source: the automation payload summary field.

Implementation notes:

- Add a Labs section to Grafana navigation.
- Add a Feature flags dashboard under Labs.
- Show enabled feature flags and browser-local overrides.
- Allow admins with settings read access to add, toggle, reset, and clear local feature flag overrides.
- Save overrides using Grafana's existing `grafana.featureToggles` browser storage format.
