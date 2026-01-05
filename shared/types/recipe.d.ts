import type { Tag } from './tag.js';
import type { Ingredient } from './ingredient.js';
export interface Recipe {
    id: number;
    title: string;
    ingredientsRaw: string;
    instructions: string;
    notes: string | null;
    sourceUrl: string | null;
    imageUrl: string | null;
    rating: number | null;
    createdAt: string;
    updatedAt: string;
}
export interface RecipeWithTags extends Recipe {
    tags: Tag[];
}
export interface RecipeDetail extends Recipe {
    tags: Tag[];
    ingredients: Ingredient[];
}
export interface RecipeInput {
    title: string;
    ingredientsRaw: string;
    instructions: string;
    notes?: string | null;
    sourceUrl?: string | null;
    imageUrl?: string | null;
    tagIds?: number[];
}
export interface ImportedRecipe {
    title: string;
    ingredientsRaw: string;
    instructions: string;
    sourceUrl: string;
    imageUrl: string | null;
    availableImages: string[];
    suggestedTags: string[];
    extractionConfidence: number;
}
//# sourceMappingURL=recipe.d.ts.map