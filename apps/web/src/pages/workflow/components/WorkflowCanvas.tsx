import { useCallback, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useBuilderContext } from '../context/WorkflowBuilderContext';
import { StepNode } from './StepNode';
import { ConnectionOverlay } from './ConnectionOverlay';
import { Input, Button } from '../../../components/ui';

export function WorkflowCanvas() {
  const { state, dispatch } = useBuilderContext();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const { setNodeRef } = useDroppable({ id: 'workflow-canvas' });
  const [actionName, setActionName] = useState('');

  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const handleCanvasClick = useCallback(() => {
    if (state.connectingFrom) {
      dispatch({ type: 'CANCEL_CONNECTING' });
    } else {
      dispatch({ type: 'SELECT_STEP', payload: { id: null } });
      dispatch({ type: 'SELECT_CONNECTION', payload: { id: null } });
    }
  }, [state.connectingFrom, dispatch]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      dispatch({ type: 'SET_ZOOM', payload: state.zoom + delta });
    }
  }, [state.zoom, dispatch]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: state.panOffset.x,
        panY: state.panOffset.y,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!panRef.current) return;
        dispatch({
          type: 'SET_PAN',
          payload: {
            x: panRef.current.panX + (ev.clientX - panRef.current.startX),
            y: panRef.current.panY + (ev.clientY - panRef.current.startY),
          },
        });
      };

      const handleMouseUp = () => {
        panRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }, [state.panOffset, dispatch]);

  const handleConfirmConnection = () => {
    const name = actionName.trim();
    if (name) {
      dispatch({ type: 'CONFIRM_CONNECTION', payload: { action: name } });
      setActionName('');
    }
  };

  const handleCancelConnection = () => {
    dispatch({ type: 'CANCEL_PENDING_CONNECTION' });
    setActionName('');
  };

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [setNodeRef],
  );

  return (
    <div
      ref={setRefs}
      data-canvas-scroll
      className={[
        'relative flex-1 overflow-auto bg-[#fafbfc]',
        state.connectingFrom ? 'cursor-crosshair' : '',
      ].join(' ')}
      style={{
        backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
        backgroundSize: `${24 * state.zoom}px ${24 * state.zoom}px`,
      }}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          transform: `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoom})`,
          transformOrigin: '0 0',
          minWidth: 2000,
          minHeight: 1500,
        }}
      >
        <ConnectionOverlay />
        {state.steps.map(step => (
          <StepNode key={step.id} step={step} zoom={state.zoom} />
        ))}
      </div>

      {/* Empty state */}
      {state.steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-500">
              {isAr ? 'اسحب العناصر من اللوحة لبدء البناء' : 'Drag elements from the palette to start building'}
            </p>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 start-3 flex items-center gap-1 rounded-lg bg-neutral-0/90 border border-neutral-200 px-2 py-1 text-xs text-neutral-500 backdrop-blur-sm">
        <button
          type="button"
          className="hover:text-neutral-800 px-1"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ZOOM', payload: state.zoom - 0.1 }); }}
        >
          −
        </button>
        <span className="min-w-[3ch] text-center font-mono">{Math.round(state.zoom * 100)}%</span>
        <button
          type="button"
          className="hover:text-neutral-800 px-1"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ZOOM', payload: state.zoom + 0.1 }); }}
        >
          +
        </button>
        <span className="mx-1 h-3 w-px bg-neutral-300" />
        <button
          type="button"
          className="hover:text-neutral-800 px-1"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ZOOM', payload: 1 }); dispatch({ type: 'SET_PAN', payload: { x: 0, y: 0 } }); }}
        >
          {isAr ? 'إعادة' : 'Reset'}
        </button>
      </div>

      {/* Pending connection action name dialog */}
      {state.pendingConnection && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={handleCancelConnection}>
          <div className="rounded-xl bg-neutral-0 p-5 shadow-2xl border border-neutral-200 w-80" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-bold text-neutral-800 mb-3">
              {isAr ? 'اسم الإجراء' : 'Action Name'}
            </h4>
            <p className="text-xs text-neutral-500 mb-3">
              {isAr
                ? 'أدخل اسم الإجراء مثل: submit, approve, reject'
                : 'Enter action name (e.g. submit, approve, reject)'}
            </p>
            <Input
              value={actionName}
              onChange={e => setActionName(e.target.value)}
              placeholder={isAr ? 'اسم الإجراء...' : 'Action name...'}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmConnection();
                if (e.key === 'Escape') handleCancelConnection();
              }}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="secondary" size="sm" onClick={handleCancelConnection}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleConfirmConnection} disabled={!actionName.trim()}>
                {isAr ? 'تأكيد' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
