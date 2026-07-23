// Shared vendor registration options — keep admin and vendor forms in sync.

// Fashion & Lifestyle product categories (single-select on the form).
export const CATEGORIES = [
    "Women's Wear",
    "Men's Wear",
    'Kids Wear',
    'Fine Jewellery (Gold, Diamond & Precious Jewellery)',
    'Fashion / Artificial Jewellery',
    'Footwear',
    'Bags & Accessories',
    'Beauty & Skincare',
    'Fragrances & Perfumes',
    'Home Décor',
    'Home Furnishings',
    'Carpets & Rugs',
    'Furniture',
    'Packaged Food Products',
    'Handicrafts & Artisanal Products',
    'Gifts & Lifestyle',
    'Other (Please specify)',
];

// Food Court categories — the Food track is curated separately.
export const FOOD_CATEGORIES = [
    'Sweets & Desserts',
    'Snacks & Namkeen',
    'Bakery & Confectionery',
    'Beverages & Mocktails',
    'Ready-to-Eat / Cooked Food',
    'Dry Fruits & Nuts',
    'Pickles, Preserves & Condiments',
    'Packaged / Branded Food',
    'Other (Please specify)',
];

export const CITY_OPTIONS = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Any'];

// Single-city select on the registration form (no "Any").
export const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai'];

export const PRICE_RANGES = [
    'Under ₹500',
    '₹500–₹1,500',
    '₹1,500–₹5,000',
    '₹5,000–₹10,000',
    'Above ₹10,000',
];

export const STALL_SIZES = ["6' × 6'", "8' × 6'", "10' × 8'", 'Other'];

// Application tracks. FASHION = Fashion & Lifestyle brands, FOOD = Food Court.
export type ApplicationType = 'FASHION' | 'FOOD';

export const FOOD_NOTICE =
    "The Food Court is strictly curated. Submission of this form does not guarantee participation. If you're interested, please submit your details and our team will review your application. We will get in touch with shortlisted vendors if a suitable opportunity is available.";

export const CONSENT_TEXT =
    'I understand that submission of this form does not guarantee participation. Stall allotment is subject to the selection and approval of the Daawat-e-Ramzaan Management.';

// Upload document categories.
export type DocType = 'logo' | 'product' | 'id';
