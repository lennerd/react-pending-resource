import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
} from 'react';
import ResourceTracker from './ResourceTracker';

const ResourceTrackerContext = createContext(new ResourceTracker());

export default function useResourceTracker(): ResourceTracker {
  return useContext(ResourceTrackerContext);
}

interface ResourceTrackerProviderProps {
  tracker: ResourceTracker;
  children: ReactNode;
}

export function ResourceTrackerProvider({
  tracker,
  children,
}: ResourceTrackerProviderProps): ReactElement {
  return (
    <ResourceTrackerContext.Provider value={tracker}>
      {children}
    </ResourceTrackerContext.Provider>
  );
}
