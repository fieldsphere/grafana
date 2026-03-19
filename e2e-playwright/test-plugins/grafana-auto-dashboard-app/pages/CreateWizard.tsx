import { useMemo, useState } from 'react';

import { DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv, getDataSourceSrv, locationService } from '@grafana/runtime';
import {
  Alert,
  Button,
  Field,
  Input,
  Stack,
  TextArea,
  Spinner,
  Text,
} from '@grafana/ui';

import { specToDashboard } from '../src/mapper/specToDashboard';
import type { DashboardSpec } from '../src/spec/types';
import pluginJson from '../plugin.json';

export function CreateWizard() {
  const [folderUid, setFolderUid] = useState('');
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedDs, setSelectedDs] = useState<DataSourceInstanceSettings | undefined>(undefined);
  const [specJson, setSpecJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const prometheusList = useMemo(() => {
    return getDataSourceSrv()
      .getList()
      .filter((d) => d.type === 'prometheus');
  }, []);

  const datasourceTypes = useMemo(() => {
    if (!selectedDs?.uid) {
      return {};
    }
    return { [selectedDs.uid]: selectedDs.type };
  }, [selectedDs]);

  const generate = async () => {
    setError(null);
    setSaveMsg(null);
    if (!selectedDs?.uid) {
      setError('Select a Prometheus datasource.');
      return;
    }
    if (!prompt.trim()) {
      setError('Enter a description of the dashboard you want.');
      return;
    }
    setLoading(true);
    try {
      const res = await getBackendSrv().post<{ spec: DashboardSpec; error?: string }>(
        `/api/plugins/${pluginJson.id}/resources/generate`,
        {
          prompt: prompt.trim(),
          datasources: [
            {
              uid: selectedDs.uid,
              type: selectedDs.type,
              name: selectedDs.name,
            },
          ],
          maxPanels: 12,
        },
        { validatePath: true }
      );
      if ((res as { error?: string }).error) {
        setError((res as { error: string }).error);
        return;
      }
      const spec = (res as { spec: DashboardSpec }).spec;
      setSpecJson(JSON.stringify(spec, null, 2));
    } catch (e: unknown) {
      const data = (e as { data?: { error?: string; message?: string } })?.data;
      setError(data?.error || data?.message || (e instanceof Error ? e.message : 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  const applySpecToPreview = (): DashboardSpec | null => {
    try {
      return JSON.parse(specJson) as DashboardSpec;
    } catch {
      setError('Spec JSON is invalid.');
      return null;
    }
  };

  const saveDashboard = async () => {
    setError(null);
    setSaveMsg(null);
    const spec = applySpecToPreview();
    if (!spec) {
      return;
    }
    if (!selectedDs?.uid) {
      setError('Select a Prometheus datasource.');
      return;
    }
    try {
      const dash = specToDashboard(spec, datasourceTypes);
      if (dashboardTitle.trim()) {
        dash.title = dashboardTitle.trim();
      }
      const res = await getBackendSrv().post<{ uid: string; url: string }>(
        '/api/dashboards/db/',
        {
          dashboard: dash,
          message: 'Created by Auto Dashboard Creator',
          overwrite: false,
          folderUid: folderUid.trim() || undefined,
        },
        { validatePath: true }
      );
      setSaveMsg('Dashboard saved.');
      if (res.url) {
        locationService.push(res.url);
      }
    } catch (e: unknown) {
      const data = (e as { data?: { message?: string } })?.data;
      setError(data?.message || (e instanceof Error ? e.message : 'Save failed'));
    }
  };

  return (
    <Stack direction="column" gap={2}>
      <Text element="h1" variant="h3">
        Auto Dashboard Creator
      </Text>
      <Text color="secondary">
        Describe the dashboard in natural language. The backend returns a validated JSON spec, then maps it to Grafana
        panels (Prometheus).
      </Text>

      {error && (
        <Alert title="Error" severity="error">
          {error}
        </Alert>
      )}
      {saveMsg && (
        <Alert title="Done" severity="success">
          {saveMsg}
        </Alert>
      )}

      <Field label="Prometheus datasource" required>
        <select
          className="gf-form-input"
          value={selectedDs?.uid ?? ''}
          onChange={(ev) => {
            const uid = ev.target.value;
            setSelectedDs(prometheusList.find((d) => d.uid === uid));
          }}
          style={{ maxWidth: 480 }}
        >
          <option value="">— Select —</option>
          {prometheusList.map((d) => (
            <option key={d.uid} value={d.uid}>
              {d.name} ({d.uid})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Folder UID (optional)" description="Leave empty for General.">
        <Input width={40} value={folderUid} onChange={(e) => setFolderUid(e.currentTarget.value)} />
      </Field>

      <Field label="Dashboard title override (optional)" description="If empty, the spec title is used after generate.">
        <Input width={60} value={dashboardTitle} onChange={(e) => setDashboardTitle(e.currentTarget.value)} />
      </Field>

      <Field label="What should this dashboard show?" required>
        <TextArea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          placeholder="e.g. Golden signals for the checkout API: RPS, latency p95, error rate, saturation"
        />
      </Field>

      <Stack direction="row" gap={2}>
        <Button variant="primary" onClick={generate} disabled={loading}>
          {loading && <Spinner inline size="sm" />}
          Generate spec
        </Button>
        <Button variant="secondary" onClick={saveDashboard} disabled={!specJson.trim()}>
          Save dashboard
        </Button>
      </Stack>

      <Field label="Dashboard spec (JSON)" description="Edit before saving if needed.">
        <TextArea rows={16} value={specJson} onChange={(e) => setSpecJson(e.currentTarget.value)} />
      </Field>
    </Stack>
  );
}
