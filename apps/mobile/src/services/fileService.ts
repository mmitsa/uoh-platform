import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../api/apiClient';

interface PresignUploadResponse {
  fileId: string;
  url: string;
  headers: Record<string, string>;
  expiresAtUtc: string;
}

interface PresignDownloadResponse {
  url: string;
  headers: Record<string, string>;
  expiresAtUtc: string;
}

export async function getUploadUrl(fileName: string, contentType: string, sizeBytes: number, classification = 'general'): Promise<PresignUploadResponse> {
  return api.post<PresignUploadResponse>('/api/v1/files/presign-upload', {
    fileName, contentType, sizeBytes, classification,
  });
}

export async function uploadFile(presigned: PresignUploadResponse, fileUri: string): Promise<void> {
  await FileSystem.uploadAsync(presigned.url, fileUri, {
    httpMethod: 'PUT',
    headers: presigned.headers,
  });
}

export async function getDownloadUrl(fileId: string): Promise<PresignDownloadResponse> {
  return api.get<PresignDownloadResponse>(`/api/v1/files/${fileId}/download`);
}

export async function downloadAndShare(fileId: string, fileName: string): Promise<void> {
  const { url } = await getDownloadUrl(fileId);
  const localUri = FileSystem.documentDirectory + fileName;
  await FileSystem.downloadAsync(url, localUri);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri);
  }
}
