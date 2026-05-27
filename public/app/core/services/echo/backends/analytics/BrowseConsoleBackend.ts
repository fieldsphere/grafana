import { createClientLog } from '@grafana/data';
/* eslint-disable no-console */
import {
  type EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  type PageviewEchoEvent,
} from '@grafana/runtime';
const clientLog = createClientLog('public/app/core/services/echo/backends/analytics/BrowseConsoleBackend');



export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      clientLog.info('[EchoSrv:pageview]', e.payload.page);
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      clientLog.info('[EchoSrv:event]', eventName, e.payload.properties);

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        clientLog.warn(
          'Event',
          eventName,
          'has invalid property types. Event properties should only be string, number or boolean. Invalid properties:',
          Object.fromEntries(invalidTypeProperties)
        );
      }
    }

    if (isExperimentViewEvent(e)) {
      clientLog.info('[EchoSrv:experiment]', e.payload);
    }
  };

  flush = () => {};
}
