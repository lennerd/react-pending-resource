import { useEffect, useRef, useState } from 'react';
import isPromise from './utils/isPromise';
import Resource, { ResourceKey } from './Resource';
import useResource from './useResource';
import useResourceConfig, { ResourceConfig } from './useResourceConfig';
import useForceUpdate from './utils/useForceUpdate';

const NO_DATA = Symbol('NO_DATA');

export interface UsePendingResourceOptions<T> extends ResourceConfig {
  initialData?: T;
}

export default function usePendingResource<T = any>(
  resourceOrKey: Resource<T> | ResourceKey,
  options: Omit<UsePendingResourceOptions<T>, 'initialData'> & {
    initialRender: true;
  }
): [T | undefined, boolean];

export default function usePendingResource<T = any>(
  resourceOrKey: Resource<T> | ResourceKey,
  options?: UsePendingResourceOptions<T>
): [T, boolean];

export default function usePendingResource<T = any>(
  resourceOrKey: Resource<T> | ResourceKey,
  options: UsePendingResourceOptions<T> = {}
): [T | undefined, boolean] {
  const { timeToSuspense, initialRender, initialData = NO_DATA } = {
    ...useResourceConfig(),
    ...options,
  };
  const forceUpdate = useForceUpdate();
  const dataRef = useRef(initialData);
  const [shouldSuspense, setSuspense] = useState(false);
  let promise: Promise<any> | undefined;
  let error: any;
  let isPending = false;

  try {
    // Linter is complaining about useResource being called conditionally.
    // This try-catch block is necessary to make sure other hooks are always
    // called and to be able to defer promise suspension.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    dataRef.current = useResource(resourceOrKey);
  } catch (errorOrPromise) {
    if (isPromise(errorOrPromise)) {
      promise = errorOrPromise;
      isPending = true;
    } else {
      error = errorOrPromise;
    }
  }

  // Force rerendering and rereading the resource when promise was resolved.
  usePromise(promise, forceUpdate);

  // If a valid timeToSuspense was set, wait for given seconds to rerender component and let react suspense handle the promise.
  useTimeout(promise && timeToSuspense, setSuspense);

  // Throw error or promise, if timed out or no initial data was provided and initial render is disabled
  if (
    error != null ||
    (promise != null &&
      (shouldSuspense || (dataRef.current === NO_DATA && !initialRender)))
  ) {
    throw error ?? promise;
  }

  return [dataRef.current !== NO_DATA ? dataRef.current : undefined, isPending];
}

function usePromise<T>(
  promise: Promise<T> | undefined,
  callback: (data: T) => void
): void {
  useEffect(() => {
    if (promise == null) {
      return;
    }

    let cancel = false;

    promise.then(data => {
      if (!cancel) {
        callback(data);
      }
    });

    return () => {
      cancel = true;
    };
  }, [promise, callback]);
}

function useTimeout(
  timeout: number | undefined,
  callback: (timedOut: boolean) => void
): void {
  useEffect(() => {
    if (timeout == null || timeout < 0) {
      callback(false);

      return;
    }

    const timeoutRef = setTimeout(() => {
      callback(true);
    }, timeout);

    return () => {
      clearTimeout(timeoutRef);
    };
  }, [timeout, callback]);
}
