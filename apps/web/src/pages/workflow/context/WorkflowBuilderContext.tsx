import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { builderReducer, initialBuilderState, type BuilderAction } from '../reducer/builderReducer';
import type { WorkflowBuilderState } from '../types';

interface WorkflowBuilderContextValue {
  state: WorkflowBuilderState;
  dispatch: Dispatch<BuilderAction>;
}

const WorkflowBuilderContext = createContext<WorkflowBuilderContextValue | null>(null);

export function WorkflowBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);

  return (
    <WorkflowBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowBuilderContext.Provider>
  );
}

export function useBuilderContext(): WorkflowBuilderContextValue {
  const ctx = useContext(WorkflowBuilderContext);
  if (!ctx) throw new Error('useBuilderContext must be used within WorkflowBuilderProvider');
  return ctx;
}
