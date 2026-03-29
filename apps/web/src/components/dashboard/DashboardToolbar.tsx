import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import { Button, Badge } from '../ui';
import { IconPlus } from '../icons';

export function DashboardToolbar() {
  const { t } = useTranslation();
  const {
    isEditMode,
    isDirty,
    toggleEditMode,
    toggleLibrary,
    saveLayout,
    resetLayout,
  } = useDashboard();

  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveLayout();
    } finally {
      setIsSaving(false);
    }
  }, [saveLayout]);

  const handleReset = useCallback(async () => {
    await resetLayout();
    setShowResetConfirm(false);
  }, [resetLayout]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Edit mode toggle */}
      <Button
        variant={isEditMode ? 'primary' : 'outline'}
        size="sm"
        onClick={toggleEditMode}
      >
        {isEditMode
          ? t('dashboard.doneEditing', 'Done Editing')
          : t('dashboard.editMode', 'Edit Dashboard')}
      </Button>

      {/* Edit-mode actions */}
      {isEditMode && (
        <>
          <Button
            variant="outline"
            size="sm"
            icon={<IconPlus className="h-4 w-4" />}
            onClick={toggleLibrary}
          >
            {t('dashboard.addWidget', 'Add Widget')}
          </Button>

          {/* Reset button with inline confirmation */}
          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">
                {t('dashboard.resetConfirm', 'Reset to default layout?')}
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReset}
              >
                {t('dashboard.confirmReset', 'Yes, Reset')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
              >
                {t('dashboard.cancel', 'Cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              {t('dashboard.resetLayout', 'Reset')}
            </Button>
          )}

          {/* Save button */}
          <Button
            variant="primary"
            size="sm"
            loading={isSaving}
            onClick={handleSave}
            disabled={!isDirty}
          >
            {t('dashboard.saveLayout', 'Save Layout')}
          </Button>
        </>
      )}

      {/* Unsaved changes badge */}
      {isDirty && (
        <Badge variant="warning" dot>
          {t('dashboard.unsavedChanges', 'Unsaved changes')}
        </Badge>
      )}
    </div>
  );
}

export default DashboardToolbar;
