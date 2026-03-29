import { useState, useCallback } from 'react';
import { WorkflowBuilder } from './workflow/components/WorkflowBuilder';
import { TemplateList } from './workflow/components/TemplateList';
import { deserializeTemplate } from './workflow/utils/serializer';
import { WorkflowBuilderProvider, useBuilderContext } from './workflow/context/WorkflowBuilderContext';
import type { BackendTemplate } from './workflow/types';

type Mode = 'list' | 'builder';

export function WorkflowPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [editingTemplate, setEditingTemplate] = useState<BackendTemplate | null>(null);

  const handleNew = useCallback(() => {
    setEditingTemplate(null);
    setMode('builder');
  }, []);

  const handleEdit = useCallback((template: BackendTemplate) => {
    setEditingTemplate(template);
    setMode('builder');
  }, []);

  const handleBack = useCallback(() => {
    setMode('list');
    setEditingTemplate(null);
  }, []);

  if (mode === 'builder') {
    return (
      <div className="fixed inset-0 z-40 bg-neutral-0 flex flex-col lg:start-[var(--uoh-sidebar-width)]">
        <WorkflowBuilderWithState template={editingTemplate} onBack={handleBack} />
      </div>
    );
  }

  return <TemplateList onEdit={handleEdit} onNew={handleNew} />;
}

function WorkflowBuilderWithState({ template, onBack }: { template: BackendTemplate | null; onBack: () => void }) {
  return (
    <WorkflowBuilderProvider>
      <WorkflowBuilderLoader template={template} onBack={onBack} />
    </WorkflowBuilderProvider>
  );
}

function WorkflowBuilderLoader({ template, onBack }: { template: BackendTemplate | null; onBack: () => void }) {
  const { dispatch } = useBuilderContext();
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    if (template) {
      const state = deserializeTemplate(template);
      dispatch({ type: 'LOAD_STATE', payload: state });
    }
    setLoaded(true);
  }

  return <WorkflowBuilder onBack={onBack} />;
}
