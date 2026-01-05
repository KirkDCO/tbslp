import type { RecipeWithTags } from './recipe.js';
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
export interface RecipeListResponse {
    recipes: RecipeWithTags[];
    total: number;
    limit: number;
    offset: number;
}
export interface RecipeSearchParams {
    search?: string;
    tags?: string;
    ingredient?: string;
    sort?: 'title' | 'rating' | 'created_at' | 'updated_at';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface PurgeResult {
    purgedCount: number;
}
//# sourceMappingURL=api.d.ts.map