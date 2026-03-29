import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Button, Input, Modal, useToast } from '../ui';
import { IconSearch, IconX, IconUser } from '../icons';
import { getInitials } from './helpers';
import type { Contact, Conversation } from './types';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}

export function NewChatModal({ open, onClose, onCreated }: NewChatModalProps) {
  const { get, post } = useApi();
  const { t } = useTranslation();
  const toast = useToast();

  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Contact[]>([]);
  const [groupNameAr, setGroupNameAr] = useState('');
  const [groupNameEn, setGroupNameEn] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setContactsLoading(true);
    void (async () => {
      try {
        const res = await get<Contact[]>('/api/v1/chat/contacts');
        setContacts(res);
      } catch {
        toast.error(t('errors.loadFailed'));
      } finally {
        setContactsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [contacts, search]);

  const toggleGroupContact = useCallback((contact: Contact) => {
    setSelectedGroup((prev) => {
      const exists = prev.find((c) => c.userObjectId === contact.userObjectId);
      if (exists) return prev.filter((c) => c.userObjectId !== contact.userObjectId);
      return [...prev, contact];
    });
  }, []);

  const reset = useCallback(() => {
    setChatType('direct');
    setSearch('');
    setSelected(null);
    setSelectedGroup([]);
    setGroupNameAr('');
    setGroupNameEn('');
  }, []);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      let conv: Conversation;
      if (chatType === 'direct') {
        if (!selected) return;
        conv = await post<Conversation>('/api/v1/chat/conversations', {
          type: 'direct',
          targetOid: selected.userObjectId,
          targetDisplay: selected.displayName,
          targetEmail: selected.email,
        });
      } else {
        if (selectedGroup.length < 2 || !groupNameAr.trim() || !groupNameEn.trim()) return;
        conv = await post<Conversation>('/api/v1/chat/conversations', {
          type: 'group',
          nameAr: groupNameAr.trim(),
          nameEn: groupNameEn.trim(),
          participants: selectedGroup.map((c) => ({
            userObjectId: c.userObjectId,
            displayName: c.displayName,
            email: c.email,
          })),
        });
      }
      reset();
      onClose();
      onCreated(conv);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setCreating(false);
    }
  }, [creating, chatType, selected, selectedGroup, groupNameAr, groupNameEn, post, reset, onClose, onCreated, toast, t]);

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title={t('chat.newChat')}
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setChatType('direct'); setSelectedGroup([]); }}
            className={[
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              chatType === 'direct'
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-neutral-200 bg-neutral-0 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {t('chat.direct')}
          </button>
          <button
            type="button"
            onClick={() => { setChatType('group'); setSelected(null); }}
            className={[
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              chatType === 'group'
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-neutral-200 bg-neutral-0 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {t('chat.group')}
          </button>
        </div>

        {/* Group name inputs */}
        {chatType === 'group' && (
          <div className="grid gap-3">
            <Input label={t('chat.groupNameAr')} value={groupNameAr} onChange={(e) => setGroupNameAr(e.target.value)} dir="rtl" />
            <Input label={t('chat.groupNameEn')} value={groupNameEn} onChange={(e) => setGroupNameEn(e.target.value)} dir="ltr" />
          </div>
        )}

        {/* Selected group contacts */}
        {chatType === 'group' && selectedGroup.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedGroup.map((c) => (
              <span key={c.userObjectId} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                {c.displayName}
                <button type="button" onClick={() => toggleGroupContact(c)} className="rounded-full p-0.5 hover:bg-brand-100">
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Contact search */}
        <div className="relative">
          <IconSearch className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={chatType === 'direct' ? t('chat.selectContact') : t('chat.selectContacts')}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pe-3 ps-8 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Contact list */}
        <div className="max-h-56 overflow-y-auto rounded-lg border border-neutral-200">
          {contactsLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <IconUser className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-500">{t('chat.selectContact')}</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filtered.map((contact) => {
                const isSelected = chatType === 'direct'
                  ? selected?.userObjectId === contact.userObjectId
                  : selectedGroup.some((c) => c.userObjectId === contact.userObjectId);

                return (
                  <button
                    key={contact.userObjectId}
                    type="button"
                    onClick={() => {
                      if (chatType === 'direct') setSelected(isSelected ? null : contact);
                      else toggleGroupContact(contact);
                    }}
                    className={[
                      'flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors',
                      isSelected ? 'bg-brand-50' : 'hover:bg-neutral-50',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        isSelected ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-neutral-600',
                      ].join(' ')}
                    >
                      {getInitials(contact.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">{contact.displayName}</p>
                      <p className="truncate text-xs text-neutral-500">{contact.email}</p>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 text-brand-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => { onClose(); reset(); }}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleCreate()}
            loading={creating}
            disabled={chatType === 'direct' ? !selected : selectedGroup.length < 2 || !groupNameAr.trim() || !groupNameEn.trim()}
          >
            {t('chat.newChat')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
