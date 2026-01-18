import { useState } from 'react';
import type { TagWithCount } from '../../../shared/types/tag';

interface TagFilterProps {
  tags: TagWithCount[];
  selectedTags: number[];
  onTagToggle: (tagId: number) => void;
  onTagDelete?: (tagId: number) => void;
  isLoading?: boolean;
}

export function TagFilter({ tags, selectedTags, onTagToggle, onTagDelete, isLoading }: TagFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="tag-filter-loading">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return null;
  }

  const selectedCount = selectedTags.length;

  return (
    <div className="tag-filter">
      <button
        type="button"
        className="tag-filter-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
      >
        <span className="tag-filter-title">
          Filter by Tag
          {selectedCount > 0 && (
            <span className="tag-filter-badge">{selectedCount}</span>
          )}
        </span>
        <span className={`tag-filter-arrow ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
      </button>
      {!isCollapsed && <div className="tag-list">
        {tags.map((tag) => (
          <div key={tag.id} className="tag-item">
            <button
              type="button"
              onClick={() => onTagToggle(tag.id)}
              className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
            >
              {tag.name}
              <span className="tag-count">{tag.recipeCount}</span>
            </button>
            {onTagDelete && (
              <button
                type="button"
                className={`tag-delete ${confirmDeleteId === tag.id ? 'confirm' : ''}`}
                onClick={() => {
                  if (confirmDeleteId === tag.id) {
                    onTagDelete(tag.id);
                    setConfirmDeleteId(null);
                  } else {
                    setConfirmDeleteId(tag.id);
                    setTimeout(() => setConfirmDeleteId(null), 3000);
                  }
                }}
                title={confirmDeleteId === tag.id ? 'Click to confirm delete' : 'Delete tag'}
              >
                {confirmDeleteId === tag.id ? '?' : '×'}
              </button>
            )}
          </div>
        ))}
      </div>}
      <style>{`
        .tag-filter {
          margin-top: 1rem;
        }
        .tag-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }
        .tag-filter-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .tag-filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.375rem;
          border-radius: 100px;
          background: var(--color-primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .tag-filter-arrow {
          font-size: 0.625rem;
          color: var(--color-text-muted);
          transition: transform 0.2s ease;
        }
        .tag-filter-arrow.collapsed {
          transform: rotate(-90deg);
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tag-item {
          display: inline-flex;
          align-items: center;
          position: relative;
        }
        .tag-item:hover .tag-delete {
          opacity: 1;
        }
        .tag-delete {
          position: absolute;
          right: -0.25rem;
          top: -0.25rem;
          width: 1.125rem;
          height: 1.125rem;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: var(--color-text-muted);
          color: var(--color-surface);
          font-size: 0.75rem;
          line-height: 1;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s ease, background 0.15s ease;
        }
        .tag-delete:hover {
          background: var(--color-danger, #dc3545);
        }
        .tag-delete.confirm {
          opacity: 1;
          background: var(--color-danger, #dc3545);
          animation: pulse 0.5s ease infinite alternate;
        }
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .tag-button {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 100px;
          background: var(--color-surface);
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }
        .tag-button:hover {
          border-color: var(--color-primary);
        }
        .tag-button.selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .tag-count {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .tag-button.selected .tag-count {
          color: rgba(255, 255, 255, 0.8);
        }
        .tag-filter-loading {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
