import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

import { Modal, Button, Badge } from './ui';
import { IconCopy, IconShare, IconTrash, IconCheckCircle } from './icons';
import { useShareLink, type ShareableEntityType } from '../hooks/useShareLink';

interface QrShareModalProps {
  open: boolean;
  onClose: () => void;
  entityType: ShareableEntityType;
  entityId: string;
  entityTitle: string;
}

export function QrShareModal({ open, onClose, entityType, entityId, entityTitle }: QrShareModalProps) {
  const { t } = useTranslation();
  const { shareLink, loading, createOrGet, deactivate, getShareUrl } = useShareLink();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && entityId) {
      void createOrGet(entityType, entityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entityType, entityId]);

  const shareUrl = shareLink ? getShareUrl(shareLink.token) : '';

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeactivate() {
    if (shareLink) {
      await deactivate(shareLink.id);
      onClose();
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ url: shareUrl, title: entityTitle });
    } else {
      await copyToClipboard();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('share.title')}>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-500 text-center">{entityTitle}</p>

        {loading ? (
          <div className="flex h-52 w-52 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : shareLink ? (
          <>
            {/* QR Code */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <QRCodeSVG value={shareUrl} size={200} level="M" />
            </div>

            {/* Scan count */}
            <Badge variant="info">
              {t('share.scanCount', { count: shareLink.scanCount })}
            </Badge>

            {/* URL + copy */}
            <div className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-xs text-neutral-600 outline-none"
                dir="ltr"
              />
              <button onClick={() => void copyToClipboard()}
                className="shrink-0 text-brand-600 hover:text-brand-700 transition-colors">
                {copied
                  ? <IconCheckCircle className="h-4 w-4 text-green-600" />
                  : <IconCopy className="h-4 w-4" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-2">
              <Button variant="outline" size="sm" className="flex-1"
                icon={<IconShare className="h-3.5 w-3.5" />}
                onClick={() => void handleNativeShare()}>
                {t('share.nativeShare')}
              </Button>
              <Button variant="danger" size="sm"
                icon={<IconTrash className="h-3.5 w-3.5" />}
                onClick={() => void handleDeactivate()}>
                {t('share.deactivate')}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">{t('share.notFound')}</p>
        )}
      </div>
    </Modal>
  );
}
