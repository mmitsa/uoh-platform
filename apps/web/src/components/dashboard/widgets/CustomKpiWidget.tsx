import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetProps } from '../../../app/dashboard/types';

export default function CustomKpiWidget({ config, onConfigChange }: WidgetProps) {
  const { t } = useTranslation();
  const title = (config?.title as string) ?? '';
  const value = (config?.value as string) ?? '';
  const unit = (config?.unit as string) ?? '';
  const color = (config?.color as string) ?? '#3b82f6';

  const isConfigured = title && value;

  const [formTitle, setFormTitle] = useState(title);
  const [formValue, setFormValue] = useState(value);
  const [formUnit, setFormUnit] = useState(unit);
  const [formColor, setFormColor] = useState(color);

  const handleSave = () => {
    onConfigChange?.({
      ...config,
      title: formTitle,
      value: formValue,
      unit: formUnit,
      color: formColor,
    });
  };

  if (!isConfigured) {
    return (
      <div className="flex h-full flex-col gap-2 p-1">
        <p className="text-xs font-medium text-neutral-500">
          {t('dashboard.configureKpi', 'Configure KPI')}
        </p>
        <input
          type="text"
          placeholder={t('dashboard.kpiTitle', 'Title')}
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder={t('dashboard.kpiValue', 'Value')}
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('dashboard.kpiUnit', 'Unit')}
            value={formUnit}
            onChange={(e) => setFormUnit(e.target.value)}
            className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="color"
            value={formColor}
            onChange={(e) => setFormColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-neutral-200"
            title={t('dashboard.kpiColor', 'Color')}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!formTitle || !formValue}
          className="mt-auto rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {t('common.save', 'Save')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <span className="text-3xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="ms-1 text-lg font-medium text-neutral-500">{unit}</span>}
      </span>
      <span className="text-sm font-medium text-neutral-600">{title}</span>
    </div>
  );
}
