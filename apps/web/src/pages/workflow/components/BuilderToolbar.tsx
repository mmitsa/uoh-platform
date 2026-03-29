import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBuilderContext } from '../context/WorkflowBuilderContext';
import { canUndo, canRedo, undo, redo } from '../reducer/builderReducer';
import { Button, Input } from '../../../components/ui';
import { IconArrowLeft } from '../../../components/icons';
import { DOMAIN_OPTIONS } from '../constants/stepTypes';

interface BuilderToolbarProps {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

export function BuilderToolbar({ onBack, onSave, saving }: BuilderToolbarProps) {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useBuilderContext();
  const isAr = i18n.language === 'ar';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Delete key
      if (e.key === 'Delete' && !isInput) {
        if (state.selectedStepId) {
          dispatch({ type: 'DELETE_STEP', payload: { id: state.selectedStepId } });
        } else if (state.selectedConnectionId) {
          dispatch({ type: 'DELETE_CONNECTION', payload: { id: state.selectedConnectionId } });
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (state.connectingFrom) {
          dispatch({ type: 'CANCEL_CONNECTING' });
        } else if (state.pendingConnection) {
          dispatch({ type: 'CANCEL_PENDING_CONNECTION' });
        } else {
          dispatch({ type: 'SELECT_STEP', payload: { id: null } });
          dispatch({ type: 'SELECT_CONNECTION', payload: { id: null } });
        }
        return;
      }

      // Ctrl+Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = undo(state);
        if (prev) dispatch({ type: 'LOAD_STATE', payload: prev });
        return;
      }

      // Ctrl+Shift+Z / Ctrl+Y — Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const next = redo(state);
        if (next) dispatch({ type: 'LOAD_STATE', payload: next });
        return;
      }

      // Ctrl+S — Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, dispatch, onSave]);

  const handleUndo = () => {
    const prev = undo(state);
    if (prev) dispatch({ type: 'LOAD_STATE', payload: prev });
  };

  const handleRedo = () => {
    const next = redo(state);
    if (next) dispatch({ type: 'LOAD_STATE', payload: next });
  };

  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-0 px-4 py-2.5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <IconArrowLeft className="h-4 w-4" />
        <span>{t('actions.back')}</span>
      </button>

      <div className="mx-1 h-6 w-px bg-neutral-200" />

      <Input
        className="w-52"
        value={state.metadata.name}
        onChange={e => dispatch({ type: 'SET_METADATA', payload: { name: e.target.value } })}
        placeholder={t('workflow.templateName')}
      />

      <select
        className="w-40 rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={state.metadata.domain}
        onChange={e => dispatch({ type: 'SET_METADATA', payload: { domain: e.target.value } })}
      >
        {DOMAIN_OPTIONS.map(d => (
          <option key={d.value} value={d.value}>
            {isAr ? d.labelAr : d.labelEn}
          </option>
        ))}
      </select>

      <div className="mx-1 h-6 w-px bg-neutral-200" />

      {/* Undo/Redo */}
      <button
        type="button"
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        onClick={handleUndo}
        disabled={!canUndo()}
        title={isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </button>
      <button
        type="button"
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        onClick={handleRedo}
        disabled={!canRedo()}
        title={isAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
        </svg>
      </button>

      {/* Auto-layout */}
      <button
        type="button"
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 transition-colors"
        onClick={() => dispatch({ type: 'AUTO_LAYOUT' })}
        disabled={state.steps.length === 0}
        title={isAr ? 'ترتيب تلقائي' : 'Auto Layout'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Stats */}
      <span className="text-[11px] text-neutral-400">
        {state.steps.length} {isAr ? 'خطوة' : 'steps'} · {state.connections.length} {isAr ? 'انتقال' : 'transitions'}
      </span>

      {state.isDirty && (
        <span className="text-xs text-amber-600 font-medium">{t('workflow.unsaved')}</span>
      )}

      {state.validationErrors.filter(e => e.type === 'error').length > 0 && (
        <span className="text-xs text-red-600 font-medium">
          {state.validationErrors.filter(e => e.type === 'error').length} {t('workflow.errors')}
        </span>
      )}

      <Button onClick={onSave} loading={saving} disabled={!state.metadata.name.trim()}>
        {t('actions.save')}
      </Button>
    </div>
  );
}
