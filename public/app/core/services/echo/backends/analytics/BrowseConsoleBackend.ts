/* eslint-disable no-console */
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
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'public/app/core/services/echo/backends/analytics/BrowseConsoleBackend.ts', args: ['[EchoSrv:pageview]', e.payload.page] }]);
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'public/app/core/services/echo/backends/analytics/BrowseConsoleBackend.ts', args: ['[EchoSrv:event]', eventName, e.payload.properties] }]);

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'warn'), console, [{ timestamp: new Date().toISOString(), level: 'warn', source: 'public/app/core/services/echo/backends/analytics/BrowseConsoleBackend.ts', args: [
          'Event',
          eventName,
          'has invalid property types. Event properties should only be string, number or boolean. Invalid properties:',
          Object.fromEntries(invalidTypeProperties)
        ] }]);
      }
    }

    if (isExperimentViewEvent(e)) {
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'public/app/core/services/echo/backends/analytics/BrowseConsoleBackend.ts', args: ['[EchoSrv:experiment]', e.payload] }]);
    }
  };

  flush = () => {};
}
