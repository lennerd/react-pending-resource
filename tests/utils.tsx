import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import {
  ResourceCache,
  ResourceCacheProvider,
  ResourceConfig,
  ResourceConfigProvider,
} from '../src';

export function renderResourceHook<P, R>(
  callback: (props: P) => R,
  {
    config = {},
    cache = new ResourceCache(),
    initialProps,
  }: {
    config?: ResourceConfig;
    cache?: ResourceCache;
    initialProps?: P;
  } = {}
) {
  return {
    ...renderHook(callback, {
      wrapper: ({ children }: { children?: React.ReactNode }) => {
        return (
          <ResourceConfigProvider config={config}>
            <ResourceCacheProvider cache={cache}>
              {children}
            </ResourceCacheProvider>
          </ResourceConfigProvider>
        );
      },
      initialProps,
    }),
    cache,
    config,
  };
}

export function resolveAfter<T>(value: T, delay: number) {
  return new Promise<T>(resolve => setTimeout(() => resolve(value), delay));
}

export function rejectAfter(error: any, delay: number) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(error), delay)
  );
}
