import * as cheerio from 'cheerio';
import type { ImportedRecipe } from '../../../shared/types/recipe.js';

interface SchemaRecipe {
  '@type'?: string | string[];
  name?: string;
  headline?: string;
  recipeIngredient?: string[];
  ingredients?: string[];
  recipeInstructions?: unknown;
  description?: string;
  image?: unknown;
}

interface ExtractedRecipe {
  title: string;
  ingredientsRaw: string;
  instructions: string;
  imageUrl: string | null;
  availableImages: string[];
}

interface HowToStep {
  '@type'?: string;
  text?: string;
  name?: string;
  itemListElement?: HowToStep[];
}

export async function scrapeRecipe(url: string): Promise<ImportedRecipe> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract images from various sources on the page
  const pageImages = extractPageImages($, url);

  // Try JSON-LD structured data first (most reliable)
  const jsonLdRecipe = extractJsonLdRecipe($);
  if (jsonLdRecipe) {
    // Merge page images with JSON-LD images, deduplicating
    const allImages = [...new Set([...jsonLdRecipe.availableImages, ...pageImages])];
    return {
      ...jsonLdRecipe,
      availableImages: allImages,
      sourceUrl: url,
      suggestedTags: [],
      extractionConfidence: 0.9,
    };
  }

  // Try microdata/schema.org attributes
  const microdataRecipe = extractMicrodataRecipe($, url);
  if (microdataRecipe) {
    const allImages = [...new Set([...microdataRecipe.availableImages, ...pageImages])];
    return {
      ...microdataRecipe,
      availableImages: allImages,
      sourceUrl: url,
      suggestedTags: [],
      extractionConfidence: 0.7,
    };
  }

  // Fall back to heuristic extraction
  const heuristicRecipe = extractHeuristicRecipe($, url);
  const allImages = [...new Set([...heuristicRecipe.availableImages, ...pageImages])];
  return {
    ...heuristicRecipe,
    availableImages: allImages,
    sourceUrl: url,
    suggestedTags: [],
    extractionConfidence: 0.4,
  };
}

// Clean HTML from text content
function cleanText(text: string | undefined | null): string {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

// Check if ingredient lines appear to lack quantities (just names without measurements)
function ingredientsLackQuantities(ingredientsRaw: string): boolean {
  const lines = ingredientsRaw.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;

  // Pattern to detect quantities: numbers, fractions, or unicode fractions
  const quantityPattern = /^[\d½¼¾⅓⅔⅛⅜⅝⅞]+|^\d+\/\d+/;

  // Count how many lines have quantities
  const withQuantity = lines.filter((line) => quantityPattern.test(line.trim())).length;

  // If less than 30% have quantities, consider them incomplete
  return withQuantity / lines.length < 0.3;
}

// Extract ingredients from HTML when JSON-LD is incomplete
// Handles both table-based and div-based layouts (like recipeland.com)
function extractTableIngredients($: cheerio.CheerioAPI): string | null {
  // Try div-based ingredient rows first (like recipeland.com)
  const divIngredients = extractDivBasedIngredients($);
  if (divIngredients && divIngredients.length >= 2) {
    return divIngredients.join('\n');
  }

  // Fall back to table-based extraction
  const tableSelectors = [
    'table.ingredients-body',
    'table.ingredients',
    '[class*="ingredient"] table',
    'table[class*="ingredient"]',
  ];

  for (const selector of tableSelectors) {
    const table = $(selector);
    if (table.length > 0) {
      const ingredients = extractIngredientsFromTable($, table);
      if (ingredients.length >= 2) {
        return ingredients.join('\n');
      }
    }
  }

  // Try any table with ingredient-like rows
  const tables = $('table');
  for (let i = 0; i < tables.length; i++) {
    const table = $(tables[i]);
    if (
      table.find('tr.ingredient-row, tr[class*="ingredient"]').length > 0 ||
      table.find('td.amount-measure, td[class*="amount"], td[class*="measure"]').length > 0
    ) {
      const ingredients = extractIngredientsFromTable($, table);
      if (ingredients.length >= 2) {
        return ingredients.join('\n');
      }
    }
  }

  return null;
}

// Extract ingredients from div-based layouts (like recipeland.com)
// Structure: div.ingredient-row > div.amount-measure + div.ingredient
function extractDivBasedIngredients($: cheerio.CheerioAPI): string[] | null {
  const ingredientRows = $('.ingredient-row, [class*="ingredient-row"]');
  if (ingredientRows.length < 2) return null;

  const ingredients: string[] = [];

  ingredientRows.each((_, row) => {
    const $row = $(row);

    // Extract amount from amount-measure div
    // Prefer US measurements (span.ir-us) over metric
    let amount = '';
    const amountDiv = $row.find('.amount-measure, [class*="amount"]').first();
    if (amountDiv.length > 0) {
      const usAmount = amountDiv.find('.ir-us, [class*="-us"]').first();
      if (usAmount.length > 0) {
        amount = cleanText(usAmount.text());
      } else {
        amount = cleanText(amountDiv.text());
      }
    }

    // Extract unit and ingredient name from ingredient div
    let unit = '';
    let ingredientName = '';
    const ingredientDiv = $row.find('.ingredient, [class*="ingredient"]').not('.ingredient-row').first();
    if (ingredientDiv.length > 0) {
      // Get US unit if available
      const usUnit = ingredientDiv.find('.ir-us, [class*="-us"]').first();
      if (usUnit.length > 0) {
        unit = cleanText(usUnit.text());
      }

      // Get ingredient name from link or text
      const link = ingredientDiv.find('a').first();
      if (link.length > 0) {
        ingredientName = cleanText(link.text());
      } else {
        // Remove unit spans and get remaining text
        const clone = ingredientDiv.clone();
        clone.find('.ir-us, .ir-metric, [class*="-us"], [class*="-metric"]').remove();
        ingredientName = cleanText(clone.text());
      }
    }

    // Combine parts
    if (ingredientName) {
      const parts = [amount, unit, ingredientName].filter((p) => p.length > 0);
      const combined = parts.join(' ').trim();
      if (combined.length > 1) {
        ingredients.push(combined);
      }
    }
  });

  return ingredients.length > 0 ? ingredients : null;
}

// Extract ingredient lines from a table element
function extractIngredientsFromTable(
  $: cheerio.CheerioAPI,
  table: ReturnType<typeof $>
): string[] {
  const ingredients: string[] = [];

  table.find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      // Try to identify amount and ingredient cells
      let amount = '';
      let ingredient = '';

      cells.each((idx, cell) => {
        const cellText = cleanText($(cell).text());
        const cellClass = $(cell).attr('class') || '';

        // Check for amount/measure cells by class or content
        if (
          cellClass.includes('amount') ||
          cellClass.includes('measure') ||
          cellClass.includes('quantity')
        ) {
          amount = cellText;
        } else if (cellClass.includes('ingredient') || cellClass.includes('name')) {
          ingredient = cellText;
        } else if (idx === 0 && /^[\d½¼¾⅓⅔⅛⅜⅝⅞\/\s]+$/.test(cellText)) {
          // First cell that looks like a measurement
          amount = cellText;
        } else if (!ingredient && cellText.length > 1) {
          // Assume other cells with text are ingredient names
          ingredient = cellText;
        }
      });

      // Combine amount and ingredient if both found
      if (ingredient) {
        const combined = amount ? `${normalizeAmount(amount)} ${ingredient}` : ingredient;
        if (combined.length > 1) {
          ingredients.push(combined.trim());
        }
      }
    }
  });

  return ingredients;
}

// Normalize amount strings (e.g., "¼ / 59" -> "¼ cup" or just "¼")
function normalizeAmount(amount: string): string {
  // Remove metric equivalents shown after slash (e.g., "¼ / 59" -> "¼")
  const cleaned = amount.replace(/\s*\/\s*[\d.]+\s*(mL|g|ml|grams?)?/gi, '').trim();

  // Map common fraction patterns to readable form
  return cleaned
    .replace(/1\/4/g, '¼')
    .replace(/1\/2/g, '½')
    .replace(/3\/4/g, '¾')
    .replace(/1\/3/g, '⅓')
    .replace(/2\/3/g, '⅔')
    .replace(/1\/8/g, '⅛');
}

function extractJsonLdRecipe($: cheerio.CheerioAPI): ExtractedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);
      const recipe = findRecipeInJsonLd(data);

      if (recipe) {
        const title = cleanText(recipe.name || recipe.headline);
        if (!title) continue;

        let ingredients = extractIngredients(recipe);
        const instructions = extractInstructions(recipe.recipeInstructions);
        const availableImages = extractAllImageUrls(recipe.image);
        const imageUrl = availableImages[0] ?? null;

        // Check if JSON-LD ingredients appear incomplete (missing quantities)
        // If most ingredients lack numbers/measurements, try HTML table extraction
        if (ingredients && ingredientsLackQuantities(ingredients)) {
          const tableIngredients = extractTableIngredients($);
          if (tableIngredients) {
            ingredients = tableIngredients;
          }
        }

        // Only return if we have meaningful content
        if (ingredients.length > 0 || instructions.length > 0) {
          return {
            title,
            ingredientsRaw: ingredients,
            instructions,
            imageUrl,
            availableImages,
          };
        }
      }
    } catch (e) {
      // Invalid JSON, continue to next script
      console.error('JSON-LD parse error:', e);
    }
  }

  return null;
}

function extractAllImageUrls(image: unknown): string[] {
  const images: string[] = [];

  if (!image) return images;

  // Simple string URL
  if (typeof image === 'string') {
    images.push(image);
    return images;
  }

  // Array of images
  if (Array.isArray(image)) {
    for (const img of image) {
      images.push(...extractAllImageUrls(img));
    }
    return images;
  }

  // Object with url property
  if (typeof image === 'object') {
    const imgObj = image as Record<string, unknown>;
    if (typeof imgObj.url === 'string') {
      images.push(imgObj.url);
    } else if (typeof imgObj['@id'] === 'string') {
      images.push(imgObj['@id']);
    }
  }

  return images;
}

function extractPageImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Look for Open Graph image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      images.push(resolved);
    }
  }

  // Look for Twitter card image
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      images.push(resolved);
    }
  }

  // Look for large images in the article/main content
  const contentSelectors = [
    '.recipe-image img',
    '.wprm-recipe-image img',
    '[class*="recipe"] img',
    'article img',
    '.post-content img',
    '.entry-content img',
    'main img',
  ];

  for (const selector of contentSelectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) {
        const resolved = resolveUrl(src, baseUrl);
        if (resolved && !seen.has(resolved) && isLikelyRecipeImage(resolved)) {
          seen.add(resolved);
          images.push(resolved);
        }
      }
    });
  }

  // Limit to first 10 images
  return images.slice(0, 10);
}

function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

function isLikelyRecipeImage(url: string): boolean {
  const lower = url.toLowerCase();
  // Skip tiny images, icons, logos, etc.
  if (lower.includes('icon') || lower.includes('logo') || lower.includes('avatar')) {
    return false;
  }
  if (lower.includes('1x1') || lower.includes('pixel') || lower.includes('tracking')) {
    return false;
  }
  // Check for common image extensions
  return /\.(jpg|jpeg|png|webp|gif)/i.test(lower);
}

function findRecipeInJsonLd(data: unknown): SchemaRecipe | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
    return null;
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const type = obj['@type'];

    // Check if this is a Recipe
    const isRecipe =
      type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));

    if (isRecipe) {
      return obj as unknown as SchemaRecipe;
    }

    // Check @graph array (common in WordPress sites)
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      return findRecipeInJsonLd(obj['@graph']);
    }

    // Check for nested mainEntity or mainEntityOfPage
    if (obj['mainEntity']) {
      const result = findRecipeInJsonLd(obj['mainEntity']);
      if (result) return result;
    }

    if (obj['mainEntityOfPage']) {
      const result = findRecipeInJsonLd(obj['mainEntityOfPage']);
      if (result) return result;
    }
  }

  return null;
}

function extractIngredients(recipe: SchemaRecipe): string {
  const ingredients = recipe.recipeIngredient || recipe.ingredients || [];

  if (!Array.isArray(ingredients)) return '';

  return ingredients
    .map((ing) => cleanText(String(ing)))
    .filter((ing) => ing.length > 0)
    .join('\n');
}

function extractInstructions(instructions: unknown): string {
  if (!instructions) return '';

  // Simple string
  if (typeof instructions === 'string') {
    return cleanText(instructions);
  }

  // Array of instructions
  if (Array.isArray(instructions)) {
    const steps: string[] = [];

    for (const item of instructions) {
      if (typeof item === 'string') {
        steps.push(cleanText(item));
      } else if (item && typeof item === 'object') {
        const step = item as HowToStep;

        // Handle HowToSection (groups of steps)
        if (step['@type'] === 'HowToSection' && step.itemListElement) {
          const sectionName = cleanText(step.name);
          if (sectionName) {
            steps.push(`\n**${sectionName}**`);
          }
          for (const subStep of step.itemListElement) {
            const text = cleanText(subStep.text || subStep.name);
            if (text) steps.push(text);
          }
        }
        // Handle HowToStep
        else if (step['@type'] === 'HowToStep') {
          const text = cleanText(step.text || step.name);
          if (text) steps.push(text);
        }
        // Handle plain objects with text
        else if (step.text) {
          steps.push(cleanText(step.text));
        }
        // Handle itemListElement at top level
        else if (step.itemListElement && Array.isArray(step.itemListElement)) {
          for (const subStep of step.itemListElement) {
            const text = cleanText(subStep.text || subStep.name);
            if (text) steps.push(text);
          }
        }
      }
    }

    // Number the steps if they don't already have section headers
    const hasHeaders = steps.some((s) => s.startsWith('\n**'));

    if (hasHeaders) {
      // Format with section headers preserved
      let stepNum = 0;
      return steps
        .map((step) => {
          if (step.startsWith('\n**')) {
            stepNum = 0;
            return step;
          }
          stepNum++;
          return `${stepNum}. ${step}`;
        })
        .join('\n\n');
    }

    return steps
      .filter((s) => s.length > 0)
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n\n');
  }

  // Single object (rare but possible)
  if (typeof instructions === 'object') {
    const step = instructions as HowToStep;
    const text = cleanText(step.text || step.name);
    return text ? `1. ${text}` : '';
  }

  return '';
}

function extractMicrodataRecipe(
  $: cheerio.CheerioAPI,
  baseUrl: string
): ExtractedRecipe | null {
  const recipeElement = $('[itemtype*="schema.org/Recipe"]');
  if (recipeElement.length === 0) return null;

  const title = cleanText(recipeElement.find('[itemprop="name"]').first().text());

  const ingredientElements = recipeElement.find(
    '[itemprop="recipeIngredient"], [itemprop="ingredients"]'
  );
  const ingredients = ingredientElements
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean)
    .join('\n');

  const instructionElements = recipeElement.find('[itemprop="recipeInstructions"]');
  let instructions = '';

  if (instructionElements.length === 1) {
    // Single block of instructions
    const el = instructionElements.first();
    const listItems = el.find('li');
    if (listItems.length > 0) {
      instructions = listItems
        .map((index, li) => `${index + 1}. ${cleanText($(li).text())}`)
        .get()
        .filter(Boolean)
        .join('\n\n');
    } else {
      instructions = cleanText(el.text());
    }
  } else {
    // Multiple instruction elements
    instructions = instructionElements
      .map((index, el) => `${index + 1}. ${cleanText($(el).text())}`)
      .get()
      .filter(Boolean)
      .join('\n\n');
  }

  // Extract image from microdata
  const availableImages: string[] = [];
  const imageElement = recipeElement.find('[itemprop="image"]');
  imageElement.each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('content') || $(el).attr('href');
    if (src) {
      const resolved = resolveUrl(src, baseUrl);
      if (resolved) availableImages.push(resolved);
    }
  });
  const imageUrl = availableImages[0] ?? null;

  if (title && (ingredients || instructions)) {
    return {
      title,
      ingredientsRaw: ingredients || 'Please add ingredients manually',
      instructions: instructions || 'Please add instructions manually',
      imageUrl,
      availableImages,
    };
  }

  return null;
}

function extractHeuristicRecipe($: cheerio.CheerioAPI, baseUrl: string): ExtractedRecipe {
  // Try to find title
  let title = '';

  // Look for recipe-specific title elements first
  const recipeTitleSelectors = [
    '.recipe-title',
    '.recipe-name',
    '.wprm-recipe-name',
    '.tasty-recipes-title',
    '[class*="recipe"] h1',
    '[class*="recipe"] h2',
    'article h1',
    'h1.title',
    'h1.entry-title',
    'h1',
  ];

  for (const selector of recipeTitleSelectors) {
    const el = $(selector).first();
    if (el.length > 0) {
      title = cleanText(el.text());
      if (title && title.length > 2 && title.length < 200) break;
    }
  }

  if (!title) {
    const pageTitle = $('title').text().split('|')[0] ?? '';
    title = cleanText(pageTitle.split('-')[0] ?? '');
  }

  // Look for ingredients
  let ingredients = '';

  // Try common recipe plugin selectors first
  const ingredientSelectors = [
    '.wprm-recipe-ingredient',
    '.tasty-recipes-ingredients li',
    '.recipe-ingredients li',
    '.ingredients li',
    '[class*="ingredient-list"] li',
    '[class*="ingredients"] li',
  ];

  for (const selector of ingredientSelectors) {
    const items = $(selector);
    if (items.length >= 2) {
      ingredients = items
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter((i) => i.length > 0)
        .join('\n');
      if (ingredients) break;
    }
  }

  // Fall back to heading-based search
  if (!ingredients) {
    const ingredientHeadings = $('h2, h3, h4').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('ingredient');
    });

    if (ingredientHeadings.length > 0) {
      const heading = ingredientHeadings.first();
      const list = heading.nextAll('ul, ol').first();
      if (list.length > 0) {
        ingredients = list
          .find('li')
          .map((_, el) => cleanText($(el).text()))
          .get()
          .filter(Boolean)
          .join('\n');
      }
    }
  }

  // Last resort: find any list that looks like ingredients
  if (!ingredients) {
    const lists = $('ul, ol');
    for (let i = 0; i < lists.length; i++) {
      const list = $(lists[i]);
      const items = list.find('li');
      if (items.length >= 3 && items.length <= 50) {
        const firstFewItems = items
          .slice(0, 3)
          .map((_, el) => $(el).text().toLowerCase())
          .get()
          .join(' ');

        // Check if it looks like ingredients
        if (
          /\d/.test(firstFewItems) ||
          /cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|lb|pound|gram|ml|liter|salt|sugar|butter|flour|oil|egg|milk|water|chicken|beef|onion|garlic/i.test(
            firstFewItems
          )
        ) {
          ingredients = items
            .map((_, el) => cleanText($(el).text()))
            .get()
            .filter(Boolean)
            .join('\n');
          break;
        }
      }
    }
  }

  // Look for instructions
  let instructions = '';

  // Try common recipe plugin selectors
  const instructionSelectors = [
    '.wprm-recipe-instruction',
    '.tasty-recipes-instructions li',
    '.recipe-instructions li',
    '.instructions li',
    '.directions li',
    '[class*="instruction"] li',
    '[class*="directions"] li',
    '[class*="steps"] li',
  ];

  for (const selector of instructionSelectors) {
    const items = $(selector);
    if (items.length >= 1) {
      instructions = items
        .map((index, el) => `${index + 1}. ${cleanText($(el).text())}`)
        .get()
        .filter((s) => s.length > 3)
        .join('\n\n');
      if (instructions) break;
    }
  }

  // Fall back to heading-based search
  if (!instructions) {
    const instructionHeadings = $('h2, h3, h4').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return (
        text.includes('instruction') ||
        text.includes('direction') ||
        text.includes('method') ||
        text.includes('steps') ||
        text.includes('how to make')
      );
    });

    if (instructionHeadings.length > 0) {
      const heading = instructionHeadings.first();
      const list = heading.nextAll('ol, ul').first();
      if (list.length > 0) {
        instructions = list
          .find('li')
          .map((index, el) => `${index + 1}. ${cleanText($(el).text())}`)
          .get()
          .filter(Boolean)
          .join('\n\n');
      } else {
        // Try paragraphs after heading
        const paragraphs = heading.nextUntil('h2, h3, h4').filter('p');
        if (paragraphs.length > 0) {
          instructions = paragraphs
            .map((index, el) => {
              const text = cleanText($(el).text());
              return text ? `${index + 1}. ${text}` : '';
            })
            .get()
            .filter(Boolean)
            .join('\n\n');
        }
      }
    }
  }

  return {
    title: title || 'Imported Recipe',
    ingredientsRaw: ingredients || 'Please add ingredients manually',
    instructions: instructions || 'Please add instructions manually',
    imageUrl: null,
    availableImages: [],
  };
}
