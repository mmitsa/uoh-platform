import { useCallback, useRef, useState } from 'react';
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useBuilderContext } from '../context/WorkflowBuilderContext';
import { BuilderToolbar } from './BuilderToolbar';
import { StepPalette } from './StepPalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { TransitionPanel } from './TransitionPanel';
import { ValidationPanel } from './ValidationPanel';
import { createStepFromType } from '../reducer/builderReducer';
import { validateWorkflow } from '../utils/validation';
import { serializeToBackend, serializeMetadata } from '../utils/serializer';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui';

interface WorkflowBuilderProps {
  onBack: () => void;
}

export function WorkflowBuilder({ onBack }: WorkflowBuilderProps) {
  const { state, dispatch } = useBuilderContext();
  const { post, put } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'palette-item') {
      setDraggedType(data.stepType as string);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedType(null);
    const data = event.active.data.current;

    if (data?.type === 'palette-item' && event.over?.id === 'workflow-canvas') {
      const stepType = data.stepType as string;

      // Find the actual scrollable canvas element
      const canvas = canvasRef.current?.querySelector<HTMLDivElement>('[data-canvas-scroll]');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft;
      const scrollTop = canvas.scrollTop;

      // Calculate visible area in canvas-local coordinates (pre-zoom)
      const NODE_W = 200;
      const NODE_H = 100;
      const PAD = 40;
      const visLeft = (scrollLeft - state.panOffset.x) / state.zoom;
      const visTop = (scrollTop - state.panOffset.y) / state.zoom;
      const visW = rect.width / state.zoom;
      const visH = rect.height / state.zoom;

      let x: number;
      let y: number;

      if (event.active.rect.current.translated?.left != null) {
        // Position from actual drop point
        x = (event.active.rect.current.translated.left - rect.left + scrollLeft - state.panOffset.x) / state.zoom;
        y = (event.active.rect.current.translated.top - rect.top + scrollTop - state.panOffset.y) / state.zoom;
      } else {
        // Fallback: center of visible area
        x = visLeft + visW / 2 - NODE_W / 2;
        y = visTop + visH / 2 - NODE_H / 2;
      }

      // Clamp so the entire node stays within the visible viewport
      x = Math.max(visLeft + PAD, Math.min(x, visLeft + visW - NODE_W - PAD));
      y = Math.max(visTop + PAD, Math.min(y, visTop + visH - NODE_H - PAD));

      const step = createStepFromType(stepType, { x: Math.round(x), y: Math.round(y) });
      dispatch({ type: 'ADD_STEP', payload: { step } });

      // Auto-scroll the canvas so the new step is centered
      requestAnimationFrame(() => {
        const targetScrollLeft = (step.position.x * state.zoom + state.panOffset.x) - rect.width / 2 + (NODE_W * state.zoom) / 2;
        const targetScrollTop = (step.position.y * state.zoom + state.panOffset.y) - rect.height / 2 + (NODE_H * state.zoom) / 2;
        canvas.scrollTo({ left: targetScrollLeft, top: targetScrollTop, behavior: 'smooth' });
      });
    }
  }, [dispatch, state.zoom, state.panOffset]);

  const handleSave = useCallback(async () => {
    const errors = validateWorkflow(state.steps, state.connections);
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });

    if (errors.some(e => e.type === 'error')) {
      toast.error(t('workflow.fixErrors'));
      return;
    }

    setSaving(true);
    try {
      const definition = serializeToBackend(state.steps, state.connections);
      const builderMetadataJson = serializeMetadata(state.steps, state.connections);

      if (state.metadata.id) {
        await put(`/api/v1/workflow/templates/${state.metadata.id}`, {
          name: state.metadata.name,
          domain: state.metadata.domain,
          definition,
          builderMetadataJson,
        });
      } else {
        const result = await post<{ id: string }>('/api/v1/workflow/templates', {
          name: state.metadata.name,
          domain: state.metadata.domain,
          definition,
          builderMetadataJson,
        });
        dispatch({ type: 'SET_METADATA', payload: { id: result.id } });
      }
      dispatch({ type: 'MARK_SAVED' });
      toast.success(t('workflow.saved'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }, [state, dispatch, post, put, t, toast]);

  return (
    <div className="flex h-full flex-col">
      <BuilderToolbar onBack={onBack} onSave={handleSave} saving={saving} />

      <div className="flex flex-1 overflow-hidden" ref={canvasRef}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <StepPalette />
          <WorkflowCanvas />
          <DragOverlay>
            {draggedType && (
              <div className="rounded-lg border-2 border-dashed border-brand-400 bg-neutral-0 px-4 py-2 text-sm font-medium shadow-lg opacity-80">
                {draggedType}
              </div>
            )}
          </DragOverlay>
        </DndContext>
        <TransitionPanel />
      </div>

      <ValidationPanel />
    </div>
  );
}
