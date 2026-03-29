import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSend, IconPaperclip, IconMicrophone } from '../icons';
import { Button } from '../ui';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useFileUpload } from '../../hooks/useFileUpload';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { FilePreviewGrid } from './FilePreviewGrid';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from './helpers';

interface MessageInputProps {
  onSend: (content: string, type: string, attachmentFileIds?: string[]) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, isSupported } = useVoiceRecorder();
  const { uploading, uploadFiles } = useFileUpload();

  const handleSend = useCallback(async () => {
    if (sending || uploading) return;
    const content = text.trim();
    if (!content && selectedFiles.length === 0) return;

    setSending(true);
    try {
      let fileIds: string[] | undefined;

      if (selectedFiles.length > 0) {
        const uploaded = await uploadFiles(selectedFiles);
        fileIds = uploaded.map((f) => f.fileId);
      }

      await onSend(content || (fileIds ? '' : ''), fileIds ? 'file' : 'text', fileIds);
      setText('');
      setSelectedFiles([]);
      inputRef.current?.focus();
    } catch {
      // error handled by parent
    } finally {
      setSending(false);
    }
  }, [text, selectedFiles, sending, uploading, uploadFiles, onSend]);

  const handleVoiceStop = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;

    setSending(true);
    try {
      const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'mp4' : 'ogg';
      const file = new File([blob], `voice-note.${ext}`, { type: blob.type });
      const uploaded = await uploadFiles([file]);
      const fileIds = uploaded.map((f) => f.fileId);
      await onSend('', 'file', fileIds);
    } catch {
      // error handled by parent
    } finally {
      setSending(false);
    }
  }, [stopRecording, uploadFiles, onSend]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
    setSelectedFiles((prev) => [...prev, ...valid]);
    e.target.value = ''; // reset so the same file can be selected again
  }, []);

  const removeFile = useCallback((idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  if (isRecording) {
    return (
      <div className="border-t border-neutral-200 bg-neutral-0 px-4 py-3">
        <VoiceRecorderBar
          duration={duration}
          onStop={() => void handleVoiceStop()}
          onCancel={cancelRecording}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-200 bg-neutral-0">
      <FilePreviewGrid files={selectedFiles} onRemove={removeFile} />

      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Attach file */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          disabled={disabled || sending}
          title={t('chat.attachFiles')}
        >
          <IconPaperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES}
          multiple
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.typeMessage')}
          disabled={disabled || sending}
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        {/* Voice record */}
        {isSupported && !text.trim() && selectedFiles.length === 0 && (
          <button
            type="button"
            onClick={() => void startRecording()}
            className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            disabled={disabled || sending}
            title={t('chat.recordVoice')}
          >
            <IconMicrophone className="h-5 w-5" />
          </button>
        )}

        {/* Send */}
        {(text.trim() || selectedFiles.length > 0) && (
          <Button
            variant="primary"
            size="sm"
            icon={<IconSend className="h-4 w-4" />}
            onClick={() => void handleSend()}
            disabled={disabled}
            loading={sending || uploading}
            className="shrink-0 rounded-xl"
          >
            {t('chat.send')}
          </Button>
        )}
      </div>
    </div>
  );
}
