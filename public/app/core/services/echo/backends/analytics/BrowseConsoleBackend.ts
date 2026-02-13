import {
  EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  PageviewEchoEvent,
} from '@grafana/runtime';

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      console.log('[EchoSrv:pageview]', { operation: 'addEvent', page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      console.log('[EchoSrv:interaction]', {
        operation: 'addEvent',
        eventName,
      });

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        console.warn('[EchoSrv:interaction] Event has invalid property types', {
          operation: 'addEvent',
          eventName,
          invalidProperties: JSON.stringify(Object.fromEntries(invalidTypeProperties)),
        });
      }
    }

    if (isExperimentViewEvent(e)) {
      console.log('[EchoSrv:experiment]', { operation: 'addEvent' });
    }
  };

  flush = () => {};
}
