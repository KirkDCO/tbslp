export interface Tag {
    id: number;
    name: string;
    createdAt: string;
}
export interface TagWithCount extends Tag {
    recipeCount: number;
}
export interface TagSuggestion {
    name: string;
    confidence: number;
    existingTagId: number | null;
}
//# sourceMappingURL=tag.d.ts.map