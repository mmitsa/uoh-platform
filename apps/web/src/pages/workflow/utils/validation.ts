import type { WorkflowStep, WorkflowConnection, ValidationError } from '../types';
import { getStepTypeDef } from '../constants/stepTypes';

export function validateWorkflow(steps: WorkflowStep[], connections: WorkflowConnection[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Must have exactly one initial step
  const initialSteps = steps.filter(s => getStepTypeDef(s.type).isInitial);
  if (initialSteps.length === 0) {
    errors.push({ type: 'error', message: 'workflow.validation.noInitial' });
  } else if (initialSteps.length > 1) {
    errors.push({ type: 'error', message: 'workflow.validation.multipleInitial' });
  }

  // Must have at least one final step
  const finalSteps = steps.filter(s => getStepTypeDef(s.type).isFinal);
  if (finalSteps.length === 0) {
    errors.push({ type: 'error', message: 'workflow.validation.noFinal' });
  }

  // No duplicate state names
  const stateNames = steps.map(s => s.stateName);
  const duplicates = stateNames.filter((name, idx) => stateNames.indexOf(name) !== idx);
  for (const dup of [...new Set(duplicates)]) {
    errors.push({ type: 'error', message: 'workflow.validation.duplicateState', stepId: steps.find(s => s.stateName === dup)?.id });
  }

  // No duplicate transitions (same from + action)
  const transitionKeys = connections.map(c => `${c.fromStepId}:${c.action}`);
  const dupTransitions = transitionKeys.filter((key, idx) => transitionKeys.indexOf(key) !== idx);
  if (dupTransitions.length > 0) {
    errors.push({ type: 'error', message: 'workflow.validation.duplicateTransition' });
  }

  // Every non-final step should have at least one outgoing connection
  for (const step of steps) {
    const def = getStepTypeDef(step.type);
    if (!def.isFinal && !connections.some(c => c.fromStepId === step.id)) {
      errors.push({ type: 'warning', message: 'workflow.validation.noOutgoing', stepId: step.id });
    }
  }

  // Every non-initial step should have at least one incoming connection
  for (const step of steps) {
    const def = getStepTypeDef(step.type);
    if (!def.isInitial && !connections.some(c => c.toStepId === step.id)) {
      errors.push({ type: 'warning', message: 'workflow.validation.noIncoming', stepId: step.id });
    }
  }

  return errors;
}
