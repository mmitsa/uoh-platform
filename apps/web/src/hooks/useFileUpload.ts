import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { MAX_FILE_SIZE } from '../components/chat/helpers';

interface UploadedFile {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

interface PresignResponse {
  fileId: string;
  url: string;
  headers: Record<string, string>;
}

interface UseFileUploadReturn {
  uploading: boolean;
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
}

export function useFileUpload(): UseFileUploadReturn {
  const { post } = useApi();
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    setUploading(true);
    const results: UploadedFile[] = [];
    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" exceeds 100 MB limit`);
        }

        // Get presigned upload URL
        const presign = await post<PresignResponse>('/api/v1/files/presign-upload', {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        });

        // Upload to presigned URL (skip in demo mode where url starts with #)
        if (!presign.url.startsWith('#')) {
          await fetch(presign.url, {
            method: 'PUT',
            headers: presign.headers,
            body: file,
          });
        }

        results.push({
          fileId: presign.fileId,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        });
      }
      return results;
    } finally {
      setUploading(false);
    }
  }, [post]);

  return { uploading, uploadFiles };
}
