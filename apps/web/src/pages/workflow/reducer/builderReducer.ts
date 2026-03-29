import type { WorkflowBuilderState, WorkflowStep, WorkflowConnection, ValidationError } from '../types';
import { getStepTypeDef } from '../constants/stepTypes';

export type BuilderAction =
  | { type: 'SET_METADATA'; payload: Partial<WorkflowBuilderState['metadata']> }
  | { type: 'ADD_STEP'; payload: { step: WorkflowStep } }
  | { type: 'UPDATE_STEP'; payload: { id: string; changes: Partial<WorkflowStep> } }
  | { type: 'MOVE_STEP'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'DELETE_STEP'; payload: { id: string } }
  | { type: 'SELECT_STEP'; payload: { id: string | null } }
  | { type: 'ADD_CONNECTION'; payload: { connection: WorkflowConnection } }
  | { type: 'UPDATE_CONNECTION'; payload: { id: string; changes: Partial<WorkflowConnection> } }
  | { type: 'DELETE_CONNECTION'; payload: { id: string } }
  | { type: 'SELECT_CONNECTION'; payload: { id: string | null } }
  | { type: 'START_CONNECTING'; payload: { fromStepId: string } }
  | { type: 'CANCEL_CONNECTING' }
  | { type: 'PENDING_CONNECTION'; payload: { toStepId: string } }
  | { type: 'CONFIRM_CONNECTION'; payload: { action: string } }
  | { type: 'CANCEL_PENDING_CONNECTION' }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'LOAD_STATE'; payload: WorkflowBuilderState }
  | { type: 'MARK_SAVED' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'AUTO_LAYOUT' };

export const initialBuilderState: WorkflowBuilderState = {
  metadata: { id: null, name: '', domain: 'MOM' },
  steps: [],
  connections: [],
  selectedStepId: null,
  selectedConnectionId: null,
  connectingFrom: null,
  pendingConnection: null,
  isDirty: false,
  validationErrors: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
};

// Undo/redo history
const MAX_HISTORY = 50;
let undoStack: WorkflowBuilderState[] = [];
let redoStack: WorkflowBuilderState[] = [];

function pushUndo(state: WorkflowBuilderState) {
  undoStack.push(JSON.parse(JSON.stringify(state)));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }

export function undo(current: WorkflowBuilderState): WorkflowBuilderState | null {
  const prev = undoStack.pop();
  if (!prev) return null;
  redoStack.push(JSON.parse(JSON.stringify(current)));
  return { ...prev, isDirty: true };
}

export function redo(current: WorkflowBuilderState): WorkflowBuilderState | null {
  const next = redoStack.pop();
  if (!next) return null;
  undoStack.push(JSON.parse(JSON.stringify(current)));
  return { ...next, isDirty: true };
}

export function resetHistory() {
  undoStack = [];
  redoStack = [];
}

const UNDOABLE_ACTIONS = new Set([
  'ADD_STEP', 'DELETE_STEP', 'ADD_CONNECTION', 'DELETE_CONNECTION',
  'UPDATE_STEP', 'UPDATE_CONNECTION', 'CONFIRM_CONNECTION', 'AUTO_LAYOUT',
]);

export function builderReducer(state: WorkflowBuilderState, action: BuilderAction): WorkflowBuilderState {
  if (UNDOABLE_ACTIONS.has(action.type)) {
    pushUndo(state);
  }

  switch (action.type) {
    case 'SET_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.payload }, isDirty: true };

    case 'ADD_STEP': {
      const step = action.payload.step;
      let stateName = step.stateName;
      let suffix = 2;
      while (state.steps.some(s => s.stateName === stateName)) {
        stateName = `${step.stateName}_${suffix}`;
        suffix++;
      }
      return {
        ...state,
        steps: [...state.steps, { ...step, stateName }],
        isDirty: true,
      };
    }

    case 'UPDATE_STEP':
      return {
        ...state,
        steps: state.steps.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.changes } : s,
        ),
        isDirty: true,
      };

    case 'MOVE_STEP':
      return {
        ...state,
        steps: state.steps.map(s =>
          s.id === action.payload.id ? { ...s, position: action.payload.position } : s,
        ),
        isDirty: true,
      };

    case 'DELETE_STEP':
      return {
        ...state,
        steps: state.steps.filter(s => s.id !== action.payload.id),
        connections: state.connections.filter(
          c => c.fromStepId !== action.payload.id && c.toStepId !== action.payload.id,
        ),
        selectedStepId: state.selectedStepId === action.payload.id ? null : state.selectedStepId,
        isDirty: true,
      };

    case 'SELECT_STEP':
      return { ...state, selectedStepId: action.payload.id, selectedConnectionId: null };

    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload.connection],
        connectingFrom: null,
        isDirty: true,
      };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.changes } : c,
        ),
        isDirty: true,
      };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload.id),
        selectedConnectionId: state.selectedConnectionId === action.payload.id ? null : state.selectedConnectionId,
        isDirty: true,
      };

    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload.id, selectedStepId: null };

    case 'START_CONNECTING':
      return { ...state, connectingFrom: action.payload.fromStepId };

    case 'CANCEL_CONNECTING':
      return { ...state, connectingFrom: null };

    case 'PENDING_CONNECTION':
      return {
        ...state,
        pendingConnection: {
          fromStepId: state.connectingFrom!,
          toStepId: action.payload.toStepId,
        },
        connectingFrom: null,
      };

    case 'CONFIRM_CONNECTION': {
      if (!state.pendingConnection) return state;
      const conn: WorkflowConnection = {
        id: `conn_${Date.now()}`,
        fromStepId: state.pendingConnection.fromStepId,
        toStepId: state.pendingConnection.toStepId,
        action: action.payload.action,
        requiredRole: null,
      };
      return {
        ...state,
        connections: [...state.connections, conn],
        pendingConnection: null,
        isDirty: true,
      };
    }

    case 'CANCEL_PENDING_CONNECTION':
      return { ...state, pendingConnection: null };

    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };

    case 'LOAD_STATE':
      resetHistory();
      return {
        ...action.payload,
        pendingConnection: action.payload.pendingConnection ?? null,
        zoom: action.payload.zoom ?? 1,
        panOffset: action.payload.panOffset ?? { x: 0, y: 0 },
        isDirty: false,
        validationErrors: [],
      };

    case 'MARK_SAVED':
      return { ...state, isDirty: false };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(2, Math.max(0.25, action.payload)) };

    case 'SET_PAN':
      return { ...state, panOffset: action.payload };

    case 'AUTO_LAYOUT': {
      if (state.steps.length === 0) return state;
      const initialSteps = state.steps.filter(s => getStepTypeDef(s.type).isInitial);
      const finalSteps = state.steps.filter(s => getStepTypeDef(s.type).isFinal);
      const middleSteps = state.steps.filter(s => !getStepTypeDef(s.type).isInitial && !getStepTypeDef(s.type).isFinal);
      const ordered = [...initialSteps, ...middleSteps, ...finalSteps];
      // Place starting at a visible position with comfortable spacing
      const startX = 80;
      const startY = 60;
      const gapY = 150;
      const layoutSteps = ordered.map((step, idx) => ({
        ...step,
        position: { x: startX, y: startY + idx * gapY },
      }));
      // Reset pan so everything is visible from the top-left
      return { ...state, steps: layoutSteps, panOffset: { x: 0, y: 0 }, zoom: 1, isDirty: true };
    }

    default:
      return state;
  }
}

let _counter = 0;
export function generateId(): string {
  _counter++;
  return `step_${Date.now()}_${_counter}`;
}

export function createStepFromType(type: string, position: { x: number; y: number }): WorkflowStep {
  const def = getStepTypeDef(type);
  return {
    id: generateId(),
    type: def.type,
    label: def.labelEn,
    stateName: def.defaultStateName,
    position,
    config: {
      requiredRole: def.defaultRole,
    },
  };
}
