export type GachaRarity = 3 | 4 | 5;

export interface GachaItem {
  id: string;
  name: string;
  rarity: GachaRarity;
  type: 'sticker' | 'fragment';
  image?: string;
  description?: string;
}

export interface GachaBanner {
  id: string;
  type: 'standard' | 'limited';
  name: string;
  description: string;
  image: string;
  pool5Star: GachaItem[];
  pool4Star: GachaItem[];
  pool3Star: GachaItem[];
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export const GACHA_STANDARD_BANNER: GachaBanner = {
  id: 'standard-cup',
  type: 'standard',
  name: 'Cốc Choco Nóng',
  description: 'Banner Thường',
  image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop', // Hot chocolate cup
  active: true,
  pool5Star: [],
  pool4Star: [],
  pool3Star: [
    { id: 's3-1', name: '10 Mảnh Choco', rarity: 3, type: 'fragment' },
  ]
};

// Rate constants
export const RATE_5_STAR_BASE = 0.006;
export const RATE_4_STAR_BASE = 0.051;
// Pity thresholds
export const PITY_5_STAR = 90;
export const PITY_4_STAR = 10;
