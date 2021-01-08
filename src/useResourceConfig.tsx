import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
} from 'react';

export interface ResourceConfig {
  timeout?: number;
  initialRender?: boolean;
}

const ResourceConfigContext = createContext<ResourceConfig>({});

export default function useResourceConfig(): ResourceConfig {
  return useContext(ResourceConfigContext);
}

interface ResourceConfigProviderProps {
  config: ResourceConfig;
  children: ReactNode;
}

export function ResourceConfigProvider({
  config,
  children,
}: ResourceConfigProviderProps): ReactElement {
  return (
    <ResourceConfigContext.Provider value={config}>
      {children}
    </ResourceConfigContext.Provider>
  );
}
