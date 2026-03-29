export interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  stateName: string;
  position: { x: number; y: number };
  config: {
    requiredRole?: string;
    description?: string;
    slaHours?: number;
  };
}

export interface WorkflowConnection {
  id: string;
  fromStepId: string;
  toStepId: string;
  action: string;
  requiredRole: string | null;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  stepId?: string;
}

export interface PendingConnection {
  fromStepId: string;
  toStepId: string;
}

export interface WorkflowBuilderState {
  metadata: {
    id: string | null;
    name: string;
    domain: string;
  };
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  selectedStepId: string | null;
  selectedConnectionId: string | null;
  connectingFrom: string | null;
  pendingConnection: PendingConnection | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  zoom: number;
  panOffset: { x: number; y: number };
}

export type StepType =
  | 'initial'
  | 'finalApproved'
  | 'finalRejected'
  | 'singleApproval'
  | 'headApproval'
  | 'secretaryApproval'
  | 'review'
  | 'notify'
  | 'condition';

export interface StepTypeDefinition {
  type: StepType;
  labelAr: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultStateName: string;
  defaultRole?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  group: 'start_end' | 'approval' | 'review' | 'actions';
}

export interface PaletteGroup {
  key: string;
  labelAr: string;
  labelEn: string;
  items: StepTypeDefinition[];
}

// Backend API types
export interface BackendTransition {
  action: string;
  from: string;
  to: string;
  requiredRole: string | null;
}

export interface BackendDefinition {
  initialState: string;
  transitions: BackendTransition[];
}

export interface BackendTemplate {
  id: string;
  name: string;
  domain: string;
  definitionJson: string;
  builderMetadataJson?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}
