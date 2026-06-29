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
  if (useStatic && cachedJsonData) {
    return cachedJsonData.stories;
  }

  // Fallback to Firestore
  try {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Story);
  } catch (err) {
    console.error('[StoryLoader] Error fetching stories from Firestore:', err);
    throw err;
  }
}

/**
 * Get a single story by ID or Slug
 */
export async function getStoryByIdOrSlug(idOrSlug: string): Promise<Story | null> {
  const useStatic = await initializeStoryLoader();
  if (useStatic && cachedJsonData) {
    const story = cachedJsonData.stories.find(s => s.id === idOrSlug || s.slug === idOrSlug);
    return story || null;
  }

  // Fallback to Firestore
  try {
    // Try by ID first
    const docRef = doc(db, 'stories', idOrSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Story;
    }

    // Try by Slug
    const q = query(collection(db, 'stories'), where('slug', '==', idOrSlug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Story;
    }

    return null;
  } catch (err) {
    console.error(`[StoryLoader] Error fetching story (${idOrSlug}) from Firestore:`, err);
    throw err;
  }
}

/**
 * Get chapters of a story
 */
export async function getStoryChapters(storyId: string): Promise<Chapter[]> {
  const useStatic = await initializeStoryLoader();
  if (useStatic && cachedJsonData) {
    const list = cachedJsonData.chapters[storyId] || [];
    // Sort ascending by order
    return [...list].sort((a, b) => a.order - b.order);
  }

  // Fallback to Firestore
  try {
    const cSnap = await getDocs(query(collection(db, `stories/${storyId}/chapters`), orderBy('order', 'asc')));
    return cSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Chapter);
  } catch (err) {
    console.error(`[StoryLoader] Error fetching chapters for story ${storyId} from Firestore:`, err);
    throw err;
  }
}

/**
 * Get a specific chapter of a story
 */
export async function getChapterDoc(storyId: string, chapterId: string): Promise<Chapter | null> {
  const useStatic = await initializeStoryLoader();
  if (useStatic && cachedJsonData) {
    const storyChapters = cachedJsonData.chapters[storyId] || [];
    const chapter = storyChapters.find(c => c.id === chapterId);
    return chapter || null;
  }

  // Fallback to Firestore
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
