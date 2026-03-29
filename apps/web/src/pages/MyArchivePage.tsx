import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import {
  Button,
  Input,
  EmptyState,
  useToast,
  Badge,
  Card,
  CardBody,
  PageHeader,
} from '../components/ui';
import {
  IconSearch,
  IconChat,
  IconFile,
  IconDownload,
  IconAttachments,
  IconAnnouncement,
  IconCheck,
} from '../components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderObjectId: string;
  senderDisplayName: string;
  content: string;
  createdAtUtc: string;
}

interface Attachment {
  id: string;
  storedFileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  message: {
    senderDisplayName: string;
    conversationId: string;
    createdAtUtc: string;
  };
}

interface UserAnnouncement {
  id: string;
  titleAr: string;
  titleEn: string;
  type: 'circular' | 'news' | 'announcement';
  priority: 'normal' | 'important' | 'urgent';
  publishDate: string;
  acknowledgedAtUtc: string | null;
  surveyId: string | null;
}

type Tab = 'history' | 'attachments' | 'announcements';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contentTypeToBadge(contentType: string): string {
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType === 'application/pdf') return 'PDF';
  if (
    contentType === 'application/msword' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'Word';
  if (
    contentType === 'application/vnd.ms-excel' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'Excel';
  if (
    contentType === 'application/vnd.ms-powerpoint' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'PowerPoint';
  if (contentType.startsWith('video/')) return 'Video';
  if (contentType.startsWith('audio/')) return 'Audio';
  if (contentType === 'application/zip' || contentType === 'application/x-rar-compressed')
    return 'Archive';
  if (contentType.startsWith('text/')) return 'Text';
  return 'File';
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MyArchivePage() {
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  // -- Tab state --
  const [activeTab, setActiveTab] = useState<Tab>('history');

  // -- Chat history state --
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);

  // -- Attachments state --
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [attachmentsTotal, setAttachmentsTotal] = useState(0);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsLoadingMore, setAttachmentsLoadingMore] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // -- Announcements state --
  const [announcements, setAnnouncements] = useState<UserAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsFetched, setAnnouncementsFetched] = useState(false);

  // -- Refs --
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- Date formatter --
  const formatDate = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },
    [i18n.language],
  );

  // ---------------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  // ---------------------------------------------------------------------------
  // Fetch chat messages
  // ---------------------------------------------------------------------------

  const fetchMessages = useCallback(
    async (page: number, append: boolean) => {
      if (!debouncedSearchTerm.trim()) {
        setMessages([]);
        setMessagesTotal(0);
        setMessagesPage(1);
        return;
      }

      if (append) {
        setMessagesLoadingMore(true);
      } else {
        setMessagesLoading(true);
      }

      try {
        const params = new URLSearchParams({
          q: debouncedSearchTerm,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        const data = await get<PaginatedResponse<ChatMessage>>(
          `/api/v1/chat/search?${params.toString()}`,
        );

        if (append) {
          setMessages((prev) => [...prev, ...data.items]);
        } else {
          setMessages(data.items);
        }
        setMessagesTotal(data.total);
        setMessagesPage(data.page);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setMessagesLoading(false);
        setMessagesLoadingMore(false);
      }
    },
    [debouncedSearchTerm, get, t, toast],
  );

  useEffect(() => {
    fetchMessages(1, false);
  }, [debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMoreMessages = () => {
    fetchMessages(messagesPage + 1, true);
  };

  const hasMoreMessages = messages.length < messagesTotal;

  // ---------------------------------------------------------------------------
  // Fetch attachments
  // ---------------------------------------------------------------------------

  const fetchAttachments = useCallback(
    async (page: number, append: boolean) => {
      if (append) {
        setAttachmentsLoadingMore(true);
      } else {
        setAttachmentsLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        const data = await get<PaginatedResponse<Attachment>>(
          `/api/v1/chat/my-attachments?${params.toString()}`,
        );

        if (append) {
          setAttachments((prev) => [...prev, ...data.items]);
        } else {
          setAttachments(data.items);
        }
        setAttachmentsTotal(data.total);
        setAttachmentsPage(data.page);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setAttachmentsLoading(false);
        setAttachmentsLoadingMore(false);
      }
    },
    [get, t, toast],
  );

  useEffect(() => {
    if (activeTab === 'attachments' && attachments.length === 0 && !attachmentsLoading) {
      fetchAttachments(1, false);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMoreAttachments = () => {
    fetchAttachments(attachmentsPage + 1, true);
  };

  const hasMoreAttachments = attachments.length < attachmentsTotal;

  // ---------------------------------------------------------------------------
  // Fetch announcements
  // ---------------------------------------------------------------------------

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const data = await get<{ items: UserAnnouncement[] }>(
        '/api/v1/announcements/my-history',
      );
      setAnnouncements(data.items);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setAnnouncementsLoading(false);
      setAnnouncementsFetched(true);
    }
  }, [get, t, toast]);

  useEffect(() => {
    if (activeTab === 'announcements' && !announcementsFetched) {
      fetchAnnouncements();
    }
  }, [activeTab, announcementsFetched, fetchAnnouncements]);

  // ---------------------------------------------------------------------------
  // Download handler
  // ---------------------------------------------------------------------------

  const handleDownload = async (storedFileId: string, fileName: string) => {
    setDownloadingFileId(storedFileId);
    try {
      const data = await get<{ url: string }>(
        `/api/v1/files/${storedFileId}/download`,
      );
      const link = document.createElement('a');
      link.href = data.url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDownloadingFileId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Navigate to conversation
  // ---------------------------------------------------------------------------

  const handleNavigateToConversation = (conversationId: string) => {
    navigate(`/chat`, { state: { conversationId } });
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderChatHistory = () => (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
          <IconSearch className="h-4 w-4 text-neutral-400" />
        </div>
        <Input
          type="text"
          placeholder={t('myArchive.searchMessages')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Loading state */}
      {messagesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
        </div>
      )}

      {/* Empty state: no search term entered */}
      {!messagesLoading && !debouncedSearchTerm.trim() && (
        <EmptyState
          icon={<IconSearch className="h-10 w-10 text-neutral-400" />}
          title={t('myArchive.searchMessages')}
        />
      )}

      {/* Empty state: search returned nothing */}
      {!messagesLoading &&
        debouncedSearchTerm.trim() &&
        messages.length === 0 && (
          <EmptyState
            icon={<IconChat className="h-10 w-10 text-neutral-400" />}
            title={t('myArchive.noMessages')}
          />
        )}

      {/* Results */}
      {!messagesLoading && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} role="button" tabIndex={0} className="cursor-pointer" onClick={() => handleNavigateToConversation(msg.conversationId)} onKeyDown={(e) => { if (e.key === 'Enter') handleNavigateToConversation(msg.conversationId); }}>
            <Card
              className="transition-shadow hover:shadow-md"
            >
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900 leading-relaxed">
                      {highlightMatch(msg.content, debouncedSearchTerm)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">
                        {msg.senderDisplayName}
                      </span>
                      <span>{formatDate(msg.createdAtUtc)}</span>
                    </div>
                  </div>
                  <IconChat className="h-5 w-5 shrink-0 text-neutral-400" />
                </div>
              </CardBody>
            </Card>
            </div>
          ))}

          {/* Load more */}
          {hasMoreMessages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMoreMessages}
                disabled={messagesLoadingMore}
              >
                {messagesLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('common.loadMore')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAttachments = () => (
    <div className="space-y-4">
      {/* Loading state */}
      {attachmentsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
        </div>
      )}

      {/* Empty state */}
      {!attachmentsLoading && attachments.length === 0 && (
        <EmptyState
          icon={<IconAttachments className="h-10 w-10 text-neutral-400" />}
          title={t('myArchive.noAttachments')}
        />
      )}

      {/* Attachments table */}
      {!attachmentsLoading && attachments.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                  <th className="px-4 py-3 text-start font-medium">
                    {t('myArchive.fileName')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('myArchive.fileSize')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('myArchive.fileDate')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('myArchive.conversation')}
                  </th>
                  <th className="px-4 py-3 text-end font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {attachments.map((att) => (
                  <tr
                    key={att.id}
                    className="transition-colors hover:bg-neutral-50"
                  >
                    {/* File name + type badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <IconFile className="h-5 w-5 shrink-0 text-neutral-400" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900">
                            {att.fileName}
                          </p>
                          <Badge className="mt-1">
                            {contentTypeToBadge(att.contentType)}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {formatFileSize(att.sizeBytes)}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {formatDate(att.message.createdAtUtc)}
                    </td>

                    {/* Sender */}
                    <td className="px-4 py-3 text-neutral-600">
                      {att.message.senderDisplayName}
                    </td>

                    {/* Download */}
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleDownload(att.storedFileId, att.fileName)
                        }
                        disabled={downloadingFileId === att.storedFileId}
                      >
                        {downloadingFileId === att.storedFileId ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                        ) : (
                          <IconDownload className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {hasMoreAttachments && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMoreAttachments}
                disabled={attachmentsLoadingMore}
              >
                {attachmentsLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('common.loadMore')
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAnnouncements = () => {
    const isRtl = i18n.language === 'ar';

    const typeBadge: Record<string, 'info' | 'success' | 'warning'> = {
      circular: 'info', news: 'success', announcement: 'warning',
    };
    const priorityBadge: Record<string, 'default' | 'warning' | 'danger'> = {
      normal: 'default', important: 'warning', urgent: 'danger',
    };

    return (
      <div className="space-y-4">
        {/* Loading */}
        {announcementsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
          </div>
        )}

        {/* Empty */}
        {!announcementsLoading && announcements.length === 0 && (
          <EmptyState
            icon={<IconAnnouncement className="h-10 w-10 text-neutral-400" />}
            title={t('announcements.noAnnouncements')}
          />
        )}

        {/* List */}
        {!announcementsLoading && announcements.length > 0 && (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <Card key={ann.id} className="transition-shadow hover:shadow-md">
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={typeBadge[ann.type]}>
                          {t(`announcements.type_${ann.type}`)}
                        </Badge>
                        {ann.priority !== 'normal' && (
                          <Badge variant={priorityBadge[ann.priority]}>
                            {t(`announcements.priority_${ann.priority}`)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-900">
                        {isRtl ? ann.titleAr : ann.titleEn}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {isRtl ? ann.titleEn : ann.titleAr}
                      </p>
                      <div className="mt-2 text-xs text-neutral-500">
                        {formatDate(ann.publishDate)}
                      </div>
                    </div>

                    {/* Acknowledgment status */}
                    <div className="shrink-0 text-end">
                      {ann.acknowledgedAtUtc ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <IconCheck className="h-4 w-4" />
                          <div>
                            <div className="text-xs font-medium">{t('announcements.acknowledged')}</div>
                            <div className="text-[10px] text-green-500">
                              {formatDate(ann.acknowledgedAtUtc)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-red-500">
                          {t('announcements.notAcknowledged')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title={t('myArchive.title')}
        description={t('myArchive.description')}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          {t('myArchive.chatHistory')}
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'attachments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => setActiveTab('attachments')}
        >
          {t('myArchive.myAttachments')}
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'announcements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => setActiveTab('announcements')}
        >
          {t('announcements.archiveTab')}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'history' && renderChatHistory()}
      {activeTab === 'attachments' && renderAttachments()}
      {activeTab === 'announcements' && renderAnnouncements()}
    </div>
  );
}
