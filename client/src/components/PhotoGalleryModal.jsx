import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './PhotoGalleryModal.css';

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  images = [],
  resourceName = 'Resource Photos',
  resourceType = 'Facility'
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize image list
  let imgList = [];
  if (Array.isArray(images)) {
    imgList = images.filter(Boolean);
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images);
      imgList = Array.isArray(parsed) ? parsed.filter(Boolean) : [images];
    } catch {
      imgList = [images];
    }
  }

  // Reset index when opened or images change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && imgList.length > 1) {
        setCurrentIndex((prev) => (prev === 0 ? imgList.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight' && imgList.length > 1) {
        setCurrentIndex((prev) => (prev === imgList.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, imgList.length, onClose]);

  if (!isOpen || imgList.length === 0) return null;

  const currentImage = imgList[currentIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imgList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === imgList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="pg-modal-backdrop" onClick={onClose}>
      <div className="pg-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pg-modal-header">
          <div className="pg-modal-title-wrap">
            <span className="pg-modal-badge">{resourceType}</span>
            <h3 className="pg-modal-title">{resourceName}</h3>
          </div>
          <div className="pg-modal-actions">
            <span className="pg-modal-counter">
              {currentIndex + 1} / {imgList.length}
            </span>
            <button className="pg-modal-close-btn" onClick={onClose} title="Close gallery (Esc)">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="pg-stage">
          {imgList.length > 1 && (
            <button
              className="pg-nav-btn pg-nav-btn--prev"
              onClick={handlePrev}
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div className="pg-active-image-wrap">
            <img
              src={currentImage}
              alt={`${resourceName} photo ${currentIndex + 1}`}
              className="pg-active-image"
            />
          </div>

          {imgList.length > 1 && (
            <button
              className="pg-nav-btn pg-nav-btn--next"
              onClick={handleNext}
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Thumbnails Strip */}
        {imgList.length > 1 && (
          <div className="pg-thumbs-strip">
            {imgList.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`pg-thumb-btn ${idx === currentIndex ? 'pg-thumb-btn--active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="pg-thumb-img" />
                {idx === 0 && <span className="pg-thumb-primary-tag">Primary</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
