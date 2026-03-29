import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getStepTypeDef } from '../constants/stepTypes';
import { useBuilderContext } from '../context/WorkflowBuilderContext';
import type { WorkflowStep } from '../types';

interface StepNodeProps {
  step: WorkflowStep;
  zoom: number;
}

export function StepNode({ step, zoom }: StepNodeProps) {
  const { i18n } = useTranslation();
  const { state, dispatch } = useBuilderContext();
  const def = getStepTypeDef(step.type);
  const isSelected = state.selectedStepId === step.id;
  const isConnecting = state.connectingFrom !== null;
  const isConnectingFrom = state.connectingFrom === step.id;
  const isAr = i18n.language === 'ar';

  const dragRef = useRef<{ startX: number; startY: number; stepX: number; stepY: number; moved: boolean } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || isConnecting) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      stepX: step.position.x,
      stepY: step.position.y,
      moved: false,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }
      if (dragRef.current.moved) {
        // Clamp within canvas bounds (0 to reasonable max)
        const MAX_X = 3000;
        const MAX_Y = 3000;
        dispatch({
          type: 'MOVE_STEP',
          payload: {
            id: step.id,
            position: {
              x: Math.max(0, Math.min(MAX_X, Math.round(dragRef.current.stepX + dx))),
              y: Math.max(0, Math.min(MAX_Y, Math.round(dragRef.current.stepY + dy))),
            },
          },
        });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const wasDrag = dragRef.current?.moved ?? false;
      dragRef.current = null;
      if (!wasDrag) {
        dispatch({ type: 'SELECT_STEP', payload: { id: step.id } });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [step.id, step.position, zoom, isConnecting, dispatch]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.connectingFrom && state.connectingFrom !== step.id) {
      dispatch({
        type: 'PENDING_CONNECTION',
        payload: { toStepId: step.id },
      });
    }
  };

  const handleConnectStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!def.isFinal) {
      dispatch({ type: 'START_CONNECTING', payload: { fromStepId: step.id } });
    }
  };

  return (
    <div
      className={[
        'absolute select-none rounded-xl border-2 bg-neutral-0 shadow-md transition-shadow w-[200px]',
        isSelected ? 'ring-2 ring-brand-400 shadow-lg' : '',
        isConnecting && !isConnectingFrom ? 'ring-2 ring-dashed ring-blue-300 cursor-pointer' : 'cursor-grab',
        isConnectingFrom ? 'ring-2 ring-blue-500' : '',
        def.borderColor,
      ].join(' ')}
      data-step-id={step.id}
      style={{ left: step.position.x, top: step.position.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Top connection handle (incoming) */}
      {!def.isInitial && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-neutral-300 bg-neutral-0 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" />
      )}

      {/* Node body */}
      <div className={`rounded-t-[10px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${def.bgColor} ${def.color}`}>
        {isAr ? def.labelAr : def.labelEn}
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-neutral-800 truncate">{step.label}</p>
        <p className="mt-0.5 text-[11px] text-neutral-400 font-mono">{step.stateName}</p>
        {step.config.requiredRole && (
          <span className="mt-1 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
            {step.config.requiredRole}
          </span>
        )}
        {step.config.description && (
          <p className="mt-1 text-[10px] text-neutral-400 truncate">{step.config.description}</p>
        )}
      </div>

      {/* Bottom connection handle (outgoing) */}
      {!def.isFinal && (
        <button
          type="button"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-neutral-300 bg-neutral-0 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors z-10"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleConnectStart}
          title={isAr ? 'إنشاء اتصال' : 'Create connection'}
        />
      )}
    </div>
  );
}
