import { useState, useCallback } from 'react';
import { downloadAndShare } from '../services/fileService';

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async (fileId: string, fileName: string) => {
    setIsDownloading(true);
    try {
      await downloadAndShare(fileId, fileName);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { download, isDownloading };
}
