'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Film, ImagePlus, Camera, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketersApi } from '@/services/apiClient';
import { validateImageFile, validateVideoFile } from '@/services/mediaUploadService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatFileSize } from '@/lib/utils';
import {
  MAX_PORTFOLIO_FILES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
} from '@/lib/constants';
import type { MarketerFile } from '@/types/models';

export default function MarketerPortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: marketerData, isLoading } = useQuery({
    queryKey: ['marketer', user?.id],
    queryFn: () => marketersApi.getMarketer(user?.id || '').then((r) => r.data),
    enabled: !!user?.id,
  });

  const files: MarketerFile[] = marketerData?.portfolioFiles ?? [];
  const canUpload = files.length < MAX_PORTFOLIO_FILES;

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    setUploadError('');

    const validation = type === 'image' ? validateImageFile(file) : validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    try {
      // In mock mode this is a no-op; in production the backend handles S3 upload
      await new Promise((res) => setTimeout(res, 800));
      queryClient.invalidateQueries({ queryKey: ['marketer', user?.id] });
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const images = files.filter((f) => f.type === 'image');
  const videos = files.filter((f) => f.type === 'video');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Portfolio</h1>
          <p className="text-textSecondary text-sm mt-1">
            {files.length} / {MAX_PORTFOLIO_FILES} files · {images.length} images, {videos.length} videos
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 text-sm"
            disabled={!canUpload || uploading}
            onClick={() => imageInputRef.current?.click()}
            aria-label="Upload image"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Image</span>
          </Button>
          <Button
            className="bg-primary text-white gap-2 text-sm"
            disabled={!canUpload || uploading}
            onClick={() => videoInputRef.current?.click()}
            aria-label="Upload video"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                <span className="hidden sm:inline">Uploading…</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Video</span>
              </>
            )}
          </Button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept={SUPPORTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'image');
            e.target.value = '';
          }}
          aria-label="Select image file"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={SUPPORTED_VIDEO_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'video');
            e.target.value = '';
          }}
          aria-label="Select video file"
        />
      </div>

      {uploadError && (
        <div role="alert" className="bg-error/10 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">
          {uploadError}
        </div>
      )}

      {!canUpload && (
        <div className="bg-warning/10 border border-warning/20 text-warning text-sm rounded-xl px-4 py-3 mb-4" role="status">
          Portfolio limit reached ({MAX_PORTFOLIO_FILES} files).
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-square animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && files.length === 0 && (
        <div
          className="border-2 border-dashed border-border rounded-2xl py-20 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => imageInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && imageInputRef.current?.click()}
          aria-label="Upload your first portfolio file"
        >
          <ImagePlus className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium text-textPrimary">Upload your first file</p>
          <p className="text-sm text-textSecondary mt-1">
            Images (max {MAX_IMAGE_SIZE_MB}MB) · Videos (max {MAX_VIDEO_SIZE_MB}MB)
          </p>
        </div>
      )}

      {!isLoading && files.length > 0 && (
        <div className="space-y-6">
          {images.length > 0 && (
            <section aria-labelledby="images-heading">
              <h2 id="images-heading" className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" aria-hidden="true" /> Images ({images.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list">
                {images.map((f) => (
                  <div key={f.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted" role="listitem">
                    <Image src={f.url} alt="Portfolio image" fill className="object-cover" sizes="25vw" />
                    <div className="absolute bottom-1 right-1">
                      <span className="text-xs bg-black/60 text-white rounded-full px-1.5 py-0.5">
                        {formatFileSize(f.sizeBytes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section aria-labelledby="videos-heading">
              <h2 id="videos-heading" className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" aria-hidden="true" /> Videos ({videos.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
                {videos.map((f) => (
                  <div
                    key={f.id}
                    className="bg-muted rounded-xl p-4 flex items-center gap-3"
                    role="listitem"
                    aria-label="Portfolio video"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Film className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-textPrimary truncate">{f.mimeType}</p>
                      <p className="text-xs text-textSecondary">
                        {formatFileSize(f.sizeBytes)}
                        {f.durationSeconds && ` · ${Math.floor(f.durationSeconds / 60)}:${String(f.durationSeconds % 60).padStart(2, '0')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
