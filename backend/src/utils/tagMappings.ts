// Keyword to tag mappings for auto-suggestion
// Keys are lowercase keywords to search for, values are suggested tag names

export const tagMappings: Record<string, string[]> = {
  // Cuisines
  pasta: ['Italian', 'Pasta'],
  spaghetti: ['Italian', 'Pasta'],
  lasagna: ['Italian', 'Pasta'],
  risotto: ['Italian'],
  parmesan: ['Italian'],
  mozzarella: ['Italian'],
  prosciutto: ['Italian'],

  taco: ['Mexican'],
  burrito: ['Mexican'],
  salsa: ['Mexican'],
  tortilla: ['Mexican'],
  jalapeno: ['Mexican'],
  cilantro: ['Mexican'],
  cumin: ['Mexican'],

  curry: ['Indian', 'Curry'],
  tikka: ['Indian'],
  masala: ['Indian'],
  naan: ['Indian'],
  garam: ['Indian'],
  turmeric: ['Indian'],

  teriyaki: ['Asian', 'Japanese'],
  'soy sauce': ['Asian'],
  ginger: ['Asian'],
  sesame: ['Asian'],
  tofu: ['Asian', 'Vegetarian', 'Vegan'],
  miso: ['Japanese'],
  sushi: ['Japanese'],

  kimchi: ['Korean'],
  gochujang: ['Korean'],

  wok: ['Asian', 'Chinese'],

  feta: ['Greek', 'Mediterranean'],
  olive: ['Mediterranean'],
  tzatziki: ['Greek'],
  hummus: ['Mediterranean', 'Middle Eastern'],

  // Meal types
  pancake: ['Breakfast'],
  waffle: ['Breakfast'],
  omelette: ['Breakfast'],
  omelet: ['Breakfast'],
  bacon: ['Breakfast', 'Pork'],
  cereal: ['Breakfast'],
  oatmeal: ['Breakfast'],
  toast: ['Breakfast'],

  soup: ['Soup'],
  stew: ['Soup', 'Comfort Food'],
  chowder: ['Soup', 'Seafood'],

  salad: ['Salad', 'Healthy'],

  sandwich: ['Lunch'],
  wrap: ['Lunch'],

  // Dietary
  tempeh: ['Vegetarian', 'Vegan'],
  lentil: ['Vegetarian', 'Healthy'],
  chickpea: ['Vegetarian', 'Healthy'],
  bean: ['Vegetarian', 'Healthy'],
  vegetable: ['Vegetarian'],

  chicken: ['Chicken', 'Poultry'],
  turkey: ['Poultry'],

  beef: ['Beef'],
  steak: ['Beef'],
  'ground beef': ['Beef'],

  pork: ['Pork'],
  ham: ['Pork'],

  salmon: ['Seafood', 'Fish'],
  shrimp: ['Seafood'],
  tuna: ['Seafood', 'Fish'],
  fish: ['Seafood', 'Fish'],
  crab: ['Seafood'],
  lobster: ['Seafood'],

  // Preparation style
  grill: ['Grilled'],
  grilled: ['Grilled'],
  bbq: ['Grilled', 'BBQ'],
  barbecue: ['Grilled', 'BBQ'],

  bake: ['Baking'],
  baked: ['Baking'],
  oven: ['Baking'],

  fry: ['Fried'],
  fried: ['Fried'],

  'slow cooker': ['Slow Cooker', 'Comfort Food'],
  crockpot: ['Slow Cooker', 'Comfort Food'],

  'instant pot': ['Instant Pot', 'Quick'],
  'pressure cooker': ['Instant Pot'],

  // Time/Difficulty
  'under 30': ['Quick'],
  '15 minute': ['Quick'],
  '20 minute': ['Quick'],
  easy: ['Easy'],
  simple: ['Easy'],
  quick: ['Quick'],

  // Desserts
  cake: ['Dessert', 'Baking'],
  cookie: ['Dessert', 'Baking'],
  brownie: ['Dessert', 'Baking'],
  pie: ['Dessert', 'Baking'],
  chocolate: ['Dessert'],
  'ice cream': ['Dessert'],
  pudding: ['Dessert'],
  cheesecake: ['Dessert'],

  // Health
  keto: ['Keto', 'Low Carb'],
  'low carb': ['Low Carb'],
  paleo: ['Paleo'],
  'gluten free': ['Gluten Free'],
  'gluten-free': ['Gluten Free'],
  'dairy free': ['Dairy Free'],
  'dairy-free': ['Dairy Free'],
  healthy: ['Healthy'],

  // Comfort food
  'mac and cheese': ['Comfort Food'],
  macaroni: ['Comfort Food', 'Pasta'],
  casserole: ['Comfort Food'],
  meatloaf: ['Comfort Food'],
  'mashed potato': ['Comfort Food'],
};
