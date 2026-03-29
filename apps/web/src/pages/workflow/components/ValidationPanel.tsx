import { useTranslation } from 'react-i18next';
import { useBuilderContext } from '../context/WorkflowBuilderContext';

export function ValidationPanel() {
  const { t } = useTranslation();
  const { state } = useBuilderContext();

  if (state.validationErrors.length === 0) return null;

  const errors = state.validationErrors.filter(e => e.type === 'error');
  const warnings = state.validationErrors.filter(e => e.type === 'warning');

  return (
    <div className="border-t border-neutral-200 bg-neutral-0 px-4 py-2">
      <div className="flex flex-wrap gap-3 text-xs">
        {errors.map((err, idx) => (
          <span key={`e-${idx}`} className="flex items-center gap-1 text-red-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {t(err.message)}
          </span>
        ))}
        {warnings.map((warn, idx) => (
          <span key={`w-${idx}`} className="flex items-center gap-1 text-amber-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t(warn.message)}
          </span>
        ))}
      </div>
    </div>
  );
}
