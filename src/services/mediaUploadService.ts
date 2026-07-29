import axios from 'axios';
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_VIDEO_SIZE_MB, MAX_VIDEO_DURATION_SECS } from '@/lib/constants';

export interface UploadResult {
  url: string;
  key: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported format. Use JPEG, PNG, or WebP.` };
  }
  const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Image must be ${MAX_IMAGE_SIZE_MB}MB or less.` };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): ValidationResult {
  const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!supportedVideoTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported video format. Use MP4, WebM, or MOV.' };
  }
  const maxBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Video must be ${MAX_VIDEO_SIZE_MB}MB or less.` };
  }
  return { valid: true };
}

export async function validateVideoDuration(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > MAX_VIDEO_DURATION_SECS) {
        resolve({ valid: false, error: `Video must be ${MAX_VIDEO_DURATION_SECS / 60} minutes or less.` });
      } else {
        resolve({ valid: true });
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({ valid: false, error: 'Could not read video file.' });
    };
    video.src = URL.createObjectURL(file);
  });
}

export async function uploadFileToS3(presignedUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    },
  });
}

export function createObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}
