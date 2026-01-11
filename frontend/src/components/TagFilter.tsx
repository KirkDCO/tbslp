import { useState } from 'react';
import type { TagWithCount } from '../../../shared/types/tag';

interface TagFilterProps {
  tags: TagWithCount[];
  selectedTags: number[];
  onTagToggle: (tagId: number) => void;
  isLoading?: boolean;
}

export function TagFilter({ tags, selectedTags, onTagToggle, isLoading }: TagFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          <button
            key={tag.id}
            type="button"
            onClick={() => onTagToggle(tag.id)}
            className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
          >
            {tag.name}
            <span className="tag-count">{tag.recipeCount}</span>
          </button>
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
