// Theme helper to detect custom themes based on story properties, document IDs, or slugs.

// A static mapping for known story IDs to avoid waiting for title load or cache load.
const staticIdToThemeMap: Record<string, 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap' | 'thientai' | 'nguoidep' | 'thaitu' | 'hoangyen'> = {
  'huXx6uVvZbgNiE7ExoKo': 'homer',
  'TekklEWE3Eli1YFuyE5z': 'nhatky',
  'TyIFHdGAqP7LMXAhL44k': 'giagoan',
  'nedBjLcOKO1egv2kAWZc': 'thuytien',
  'y1jPoVWfSBVaWFwoRt6x': 'rinhrap',
  '5D5LiyrtXbfJHqGNCM7K': 'rinhrap', // ID of the Rình Rập story in user's Vercel production db
};

// A small local memory cache to remember Firestore IDs mapping to themes
const idThemeCache: Record<string, 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap' | 'thientai' | 'nguoidep' | 'thaitu' | 'hoangyen'> = {};

// Try to load cached mappings from localStorage on startup
try {
  const saved = localStorage.getItem('choco_story_theme_mappings');
  if (saved) {
    Object.assign(idThemeCache, JSON.parse(saved));
  }
} catch (e) {
  console.warn('Failed to load theme mappings from localStorage', e);
}

export function saveStoryThemeMapping(storyId: string, theme: 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap' | 'thientai' | 'nguoidep' | 'thaitu' | 'hoangyen') {
  if (!storyId || !theme) return;
  idThemeCache[storyId] = theme;
  try {
    localStorage.setItem('choco_story_theme_mappings', JSON.stringify(idThemeCache));
  } catch (e) {
    console.warn('Failed to save theme mapping to localStorage', e);
  }
}

export function detectStoryTheme(
  storyTitle?: string,
  storyIdOrSlug?: string
): 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap' | 'thientai' | 'nguoidep' | 'thaitu' | 'hoangyen' | null {
  // 1. Check static ID mapping first (instant match for known IDs)
  if (storyIdOrSlug && staticIdToThemeMap[storyIdOrSlug]) {
    return staticIdToThemeMap[storyIdOrSlug];
  }

  // 2. Check title if available
  if (storyTitle) {
    // Normalize to NFC and remove diacritics for robust matching
    const normalizedTitle = storyTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const rawTitle = storyTitle.toLowerCase();

    if (rawTitle.includes('hướng dẫn giả ngoan') || normalizedTitle.includes('huong dan gia ngoan') || normalizedTitle.includes('gia ngoan')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'giagoan');
      return 'giagoan';
    }
    if (rawTitle.includes('cánh cửa homer') || normalizedTitle.includes('canh cua homer') || normalizedTitle.includes('homer')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'homer');
      return 'homer';
    }
    if (rawTitle.includes('nhật ký không tên') || normalizedTitle.includes('nhat ky khong ten')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'nhatky');
      return 'nhatky';
    }
    if (rawTitle.includes('thủy tiên') || normalizedTitle.includes('thuy tien') || normalizedTitle.includes('narcissus')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'thuytien');
      return 'thuytien';
    }
    if (rawTitle.includes('rình rập') || normalizedTitle.includes('rinh rap')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'rinhrap');
      return 'rinhrap';
    }
    if (rawTitle.includes('thien tai thao tac') || normalizedTitle.includes('thien tai thao tac') || rawTitle.includes('thiên tài thao tác')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'thientai');
      return 'thientai';
    }
    if (rawTitle.includes('nguoi dep om yeu') || normalizedTitle.includes('nguoi dep om yeu') || rawTitle.includes('người đẹp ốm yếu') || rawTitle.includes('giãy giụa') || normalizedTitle.includes('giay giua')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'nguoidep');
      return 'nguoidep';
    }
    if (rawTitle.includes('thái tử') || normalizedTitle.includes('thai tu') || normalizedTitle.includes('van thuo')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'thaitu');
      return 'thaitu';
    }
    if (rawTitle.includes('chim hoàng yến') || rawTitle.includes('chim hoang yen') || normalizedTitle.includes('chim hoang yen')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'hoangyen');
      return 'hoangyen';
    }
  }

  // 3. Check slug / ID text
  if (storyIdOrSlug) {
    const lower = storyIdOrSlug.toLowerCase();
    if (lower.includes('gia-ngoan') || lower.includes('giagoan') || lower === 'giagoan') {
      return 'giagoan';
    }
    if (lower.includes('homer') || lower.includes('canh-cua-homer') || lower === 'homer') {
      return 'homer';
    }
    if (lower.includes('nhat-ky') || lower.includes('nhatky') || lower === 'nhatkykhongten' || lower === 'nhatky') {
      return 'nhatky';
    }
    if (lower.includes('thuy-tien') || lower.includes('thuytien') || lower.includes('narcissus')) {
      return 'thuytien';
    }
    if (lower.includes('rinh-rap') || lower.includes('rinhrap') || lower === 'rinhrap') {
      return 'rinhrap';
    }
    if (lower.includes('thien-tai') || lower.includes('thientai') || lower.includes('thao-tac') || lower === 'thientai') {
      return 'thientai';
    }
    if (lower.includes('nguoi-dep') || lower.includes('om-yeu') || lower.includes('nguoidep') || lower.includes('omyeu')) {
      return 'nguoidep';
    }
    if (lower.includes('thai-tu') || lower.includes('thaitu') || lower.includes('van-thuo')) {
      return 'thaitu';
    }
    if (lower.includes('chim-hoang-yen') || lower.includes('chimhoangyen') || lower.includes('hoang-yen') || lower.includes('hoangyen')) {
      return 'hoangyen';
    }

    // 4. Check memory/localStorage cache for document ID
    if (idThemeCache[storyIdOrSlug]) {
      const cached = idThemeCache[storyIdOrSlug];
      if (['giagoan', 'homer', 'nhatky', 'thuytien', 'rinhrap', 'thientai', 'nguoidep', 'thaitu', 'hoangyen'].includes(cached as string)) {
        return cached;
      }
    }
  }

  return null;
}
