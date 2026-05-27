'use client';
// ============================================================================
// SceneCard — Individual Scene Display Card
// Shows scene preview, title, duration, and edit controls
// ============================================================================

import { VideoScene } from '@/types/video.types';
import { TRANSITION_OPTIONS } from '@/constants/video-constants';
import {
  GripVertical,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Type,
} from 'lucide-react';
import { useState } from 'react';

interface SceneCardProps {
  scene: VideoScene;
  onUpdate: (id: string, updates: Partial<VideoScene>) => void;
  onRemove: (id: string) => void;
  canRemove?: boolean;
}

export default function SceneCard({
  scene,
  onUpdate,
  onRemove,
  canRemove = true,
}: SceneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="scene-card">
      {/* Scene Header */}
      <div className="scene-card-header">
        <div className="scene-card-grip">
          <GripVertical size={16} />
        </div>

        <div className="scene-card-preview" style={{ background: scene.background }}>
          <span className="scene-card-icon">{scene.icon || '📌'}</span>
        </div>

        <div className="scene-card-info">
          <input
            type="text"
            className="scene-card-title-input"
            value={scene.title}
            onChange={(e) => onUpdate(scene.id, { title: e.target.value })}
            placeholder="Tên scene..."
          />
          <div className="scene-card-meta">
            <Clock size={12} />
            <span>{scene.duration}s</span>
            <span>·</span>
            <span>{TRANSITION_OPTIONS.find(t => t.id === scene.transition)?.name || 'Fade'}</span>
          </div>
        </div>

        <div className="scene-card-actions">
          <button
            className="scene-card-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canRemove && (
            <button
              className="scene-card-btn scene-card-btn-delete"
              onClick={() => onRemove(scene.id)}
              title="Xóa scene"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="scene-card-body">
          {/* Duration */}
          <div className="scene-card-field">
            <label>Thời lượng (giây)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={scene.duration}
              onChange={(e) => onUpdate(scene.id, { duration: Number(e.target.value) })}
              className="form-input"
            />
          </div>

          {/* Text Overlay */}
          <div className="scene-card-field">
            <label><Type size={12} /> Text hiển thị</label>
            <input
              type="text"
              value={scene.textOverlay || ''}
              onChange={(e) => onUpdate(scene.id, { textOverlay: e.target.value })}
              className="form-input"
              placeholder="Text trên màn hình..."
            />
          </div>

          {/* Text Size */}
          <div className="scene-card-field">
            <label>Cỡ chữ</label>
            <div className="scene-card-options">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  className={`scene-option-btn ${scene.textSize === size ? 'active' : ''}`}
                  onClick={() => onUpdate(scene.id, { textSize: size })}
                >
                  {size === 'small' ? 'Nhỏ' : size === 'medium' ? 'Vừa' : 'Lớn'}
                </button>
              ))}
            </div>
          </div>

          {/* Text Position */}
          <div className="scene-card-field">
            <label>Vị trí text</label>
            <div className="scene-card-options">
              {(['top', 'center', 'bottom'] as const).map(pos => (
                <button
                  key={pos}
                  className={`scene-option-btn ${scene.textPosition === pos ? 'active' : ''}`}
                  onClick={() => onUpdate(scene.id, { textPosition: pos })}
                >
                  {pos === 'top' ? 'Trên' : pos === 'center' ? 'Giữa' : 'Dưới'}
                </button>
              ))}
            </div>
          </div>

          {/* Transition */}
          <div className="scene-card-field">
            <label>Chuyển cảnh</label>
            <select
              className="form-select"
              value={scene.transition}
              onChange={(e) => onUpdate(scene.id, { transition: e.target.value as any })}
            >
              {TRANSITION_OPTIONS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="scene-card-field">
            <label>Mô tả</label>
            <textarea
              className="form-input"
              value={scene.description}
              onChange={(e) => onUpdate(scene.id, { description: e.target.value })}
              rows={2}
              style={{ resize: 'vertical', minHeight: '50px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
