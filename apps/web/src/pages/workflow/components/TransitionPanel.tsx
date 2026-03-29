import { useTranslation } from 'react-i18next';
import { useBuilderContext } from '../context/WorkflowBuilderContext';
import { getStepTypeDef, AVAILABLE_ROLES } from '../constants/stepTypes';
import { Input, Button } from '../../../components/ui';

export function TransitionPanel() {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useBuilderContext();
  const isAr = i18n.language === 'ar';

  const selectedStep = state.selectedStepId
    ? state.steps.find(s => s.id === state.selectedStepId) ?? null
    : null;

  const selectedConnection = state.selectedConnectionId
    ? state.connections.find(c => c.id === state.selectedConnectionId) ?? null
    : null;

  if (!selectedStep && !selectedConnection) {
    return (
      <div className="w-64 shrink-0 border-s border-neutral-200 bg-neutral-50/50 p-4">
        <p className="text-xs text-neutral-400 text-center mt-8">
          {isAr ? 'اختر عنصراً لتعديله' : 'Select an element to edit'}
        </p>
        {/* Quick stats */}
        {state.steps.length > 0 && (
          <div className="mt-8 space-y-2 text-xs text-neutral-500">
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <span>{isAr ? 'الخطوات' : 'Steps'}</span>
              <span className="font-mono font-bold">{state.steps.length}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <span>{isAr ? 'الانتقالات' : 'Transitions'}</span>
              <span className="font-mono font-bold">{state.connections.length}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step editor
  if (selectedStep) {
    const def = getStepTypeDef(selectedStep.type);
    const incoming = state.connections.filter(c => c.toStepId === selectedStep.id);
    const outgoing = state.connections.filter(c => c.fromStepId === selectedStep.id);

    return (
      <div className="w-64 shrink-0 overflow-y-auto border-s border-neutral-200 bg-neutral-50/50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${def.bgColor} border ${def.borderColor}`} />
          <h3 className="text-sm font-bold text-neutral-800">
            {isAr ? def.labelAr : def.labelEn}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'التسمية' : 'Label'}
            </label>
            <Input
              value={selectedStep.label}
              onChange={e => dispatch({ type: 'UPDATE_STEP', payload: { id: selectedStep.id, changes: { label: e.target.value } } })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'اسم الحالة' : 'State Name'}
            </label>
            <Input
              className="font-mono text-xs"
              value={selectedStep.stateName}
              onChange={e => dispatch({ type: 'UPDATE_STEP', payload: { id: selectedStep.id, changes: { stateName: e.target.value.replace(/\s/g, '_').toLowerCase() } } })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'الدور المطلوب' : 'Required Role'}
            </label>
            <select
              className="w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={selectedStep.config.requiredRole ?? ''}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_STEP',
                  payload: {
                    id: selectedStep.id,
                    changes: { config: { ...selectedStep.config, requiredRole: e.target.value || undefined } },
                  },
                })
              }
            >
              <option value="">{isAr ? 'بدون' : 'None'}</option>
              {AVAILABLE_ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {isAr ? r.labelAr : r.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'الوصف' : 'Description'}
            </label>
            <textarea
              className="w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              rows={2}
              value={selectedStep.config.description ?? ''}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_STEP',
                  payload: {
                    id: selectedStep.id,
                    changes: { config: { ...selectedStep.config, description: e.target.value || undefined } },
                  },
                })
              }
              placeholder={isAr ? 'وصف اختياري...' : 'Optional description...'}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'المهلة الزمنية (ساعات)' : 'SLA (hours)'}
            </label>
            <Input
              type="number"
              min={0}
              value={selectedStep.config.slaHours ?? ''}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_STEP',
                  payload: {
                    id: selectedStep.id,
                    changes: { config: { ...selectedStep.config, slaHours: e.target.value ? Number(e.target.value) : undefined } },
                  },
                })
              }
              placeholder={isAr ? 'بدون حد' : 'No limit'}
            />
          </div>

          {/* Connections summary */}
          {(incoming.length > 0 || outgoing.length > 0) && (
            <div className="pt-2 border-t border-neutral-200">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase mb-1">
                {isAr ? 'الاتصالات' : 'Connections'}
              </p>
              {incoming.length > 0 && (
                <p className="text-[11px] text-neutral-500">
                  ← {incoming.length} {isAr ? 'واردة' : 'incoming'}
                </p>
              )}
              {outgoing.length > 0 && (
                <p className="text-[11px] text-neutral-500">
                  → {outgoing.length} {isAr ? 'صادرة' : 'outgoing'}
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-neutral-200">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => dispatch({ type: 'DELETE_STEP', payload: { id: selectedStep.id } })}
            >
              {t('actions.delete')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Connection editor
  if (selectedConnection) {
    const fromStep = state.steps.find(s => s.id === selectedConnection.fromStepId);
    const toStep = state.steps.find(s => s.id === selectedConnection.toStepId);

    return (
      <div className="w-64 shrink-0 overflow-y-auto border-s border-neutral-200 bg-neutral-50/50 p-4">
        <h3 className="mb-4 text-sm font-bold text-neutral-800">
          {isAr ? 'تعديل الانتقال' : 'Edit Transition'}
        </h3>

        <div className="mb-3 rounded-lg bg-neutral-0 p-2 text-xs text-neutral-500 border border-neutral-200">
          <span className="font-mono font-medium text-neutral-700">{fromStep?.stateName ?? '?'}</span>
          {' → '}
          <span className="font-mono font-medium text-neutral-700">{toStep?.stateName ?? '?'}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'الإجراء' : 'Action'}
            </label>
            <Input
              value={selectedConnection.action}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_CONNECTION',
                  payload: { id: selectedConnection.id, changes: { action: e.target.value } },
                })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {isAr ? 'الدور المطلوب' : 'Required Role'}
            </label>
            <select
              className="w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={selectedConnection.requiredRole ?? ''}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_CONNECTION',
                  payload: { id: selectedConnection.id, changes: { requiredRole: e.target.value || null } },
                })
              }
            >
              <option value="">{isAr ? 'بدون' : 'None'}</option>
              {AVAILABLE_ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {isAr ? r.labelAr : r.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-neutral-200">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => dispatch({ type: 'DELETE_CONNECTION', payload: { id: selectedConnection.id } })}
            >
              {t('actions.delete')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
