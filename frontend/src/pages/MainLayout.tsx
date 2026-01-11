import { useState, useEffect, useRef } from 'react';
import { SearchPane } from '../components/SearchPane';
import { RecipeView } from '../components/RecipeView';
import { RecipeForm } from '../components/RecipeForm';
import { ImportDialog } from '../components/ImportDialog';
import { useRecipe } from '../hooks/useRecipe';
import { useRecipes } from '../hooks/useRecipes';
import { useCreateRecipe } from '../hooks/useCreateRecipe';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { useDeleteRecipe } from '../hooks/useDeleteRecipe';
import type { RecipeInput } from '../../../shared/types/recipe';
import { ApiClientError } from '../services/api';

type ViewMode = 'view' | 'create' | 'edit' | 'import';

export function MainLayout() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [formError, setFormError] = useState<string | null>(null);
  const [searchPaneCollapsed, setSearchPaneCollapsed] = useState(false);
  const hasSetInitialRecipe = useRef(false);

  // Fetch a random recipe on initial load
  const { data: randomRecipeData } = useRecipes({ sort: 'random', limit: 1 });

  // Set the random recipe as selected on initial load
  useEffect(() => {
    const firstRecipe = randomRecipeData?.recipes?.[0];
    if (!hasSetInitialRecipe.current && firstRecipe) {
      setSelectedRecipeId(firstRecipe.id);
      hasSetInitialRecipe.current = true;
    }
  }, [randomRecipeData]);

  const { data: recipe, isLoading: recipeLoading } = useRecipe(selectedRecipeId);
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const deleteMutation = useDeleteRecipe();

  const handleAddClick = () => {
    setSelectedRecipeId(null);
    setViewMode('create');
    setFormError(null);
  };

  const handleImportClick = () => {
    setSelectedRecipeId(null);
    setViewMode('import');
    setFormError(null);
  };

  const handleEditClick = () => {
    setViewMode('edit');
    setFormError(null);
  };

  const handleCancel = () => {
    setViewMode('view');
    setFormError(null);
  };

  const handleCreate = async (input: RecipeInput) => {
    try {
      const newRecipe = await createMutation.mutateAsync(input);
      setSelectedRecipeId(newRecipe.id);
      setViewMode('view');
      setFormError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create recipe');
      }
    }
  };

  const handleUpdate = async (input: RecipeInput) => {
    if (!selectedRecipeId) return;
    try {
      await updateMutation.mutateAsync({ id: selectedRecipeId, input });
      setViewMode('view');
      setFormError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to update recipe');
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedRecipeId) return;
    try {
      await deleteMutation.mutateAsync(selectedRecipeId);
      setSelectedRecipeId(null);
      setViewMode('view');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const handleSelectRecipe = (id: number) => {
    setSelectedRecipeId(id);
    setViewMode('view');
    setFormError(null);
    setSearchPaneCollapsed(true);
  };

  const toggleSearchPane = () => {
    setSearchPaneCollapsed((prev) => !prev);
  };

  return (
    <div className="main-layout">
      <aside className={`left-pane ${searchPaneCollapsed ? 'collapsed' : ''}`}>
        <SearchPane
          selectedRecipeId={selectedRecipeId}
          onSelectRecipe={handleSelectRecipe}
          onAddClick={handleAddClick}
          onImportClick={handleImportClick}
          isCollapsed={searchPaneCollapsed}
          onToggleCollapse={toggleSearchPane}
        />
      </aside>
      <main className="right-pane">
        <button
          type="button"
          className="mobile-search-toggle"
          onClick={toggleSearchPane}
          aria-label={searchPaneCollapsed ? 'Show search' : 'Hide search'}
        >
          {searchPaneCollapsed ? '☰ Search' : '✕ Close'}
        </button>
        {viewMode === 'create' && (
          <RecipeForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
            error={formError}
          />
        )}
        {viewMode === 'edit' && recipe && (
          <RecipeForm
            recipe={recipe}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
            error={formError}
          />
        )}
        {viewMode === 'import' && (
          <ImportDialog
            onSave={handleCreate}
            onCancel={handleCancel}
            isSaving={createMutation.isPending}
            saveError={formError}
          />
        )}
        {viewMode === 'view' && (
          <RecipeView
            recipe={recipe ?? null}
            isLoading={recipeLoading}
            onEdit={recipe ? handleEditClick : undefined}
            onDelete={recipe ? handleDelete : undefined}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </main>
    </div>
  );
}
