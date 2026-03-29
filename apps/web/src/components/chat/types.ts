export interface Participant {
  userObjectId: string;
  displayName: string;
  email: string;
}

export interface LastMessage {
  content: string;
  senderDisplayName: string;
  type: string;
  createdAtUtc: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  nameAr: string | null;
  nameEn: string | null;
  createdAtUtc: string;
  lastMessageAtUtc: string;
  participants: Participant[];
  unreadCount: number;
  lastMessage: LastMessage | null;
}

export interface Attachment {
  id: string;
  storedFileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderObjectId: string;
  senderDisplayName: string;
  content: string;
  type: string;
  createdAtUtc: string;
  attachments?: Attachment[];
}

export interface Contact {
  userObjectId: string;
  displayName: string;
  email: string;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}
