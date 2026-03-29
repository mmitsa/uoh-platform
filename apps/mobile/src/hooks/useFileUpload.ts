import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getUploadUrl, uploadFile } from '../services/fileService';

interface UploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(async (classification = 'general'): Promise<UploadResult | null> => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const fileName = asset.name;
    const mimeType = asset.mimeType ?? 'application/octet-stream';
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    const sizeBytes = (fileInfo as any).size ?? 0;

    setIsUploading(true);
    try {
      const presigned = await getUploadUrl(fileName, mimeType, sizeBytes, classification);
      await uploadFile(presigned, asset.uri);
      return { fileId: presigned.fileId, fileName, mimeType, sizeBytes };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { pickAndUpload, isUploading };
}
