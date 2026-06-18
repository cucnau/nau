import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const globalProfileCache: Record<string, any> = {};
const pendingFetches: Record<string, Promise<any>> = {};

export function useUserProfilesCache(uids: string[]) {
  const [cache, setCache] = useState<Record<string, any>>({});

  useEffect(() => {
    let mounted = true;
    const fetchProfiles = async () => {
      const uidsToFetch = Array.from(new Set(uids.filter(Boolean)));
      let updatedCount = 0;
      
      const promises = uidsToFetch.map(async (uid) => {
        if (globalProfileCache[uid]) return;
        
        if (!pendingFetches[uid]) {
          pendingFetches[uid] = getDoc(doc(db, 'users', uid)).then(snap => {
            if (snap.exists()) {
              globalProfileCache[uid] = snap.data();
            } else {
              globalProfileCache[uid] = { _notext: true };
            }
          });
        }
        
        await pendingFetches[uid];
        updatedCount++;
      });
      
      await Promise.all(promises);
      
      if (mounted && updatedCount > 0) {
         setCache({ ...globalProfileCache }); // Trigger re-render with new data
      }
    };
    
    fetchProfiles();
    
    // Set initial cache
    setCache({ ...globalProfileCache });
    
    return () => {
      mounted = false;
    };
  }, [JSON.stringify(uids)]);

  return globalProfileCache;
}
