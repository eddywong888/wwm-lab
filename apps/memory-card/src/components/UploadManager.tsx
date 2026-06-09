import React, { useState, useRef } from 'react';
import { saveCustomImage, deleteCustomImage } from '../utils/db';
import type { CustomImage } from '../utils/db';
import './UploadManager.css';

interface UploadManagerProps {
  customImages: CustomImage[];
  onImagesChanged: (images: CustomImage[]) => void;
  requiredPairs: number;
}

export const UploadManager: React.FC<UploadManagerProps> = ({
  customImages,
  onImagesChanged,
  requiredPairs,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    Array.from(files).forEach((file) => {
      if (!validImageTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported image type.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          // Default name is filename without extension
          const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const newImage: CustomImage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            dataUrl: event.target.result as string,
          };

          await saveCustomImage(newImage);
          const updated = [...customImages, newImage];
          onImagesChanged(updated);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleNameChange = async (id: string, newName: string) => {
    const updated = customImages.map((img) => {
      if (img.id === id) {
        return { ...img, name: newName };
      }
      return img;
    });
    onImagesChanged(updated);

    // Save to IndexedDB
    const target = updated.find((img) => img.id === id);
    if (target) {
      await saveCustomImage(target);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCustomImage(id);
    const updated = customImages.filter((img) => img.id !== id);
    onImagesChanged(updated);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const isRequirementMet = customImages.length >= requiredPairs;

  return (
    <div className="upload-manager">
      <div className="upload-header-row">
        <h3 className="upload-title">Custom Images Theme</h3>
        <span className={`upload-status-badge ${isRequirementMet ? 'success' : 'pending'}`}>
          {customImages.length} / {requiredPairs} pairs uploaded
        </span>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        role="button"
        tabIndex={0}
        aria-label="Upload custom card images"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileSelect();
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="file-input sr-only"
        />
        <svg
          className="upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p className="dropzone-text">
          Drag & drop images here, or <span className="browse-link">browse files</span>
        </p>
        <p className="dropzone-sub">Supports PNG, JPG, WEBP, GIF, SVG</p>
      </div>

      {!isRequirementMet && (
        <div className="upload-warning-banner">
          <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Needs {requiredPairs} pairs.</strong> You need to upload at least{' '}
            {requiredPairs - customImages.length} more unique image{requiredPairs - customImages.length === 1 ? '' : 's'} to play this difficulty level.
          </div>
        </div>
      )}

      {customImages.length > 0 && (
        <div className="uploaded-list-section">
          <h4 className="uploaded-list-title">Uploaded Cards ({customImages.length})</h4>
          <div className="uploaded-grid">
            {customImages.map((image) => (
              <div key={image.id} className="uploaded-card-item">
                <div className="uploaded-thumbnail-wrapper">
                  <img src={image.dataUrl} alt={image.name} className="uploaded-thumbnail" />
                  <button
                    className="delete-thumb-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    title="Delete image"
                    aria-label={`Delete ${image.name}`}
                  >
                    &times;
                  </button>
                </div>
                <input
                  type="text"
                  value={image.name}
                  onChange={(e) => handleNameChange(image.id, e.target.value)}
                  className="uploaded-card-input"
                  placeholder="Card Label"
                  title="Click to rename card label"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
