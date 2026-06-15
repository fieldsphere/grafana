import { type Location } from '@remix-run/router';
import { useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

interface PromptProps {
  when?: boolean;
  message: string | ((location: Location) => string | boolean);
}

export const Prompt = ({ message, when = true }: PromptProps) => {
  const shouldBlock = useCallback(
    ({ nextLocation }: { currentLocation: Location; nextLocation: Location }) => {
      if (!when) {
        return false;
      }

      if (typeof message === 'string') {
        return !window.confirm(message);
      }

      const result = message(nextLocation);

      if (typeof result === 'string') {
        return !window.confirm(result);
      }

      // history.block returned false to block navigation; useBlocker returns true to block.
      return result === false;
    },
    [when, message]
  );

  useBlocker(shouldBlock);

  return null;
};
