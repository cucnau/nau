import { db } from './firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { getGMT7Date, getWeeklyId } from '../types/achievements';

/**
 * Increment the daily and weekly fire points ("số lửa") of a story in Firestore.
 * @param storyId The ID of the story to update
 * @param firePoints The number of fire points to add (or subtract if negative)
 */
export async function addStoryFire(storyId: string, firePoints: number) {
  if (!storyId || firePoints === 0) return;
  try {
    const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
    const weekId = getWeeklyId();
    await updateDoc(doc(db, 'stories', storyId), {
      [`dailyViews.${todayStr}`]: increment(firePoints),
      [`weeklyViews.${weekId}`]: increment(firePoints)
    });
  } catch (err) {
    console.error('Error updating story fire:', err);
  }
}
