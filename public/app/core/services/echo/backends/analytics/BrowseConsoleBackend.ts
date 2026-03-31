import {
  createMonitoringLogger,
  EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  PageviewEchoEvent,
} from '@grafana/runtime';

const browseConsoleLogger = createMonitoringLogger('EchoSrv.BrowseConsole');

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      browseConsoleLogger.logInfo('Echo pageview', { page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      browseConsoleLogger.logInfo('Echo interaction', {
        eventName,
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
        browseConsoleLogger.logWarning(
          'Event has invalid property types; properties should be string, number, boolean, or undefined',
          {
            eventName,
            invalidProperties: Object.fromEntries(invalidTypeProperties),
          }
        );
      }
    }

    if (isExperimentViewEvent(e)) {
      browseConsoleLogger.logInfo('Echo experiment view', { payload: e.payload });
    }
  };

  flush = () => {};
}
