import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
} from 'react';
import ResourceCache from './ResourceCache';

const ResourceCacheContext = createContext(new ResourceCache());

export default function useResourceCache(): ResourceCache {
  return useContext(ResourceCacheContext);
}

interface ResourceCacheProviderProps {
  cache: ResourceCache;
  children: ReactNode;
}

export function ResourceCacheProvider({
  cache,
  children,
}: ResourceCacheProviderProps): ReactElement {
  return (
    <ResourceCacheContext.Provider value={cache}>
      {children}
    </ResourceCacheContext.Provider>
  );
}
