import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface Story {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  genres?: string[];
  chapterCount?: number;
  viewCount?: number;
  slug?: string;
  completed?: boolean;
  externalUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  _useLiveChapters?: boolean;
  _staticChapterCount?: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  requiresPass?: boolean;
  requiresEarlyAccess?: boolean;
  isLockedRead?: boolean;
  createdAt?: any;
}

export interface StoryJsonData {
  stories: Story[];
  chapters: Record<string, Chapter[]>;
}

// Memory cache for the static JSON data
let cachedJsonData: StoryJsonData | null = null;
let jsonCheckAttempted = false;
let isUsingStaticJson = false;

/**
 * Tries to load the static JSON file.
 * Returns true if successful, false otherwise.
 */
export async function initializeStoryLoader(): Promise<boolean> {
  if (jsonCheckAttempted) {
    return isUsingStaticJson;
  }

  try {
    const response = await fetch('/data/stories_data.json');
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.stories) && data.chapters) {
        cachedJsonData = data;
        isUsingStaticJson = true;
        console.log('🎉 [StoryLoader] Loaded stories & chapters successfully from static JSON!');
      }
    }
  } catch (err) {
    console.warn('[StoryLoader] Static JSON not found or failed to parse. Falling back to live Firestore.', err);
  } finally {
    jsonCheckAttempted = true;
  }

  return isUsingStaticJson;
}

/**
 * Force reload/refresh the static JSON check (useful after admin syncs)
 */
export async function refreshStoryLoader(): Promise<boolean> {
  jsonCheckAttempted = false;
  cachedJsonData = null;
  isUsingStaticJson = false;
  return initializeStoryLoader();
}

/**
 * Checks if we are currently serving data from the static JSON file.
 */
export function isStaticMode(): boolean {
  return isUsingStaticJson;
}

/**
 * Get all stories
 */
export async function getAllStories(): Promise<Story[]> {
  const useStatic = await initializeStoryLoader();
  
  // 1. Fetch live stories from Firestore to see if there are any new ones
  let liveStories: Story[] = [];
  try {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    liveStories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Story);
  } catch (err) {
    console.warn('[StoryLoader] Failed to fetch live stories from Firestore. Using static JSON if available.', err);
    if (useStatic && cachedJsonData) {
      return cachedJsonData.stories;
    }
    throw err;
  }

  // 2. If no static JSON is loaded, just return live stories
  if (!useStatic || !cachedJsonData) {
    return liveStories;
  }

  // 3. Merge static and live stories so that new/updated stories appear instantly
  const staticStoriesMap = new Map<string, Story>();
  cachedJsonData.stories.forEach(s => staticStoriesMap.set(s.id, s));

  const mergedStories = liveStories.map(liveStory => {
    const staticStory = staticStoriesMap.get(liveStory.id);
    if (staticStory) {
      const staticChaps = cachedJsonData?.chapters[liveStory.id] || [];
      const liveCount = liveStory.chapterCount || 0;
      const staticCount = staticChaps.length;
      
      return {
        ...staticStory,
        ...liveStory, // Merge latest metadata
        _useLiveChapters: liveCount > staticCount || !cachedJsonData?.chapters[liveStory.id],
        _staticChapterCount: staticCount
      };
    } else {
      // Brand new story!
      return {
        ...liveStory,
        _useLiveChapters: true,
        _staticChapterCount: 0
      };
    }
  });

  return mergedStories;
}

/**
 * Get a single story by ID or Slug
 */
export async function getStoryByIdOrSlug(idOrSlug: string): Promise<Story | null> {
  const useStatic = await initializeStoryLoader();
  
  // Try live first to ensure we always have the freshest metadata (viewCount, chapterCount)
  let liveStory: Story | null = null;
  try {
    const docRef = doc(db, 'stories', idOrSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      liveStory = { id: docSnap.id, ...docSnap.data() } as Story;
    } else {
      const q = query(collection(db, 'stories'), where('slug', '==', idOrSlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        liveStory = { id: snap.docs[0].id, ...snap.docs[0].data() } as Story;
      }
    }
  } catch (err) {
    console.warn(`[StoryLoader] Failed to fetch live story (${idOrSlug}). Trying static JSON...`, err);
  }

  if (useStatic && cachedJsonData) {
    const staticStory = cachedJsonData.stories.find(s => s.id === idOrSlug || s.slug === idOrSlug);
    if (staticStory) {
      if (liveStory) {
        const staticChaps = cachedJsonData.chapters[staticStory.id] || [];
        const liveCount = liveStory.chapterCount || 0;
        const staticCount = staticChaps.length;
        return {
          ...staticStory,
          ...liveStory,
          _useLiveChapters: liveCount > staticCount || !cachedJsonData.chapters[staticStory.id],
          _staticChapterCount: staticCount
        };
      }
      return staticStory;
    }
  }

  return liveStory;
}

/**
 * Get chapters of a story
 */
export async function getStoryChapters(storyId: string): Promise<Chapter[]> {
  const useStatic = await initializeStoryLoader();
  
  let useLiveChapters = true;
  let staticChapters: Chapter[] = [];

  if (useStatic && cachedJsonData) {
    staticChapters = cachedJsonData.chapters[storyId] || [];
    const staticStory = cachedJsonData.stories.find(s => s.id === storyId);
    
    if (staticStory) {
      try {
        const docRef = doc(db, 'stories', storyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const liveStory = docSnap.data();
          const liveCount = liveStory.chapterCount || 0;
          const staticCount = staticChapters.length;
          
          if (liveCount <= staticCount) {
            useLiveChapters = false;
          }
        } else {
          useLiveChapters = false;
        }
      } catch (err) {
        console.warn(`[StoryLoader] Failed to check live chapter count for story ${storyId}. Using static chapters.`, err);
        useLiveChapters = false;
      }
    }
  }

  if (!useLiveChapters && staticChapters.length > 0) {
    return [...staticChapters].sort((a, b) => a.order - b.order);
  }

  // Fallback to Firestore (for brand-new chapters or stories)
  try {
    const cSnap = await getDocs(query(collection(db, `stories/${storyId}/chapters`), orderBy('order', 'asc')));
    return cSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Chapter);
  } catch (err) {
    console.error(`[StoryLoader] Error fetching chapters for story ${storyId} from Firestore:`, err);
    if (staticChapters.length > 0) {
      return [...staticChapters].sort((a, b) => a.order - b.order);
    }
    throw err;
  }
}

/**
 * Get a specific chapter of a story
 */
export async function getChapterDoc(storyId: string, chapterId: string): Promise<Chapter | null> {
  const useStatic = await initializeStoryLoader();
  
  let staticChapter: Chapter | null = null;
  if (useStatic && cachedJsonData) {
    const storyChapters = cachedJsonData.chapters[storyId] || [];
    staticChapter = storyChapters.find(c => c.id === chapterId) || null;
  }

  // If found in static JSON, return it directly to save Firebase quota
  if (staticChapter) {
    return staticChapter;
  }

  // Fallback to Firestore (for newly created chapters that aren't in static JSON)
  try {
    const docSnap = await getDoc(doc(db, `stories/${storyId}/chapters`, chapterId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Chapter;
    }
    return null;
  } catch (err) {
    console.error(`[StoryLoader] Error fetching chapter ${chapterId} from Firestore:`, err);
    throw err;
  }
}
