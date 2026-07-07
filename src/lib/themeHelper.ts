// Theme helper to detect custom themes based on story properties, document IDs, or slugs.

// A small local memory cache to remember Firestore IDs mapping to themes
const idThemeCache: Record<string, 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap'> = {};

// Try to load cached mappings from localStorage on startup
try {
  const saved = localStorage.getItem('choco_story_theme_mappings');
  if (saved) {
    Object.assign(idThemeCache, JSON.parse(saved));
  }
} catch (e) {
  console.warn('Failed to load theme mappings from localStorage', e);
}

export function saveStoryThemeMapping(storyId: string, theme: 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap') {
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
): 'giagoan' | 'homer' | 'nhatky' | 'thuytien' | 'rinhrap' | null {
  // 1. Check title if available
  if (storyTitle) {
    const titleLower = storyTitle.toLowerCase();
    if (titleLower.includes('hướng dẫn giả ngoan')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'giagoan');
      return 'giagoan';
    }
    if (titleLower.includes('cánh cửa homer') || titleLower.includes('canh cua homer')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'homer');
      return 'homer';
    }
    if (titleLower.includes('nhật ký không tên') || titleLower.includes('nhat ky khong ten')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'nhatky');
      return 'nhatky';
    }
    if (titleLower.includes('thủy tiên') || titleLower.includes('thuy tien') || titleLower.includes('narcissus')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'thuytien');
      return 'thuytien';
    }
    if (titleLower.includes('rình rập') || titleLower.includes('rinh rap')) {
      if (storyIdOrSlug) saveStoryThemeMapping(storyIdOrSlug, 'rinhrap');
      return 'rinhrap';
    }
  }

  // 2. Check slug / ID text
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

    // 3. Check memory/localStorage cache for document ID
    if (idThemeCache[storyIdOrSlug]) {
      return idThemeCache[storyIdOrSlug];
    }
  }

  return null;
}
