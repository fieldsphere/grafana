/* eslint-disable no-console */
import {
  type EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  type PageviewEchoEvent,
  grafanaStructuredLogger,
} from '@grafana/runtime';

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      grafanaStructuredLogger.logInfo('[EchoSrv:pageview]', { page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      grafanaStructuredLogger.logInfo('[EchoSrv:event]', {
        interactionName: eventName,
        properties: e.payload.properties,
      });

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        grafanaStructuredLogger.logWarning('Event interaction has invalid property types', {
          interactionName: eventName,
          detail:
            'Event properties should only be string, number or boolean. Invalid properties are listed in invalidProperties.',
          invalidProperties: Object.fromEntries(invalidTypeProperties),
        });
      }
    }

    if (isExperimentViewEvent(e)) {
      grafanaStructuredLogger.logInfo('[EchoSrv:experiment]', { payload: e.payload });
    }
  };

  flush = () => {};
}
