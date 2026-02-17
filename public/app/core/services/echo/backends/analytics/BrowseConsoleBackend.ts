import {
  createMonitoringLogger,
  EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  PageviewEchoEvent,
} from '@grafana/runtime';

const logger = createMonitoringLogger('core.echo.browser-console-backend');

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      logger.logInfo('Echo pageview event', { operation: 'addEvent', page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      logger.logInfo('Echo interaction event', {
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
        logger.logWarning('Event has invalid property types', {
          operation: 'addEvent',
          eventName,
          invalidProperties: JSON.stringify(Object.fromEntries(invalidTypeProperties)),
        });
      }
    }

    if (isExperimentViewEvent(e)) {
      logger.logInfo('Echo experiment view event', { operation: 'addEvent' });
    }
  };

  flush = () => {};
}
