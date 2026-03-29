import type { Conversation } from './types';

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatConvTime(dateStr: string, lang: string, yesterdayLabel: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 1000 * 60 * 60 * 24;

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return yesterdayLabel;
  }
  if (diff < 7 * dayMs) {
    return date.toLocaleDateString(lang, { weekday: 'short' });
  }
  return date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
}

export function formatMsgTime(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(
  dateStr: string,
  lang: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return todayLabel;
  if (isYesterday) return yesterdayLabel;
  return date.toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function getConvName(conv: Conversation, isAr: boolean, currentUserId?: string): string {
  if (conv.type === 'group') {
    return (isAr ? conv.nameAr : conv.nameEn) ?? '';
  }
  const other = conv.participants.find((p) => p.userObjectId !== currentUserId);
  return other?.displayName ?? (isAr ? conv.nameAr : conv.nameEn) ?? '';
}

export function shouldShowDateSeparator(messages: { createdAtUtc: string }[], idx: number): boolean {
  if (idx === 0) return true;
  const prev = new Date(messages[idx - 1].createdAtUtc).toDateString();
  const curr = new Date(messages[idx].createdAtUtc).toDateString();
  return prev !== curr;
}

export function getDownloadUrl(storedFileId: string): string {
  return `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/files/${storedFileId}/download`;
}

export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function isAudioType(contentType: string): boolean {
  return contentType.startsWith('audio/');
}

export function isVideoType(contentType: string): boolean {
  return contentType.startsWith('video/');
}

export const ACCEPTED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  // Videos
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  // Audio
  'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg',
].join(',');

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
