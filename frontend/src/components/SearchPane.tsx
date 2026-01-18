import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchBox } from './SearchBox';
import { TagFilter } from './TagFilter';
import { SortControls } from './SortControls';
import { RecipeList } from './RecipeList';
import { AddRecipeButton } from './AddRecipeButton';
import { useRecipes, type UseRecipesParams } from '../hooks/useRecipes';
import { useTags } from '../hooks/useTags';
import { useDeleteTag } from '../hooks/useDeleteTag';

interface SearchPaneProps {
  selectedRecipeId: number | null;
  onSelectRecipe: (id: number) => void;
  onAddClick: () => void;
  onImportClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SearchPane({ selectedRecipeId, onSelectRecipe, onAddClick, onImportClick, isCollapsed, onToggleCollapse }: SearchPaneProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<UseRecipesParams>({
    search: '',
    tags: [],
    sort: 'created_at',
    order: 'desc',
  });

  const { data: recipesData, isLoading: recipesLoading } = useRecipes(searchParams);
  const { data: tags, isLoading: tagsLoading } = useTags();
  const deleteTagMutation = useDeleteTag();

  const handleSearchChange = useCallback((search: string) => {
    setSearchParams((prev) => ({ ...prev, search }));
  }, []);

  const handleTagToggle = useCallback((tagId: number) => {
    setSearchParams((prev) => {
      const tags = prev.tags || [];
      const newTags = tags.includes(tagId)
        ? tags.filter((id) => id !== tagId)
        : [...tags, tagId];
      return { ...prev, tags: newTags };
    });
  }, []);

  const handleTagDelete = useCallback((tagId: number) => {
    // Remove from selected tags if present
    setSearchParams((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((id) => id !== tagId),
    }));
    deleteTagMutation.mutate(tagId);
  }, [deleteTagMutation]);

  const handleSortChange = useCallback((sort: UseRecipesParams['sort']) => {
    setSearchParams((prev) => ({ ...prev, sort }));
  }, []);

  const handleOrderChange = useCallback((order: UseRecipesParams['order']) => {
    setSearchParams((prev) => ({ ...prev, order }));
  }, []);

  const handleShuffle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recipes', searchParams] });
  }, [queryClient, searchParams]);

  return (
    <div className="search-pane">
      <div className="search-pane-mobile-header">
        <span>Search & Filter</span>
        <button
          type="button"
          className="search-pane-close-btn"
          onClick={onToggleCollapse}
          aria-label="Close search pane"
        >
          ✕
        </button>
      </div>
      <div className="search-pane-actions">
        <button type="button" onClick={onAddClick} className="btn-add">
          + Add Recipe
        </button>
        <button type="button" onClick={onImportClick} className="btn-import">
          Import from URL
        </button>
      </div>
      <div className="search-pane-filters">
        <SearchBox
          value={searchParams.search || ''}
          onChange={handleSearchChange}
        />
        <TagFilter
          tags={tags || []}
          selectedTags={searchParams.tags || []}
          onTagToggle={handleTagToggle}
          onTagDelete={handleTagDelete}
          isLoading={tagsLoading}
        />
        <SortControls
          sort={searchParams.sort || 'created_at'}
          order={searchParams.order || 'desc'}
          onSortChange={handleSortChange}
          onOrderChange={handleOrderChange}
          onShuffle={handleShuffle}
        />
      </div>
      <div className="search-pane-results">
        <RecipeList
          recipes={recipesData?.recipes || []}
          selectedId={selectedRecipeId}
          onSelect={onSelectRecipe}
          isLoading={recipesLoading}
          total={recipesData?.total}
        />
      </div>
      <style>{`
        .search-pane {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .search-pane-mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .search-pane-mobile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 1rem;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid var(--color-border);
            font-weight: 600;
            font-size: 1.125rem;
          }
          .search-pane-close-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            color: var(--color-text-muted);
            padding: 0.25rem 0.5rem;
            cursor: pointer;
          }
          .search-pane-close-btn:hover {
            color: var(--color-text);
          }
        }
        .search-pane-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .btn-add {
          flex: 1;
          padding: 0.75rem;
          background: var(--color-primary);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .btn-add:hover {
          background: var(--color-primary-hover);
        }
        .btn-import {
          flex: 1;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--color-primary);
          border-radius: 4px;
          color: var(--color-primary);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .btn-import:hover {
          background: rgba(13, 110, 253, 0.1);
        }
        .search-pane-filters {
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .search-pane-results {
          flex: 1;
          overflow: hidden;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
