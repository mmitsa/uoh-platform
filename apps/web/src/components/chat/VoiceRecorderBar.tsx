import { useTranslation } from 'react-i18next';
import { IconStop, IconX, IconSend } from '../icons';

interface VoiceRecorderBarProps {
  duration: number;
  onStop: () => void;
  onCancel: () => void;
}

export function VoiceRecorderBar({ duration, onStop, onCancel }: VoiceRecorderBarProps) {
  const { t } = useTranslation();
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
      {/* Recording indicator */}
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
      </span>

      {/* Duration */}
      <span className="text-sm font-medium tabular-nums text-red-700">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>

      <span className="text-xs text-red-500">{t('chat.recording')}</span>

      <div className="flex-1" />

      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200"
        title={t('chat.cancelRecording')}
      >
        <IconX className="h-4 w-4" />
      </button>

      {/* Stop & send */}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-800"
        title={t('chat.stopRecording')}
      >
        <IconStop className="h-3.5 w-3.5" />
        <IconSend className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
