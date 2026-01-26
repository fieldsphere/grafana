import { useMemo } from 'react';

import { LiveChannelAddress, isValidLiveChannelAddress } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { createMonitoringLogger, getBackendSrv, getGrafanaLiveSrv } from '@grafana/runtime';
import { Button, CodeEditor, createLogger } from '@grafana/ui';

import { MessagePublishMode } from './types';

const livePublishLogger = createMonitoringLogger('plugins.panel.live');
const livePublishDebugLogger = createLogger('plugins.panel.live');

interface Props {
  height: number;
  addr?: LiveChannelAddress;
  mode: MessagePublishMode;
  body?: string | object;
  onSave: (v: string | object) => void;
}

export function LivePublish({ height, mode, body, addr, onSave }: Props) {
  const txt = useMemo(() => {
    if (mode === MessagePublishMode.JSON) {
      return body ? JSON.stringify(body, null, 2) : '{ }';
    }
    return body == null ? '' : `${body}`;
  }, [mode, body]);

  const doSave = (v: string) => {
    if (mode === MessagePublishMode.JSON) {
      onSave(JSON.parse(v));
    } else {
      onSave(v);
    }
  };

  const onPublishClicked = async () => {
    if (mode === MessagePublishMode.Influx) {
      if (addr?.scope !== 'stream') {
        alert('expected stream scope!');
        livePublishLogger.logWarning('Invalid live publish scope', {
          channel: addr,
        });
        return;
      }
      return getBackendSrv().post(`api/live/push/${addr.namespace}`, body);
    }

    if (!isValidLiveChannelAddress(addr)) {
      alert('invalid address');
      livePublishLogger.logWarning('Invalid live publish address', {
        channel: addr,
      });
      return;
    }

    const rsp = await getGrafanaLiveSrv().publish(addr, body);
    livePublishDebugLogger.logger('publish-response', false, { response: rsp, channel: addr });
  };

  return (
    <>
      <CodeEditor
        height={height - 32}
        language={mode === MessagePublishMode.JSON ? 'json' : 'text'}
        value={txt}
        onBlur={doSave}
        onSave={doSave}
        showMiniMap={false}
        showLineNumbers={true}
      />
      <div style={{ height: 32 }}>
        <Button onClick={onPublishClicked}>
          <Trans i18nKey="live.live-publish.publish">Publish</Trans>
        </Button>
      </div>
    </>
  );
}
