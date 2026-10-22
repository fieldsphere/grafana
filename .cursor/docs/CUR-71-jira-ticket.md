# CUR-71: feature flags dashboard

## Source

Incoming Jira issue: CUR-71

## Summary

feature flags dashboard

## Specification

Add a Labs section next to the Connections and Administration sections in Grafana. The Labs section should expose a feature flags dashboard where users can see enabled feature flags and control them within the app. The Labs navigation item should include a new label next to its icon.

## Implementation notes

- Add a backend-defined Labs top-level navigation section.
- Add a Feature flags page under Labs.
- Persist feature flag controls using Grafana's existing browser-local `grafana.featureToggles` override format.
- Use Grafana's existing nav `isNew` badge metadata for the requested new label.
