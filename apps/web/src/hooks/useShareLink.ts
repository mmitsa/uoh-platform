import { useCallback, useState } from 'react';
import { useApi } from './useApi';

export type ShareableEntityType = 'Meeting' | 'Committee' | 'Directive' | 'Mom' | 'Location' | 'Attendance';

export type ShareLinkData = {
  id: string;
  entityType: ShareableEntityType;
  entityId: string;
  token: string;
  isActive: boolean;
  createdAtUtc: string;
  expiresAtUtc: string | null;
  scanCount: number;
};

export function useShareLink() {
  const { post, del } = useApi();
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLinkData | null>(null);

  const createOrGet = useCallback(async (entityType: ShareableEntityType, entityId: string) => {
    setLoading(true);
    try {
      const result = await post<ShareLinkData>('/api/v1/share-links', { entityType, entityId });
      setShareLink(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [post]);

  const deactivate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await del(`/api/v1/share-links/${id}`);
      setShareLink(null);
    } finally {
      setLoading(false);
    }
  }, [del]);

  const getShareUrl = useCallback((token: string) => {
    return `${window.location.origin}/public/share/${token}`;
  }, []);

  return { shareLink, loading, createOrGet, deactivate, getShareUrl };
}
