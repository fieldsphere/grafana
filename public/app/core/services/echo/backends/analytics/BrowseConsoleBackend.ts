import { structuredLog, toLogContextPart } from '@grafana/data';
import {
  type EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  type PageviewEchoEvent,
} from '@grafana/runtime';

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      structuredLog('info', 'EchoSrv pageview', { page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      structuredLog('info', 'EchoSrv interaction event', {
        interactionName: eventName,
        properties: toLogContextPart(e.payload.properties ?? {}),
      });

      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        structuredLog('warn', 'EchoSrv interaction event has invalid property types', {
          interactionName: eventName,
          invalidProperties: Object.fromEntries(invalidTypeProperties),
        });
      }
    }

    if (isExperimentViewEvent(e)) {
      structuredLog('info', 'EchoSrv experiment view', { payload: toLogContextPart(e.payload) });
    }
  };

  flush = () => {};
}
