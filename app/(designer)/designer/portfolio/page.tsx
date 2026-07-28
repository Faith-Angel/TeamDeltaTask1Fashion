'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Trash2, ImagePlus, Grid } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDesigner, useUploadPortfolioImage, useDeletePortfolioImage } from '@/hooks/useDesigners';
import { Button } from '@/components/ui/button';
import { cn, formatFileSize } from '@/lib/utils';
import { MAX_PORTFOLIO_IMAGES, MAX_IMAGE_SIZE_MB, SUPPORTED_IMAGE_TYPES } from '@/lib/constants';
import type { PortfolioImage } from '@/types/models';

function PortfolioImageCard({
  image,
  onDelete,
  isDeleting,
}: {
  image: PortfolioImage;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-muted aspect-[3/4]">
      <Image src={image.url} alt="Portfolio image" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 bg-error text-white text-xs px-3 py-1.5 rounded-full min-h-[44px]"
            aria-label="Delete this portfolio image"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Delete
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/20 text-white min-h-[44px]"
              aria-label="Cancel delete"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(image.id)}
              disabled={isDeleting}
              className="text-xs px-3 py-1.5 rounded-full bg-error text-white min-h-[44px]"
              aria-label="Confirm delete this image"
            >
              {isDeleting ? '…' : 'Confirm'}
            </button>
          </div>
        )}
      </div>

      {/* Size badge */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-black/60 text-white rounded-full px-2 py-0.5">
          {formatFileSize(image.sizeBytes)}
        </span>
      </div>
    </div>
  );
}

export default function DesignerPortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const { data: designer, isLoading } = useDesigner(user?.id || '');
  const { mutate: uploadImage, isPending: uploading } = useUploadPortfolioImage(user?.id || '');
  const { mutate: deleteImage, isPending: deleting } = useDeletePortfolioImage(user?.id || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  const images = designer?.portfolioImages ?? [];
  const canUpload = images.length < MAX_PORTFOLIO_IMAGES;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are supported');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    uploadImage(file, {
      onError: () => setUploadError('Upload failed. Please try again.'),
    });
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Portfolio</h1>
          <p className="text-textSecondary text-sm mt-1">
            {images.length} / {MAX_PORTFOLIO_IMAGES} images
          </p>
        </div>
        <Button
          className="bg-primary text-white gap-2"
          disabled={!canUpload || uploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload new portfolio image"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={handleFileSelect}
          aria-label="Select image file to upload"
        />
      </div>

      {uploadError && (
        <div role="alert" className="bg-error/10 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">
          {uploadError}
        </div>
      )}

      {!canUpload && (
        <div className="bg-warning/10 border border-warning/20 text-warning text-sm rounded-xl px-4 py-3 mb-4" role="status">
          Portfolio limit reached ({MAX_PORTFOLIO_IMAGES} images). Delete some to upload more.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-xl aspect-[3/4] animate-pulse" aria-hidden="true" />
          ))}
        </div>
      )}

      {!isLoading && images.length === 0 && (
        <div
          className="border-2 border-dashed border-border rounded-2xl py-20 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload your first portfolio image"
        >
          <ImagePlus className="w-12 h-12 mx-auto mb-3 text-border" aria-hidden="true" />
          <p className="font-medium text-textPrimary">Upload your first image</p>
          <p className="text-sm text-textSecondary mt-1">JPEG, PNG or WebP · Max {MAX_IMAGE_SIZE_MB}MB</p>
        </div>
      )}

      {!isLoading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list" aria-label="Portfolio images">
          {images.map((img) => (
            <div key={img.id} role="listitem">
              <PortfolioImageCard
                image={img}
                onDelete={(id) => deleteImage(id)}
                isDeleting={deleting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
