import { useTranslation } from 'react-i18next';
import { IconAttachments } from '../icons';
import { formatMsgTime, formatFileSize, getDownloadUrl, isImageType, isAudioType } from './helpers';
import { AudioPlayer } from './AudioPlayer';
import type { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  isGroup: boolean;
}

export function MessageBubble({ msg, isOwn, isGroup }: MessageBubbleProps) {
  const { i18n, t } = useTranslation();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex max-w-[85%] flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (group, non-own) */}
        {!isOwn && isGroup && (
          <span className="px-3 text-[11px] font-medium text-neutral-500">
            {msg.senderDisplayName}
          </span>
        )}

        <div
          className={[
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            isOwn ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-900',
          ].join(' ')}
        >
          {/* Text content */}
          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

          {/* Attachments */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div
              className={`space-y-1.5 ${msg.content ? `mt-2 border-t pt-2 ${isOwn ? 'border-white/20' : 'border-neutral-200'}` : ''}`}
            >
              {msg.attachments.map((att) => {
                const url = getDownloadUrl(att.storedFileId);

                // Image preview
                if (isImageType(att.contentType)) {
                  return (
                    <a key={att.id} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={url}
                        alt={att.fileName}
                        className="max-h-48 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <span className="mt-0.5 block text-[10px] opacity-70">{att.fileName}</span>
                    </a>
                  );
                }

                // Audio player
                if (isAudioType(att.contentType)) {
                  return (
                    <div key={att.id}>
                      <AudioPlayer src={url} isOwn={isOwn} />
                      <span className="text-[10px] opacity-70">{t('chat.voiceNote')}</span>
                    </div>
                  );
                }

                // Generic file
                return (
                  <a
                    key={att.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                      isOwn ? 'bg-neutral-0/10 hover:bg-neutral-0/20' : 'bg-neutral-50 hover:bg-neutral-200',
                    ].join(' ')}
                  >
                    <IconAttachments className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{att.fileName}</span>
                    <span className="shrink-0 text-[10px] opacity-70">
                      {formatFileSize(att.sizeBytes)}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Time */}
        <span className="px-1 text-[10px] text-neutral-400">
          {formatMsgTime(msg.createdAtUtc, i18n.language)}
          {isOwn && <span className="ms-1 text-neutral-300">{t('chat.you')}</span>}
        </span>
      </div>
    </div>
  );
}
