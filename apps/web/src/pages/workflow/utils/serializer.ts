import type { WorkflowStep, WorkflowConnection, BackendDefinition, BackendTemplate, WorkflowBuilderState } from '../types';
import { getStepTypeDef, STEP_TYPES } from '../constants/stepTypes';
import { generateId } from '../reducer/builderReducer';
import type { StepType } from '../types';

/** Convert builder state → backend API payload */
export function serializeToBackend(steps: WorkflowStep[], connections: WorkflowConnection[]): BackendDefinition {
  const initialStep = steps.find(s => getStepTypeDef(s.type).isInitial);
  const initialState = initialStep?.stateName ?? 'draft';

  const transitions = connections.map(conn => {
    const fromStep = steps.find(s => s.id === conn.fromStepId);
    const toStep = steps.find(s => s.id === conn.toStepId);
    return {
      action: conn.action,
      from: fromStep?.stateName ?? '',
      to: toStep?.stateName ?? '',
      requiredRole: conn.requiredRole,
    };
  });

  return { initialState, transitions };
}

/** Convert builder state → metadata JSON for visual positions */
export function serializeMetadata(steps: WorkflowStep[], connections: WorkflowConnection[]): string {
  return JSON.stringify({ steps, connections });
}

/** Deserialize backend template → builder state */
export function deserializeTemplate(template: BackendTemplate): WorkflowBuilderState {
  // Try to use saved builder metadata first
  if (template.builderMetadataJson) {
    try {
      const meta = JSON.parse(template.builderMetadataJson) as { steps: WorkflowStep[]; connections: WorkflowConnection[] };
      if (meta.steps && meta.connections) {
        return {
          metadata: { id: template.id, name: template.name, domain: template.domain },
          steps: meta.steps,
          connections: meta.connections,
          selectedStepId: null,
          selectedConnectionId: null,
          connectingFrom: null,
          pendingConnection: null,
          isDirty: false,
          validationErrors: [],
          zoom: 1,
          panOffset: { x: 0, y: 0 },
        };
      }
    } catch { /* fall through to auto-layout */ }
  }

  // Auto-layout from definition
  const def: BackendDefinition = JSON.parse(template.definitionJson);
  return autoLayoutFromDefinition(def, template);
}

function autoLayoutFromDefinition(def: BackendDefinition, template: BackendTemplate): WorkflowBuilderState {
  // Collect unique states
  const stateSet = new Set<string>();
  stateSet.add(def.initialState);
  for (const t of def.transitions) {
    stateSet.add(t.from);
    stateSet.add(t.to);
  }

  // Find final states (states that have no outgoing transitions)
  const statesWithOutgoing = new Set(def.transitions.map(t => t.from));
  const finalStates = [...stateSet].filter(s => !statesWithOutgoing.has(s) && s !== def.initialState);

  // Create steps with auto-layout (vertical)
  const orderedStates = [def.initialState, ...[...stateSet].filter(s => s !== def.initialState && !finalStates.includes(s)), ...finalStates];
  const steps: WorkflowStep[] = orderedStates.map((stateName, idx) => {
    let type: StepType = 'singleApproval';
    if (stateName === def.initialState) type = 'initial';
    else if (finalStates.includes(stateName)) {
      type = stateName.toLowerCase().includes('reject') ? 'finalRejected' : 'finalApproved';
    } else if (stateName.toLowerCase().includes('review')) type = 'review';
    else if (stateName.toLowerCase().includes('head')) type = 'headApproval';
    else if (stateName.toLowerCase().includes('secretary')) type = 'secretaryApproval';

    const stepDef = STEP_TYPES.find(s => s.type === type) ?? STEP_TYPES[0];

    return {
      id: generateId(),
      type,
      label: stateName,
      stateName,
      position: { x: 300, y: 80 + idx * 140 },
      config: {
        requiredRole: stepDef.defaultRole,
      },
    };
  });

  // Create connections from transitions
  const connections: WorkflowConnection[] = def.transitions.map(t => {
    const fromStep = steps.find(s => s.stateName === t.from);
    const toStep = steps.find(s => s.stateName === t.to);
    return {
      id: generateId(),
      fromStepId: fromStep?.id ?? '',
      toStepId: toStep?.id ?? '',
      action: t.action,
      requiredRole: t.requiredRole,
    };
  });

  return {
    metadata: { id: template.id, name: template.name, domain: template.domain },
    steps,
    connections,
    selectedStepId: null,
    selectedConnectionId: null,
    connectingFrom: null,
    pendingConnection: null,
    isDirty: false,
    validationErrors: [],
    zoom: 1,
    panOffset: { x: 0, y: 0 },
  };
}
