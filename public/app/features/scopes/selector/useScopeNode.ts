import { useEffect, useState } from 'react';

import { ScopeNode } from '@grafana/data';

import { useScopesServices } from '../ScopesContextProvider';

// Light wrapper around the scopesSelectorService.getScopeNode to make it easier to use in the UI.
export function useScopeNode(scopeNodeId?: string) {
  const [node, setNode] = useState<ScopeNode | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const scopesSelectorService = useScopesServices()?.scopesSelectorService;

  useEffect(() => {
    const loadNode = async () => {
      if (!scopeNodeId || !scopesSelectorService) {
        setNode(undefined);
        return;
      }
      setIsLoading(true);
      try {
        const node = await scopesSelectorService.getScopeNode(scopeNodeId);
        setNode(node);
      } catch (error) {
        Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'error'), console, [{ timestamp: new Date().toISOString(), level: 'error', source: 'public/app/features/scopes/selector/useScopeNode.ts', args: ['Failed to load node', error] }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadNode();
  }, [scopeNodeId, scopesSelectorService]);

  return { node, isLoading };
}
