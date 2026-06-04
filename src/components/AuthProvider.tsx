import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore } from '../store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setFirebaseUser, syncFromFirebase } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        
        // Ensure user document exists in firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create new user profile in Firestore
          const isEditor = user.email === 'cucnau01@gmail.com';
          const newUser = {
            uid: user.uid,
            choco: isEditor ? 9999999 : 0,
            goldenChoco: isEditor ? 9999999 : 0,
            level: 1,
            exp: 0,
            createdAt: serverTimestamp(),
            displayName: user.displayName || 'Reader ' + user.uid.slice(0,4),
            email: user.email || '',
            avatarUrl: user.photoURL || '',
            checkInStreak: 0,
            lastCheckInDate: '',
            
            // Initializing Achievements and Active Points fields
            unlockedAchievements: [],
            claimedAchievements: [],
            totalEarnedChoco: isEditor ? 9999999 : 0,
            totalEarnedGChoco: isEditor ? 9999999 : 0,
            totalSpentChoco: 0,
            totalCheckIns: 0,
            perfectDailyDates: [],
            sentMessagesCount: 0,
            genresRead: [],
            activePoints: 0,
            lastActiveWeek: '',
            prevActivePoints: 0,
            prevActiveWeek: '',
            activeTitle: null,
          };
          try {
            await setDoc(userRef, newUser);
            // Replace serverTimestamp with Date.now() for local state
            syncFromFirebase({ ...newUser, createdAt: Date.now() });
          } catch(e) {
            console.error('Error creating user doc', e);
          }
        } else {
          const data = userSnap.data();
          if (data.isBanned) {
            alert('Tài khoản của bạn đã bị khóa hoặc cấm truy cập.');
            auth.signOut();
            return;
          }
          if (user.email === 'cucnau01@gmail.com' && (data.choco < 999999 || data.goldenChoco < 999999)) {
            data.choco = 9999999;
            data.goldenChoco = 9999999;
            await setDoc(userRef, { choco: 9999999, goldenChoco: 9999999 }, { merge: true });
          }
          syncFromFirebase(data);
        }
        
        login(user.displayName || 'Reader'); // Keep fallback for existing components
        useStore.getState()._ensureActiveWeekCalculations();
      } else {
        setFirebaseUser(null);
        logout();
      }
    });

    return () => unsubscribe();
  }, [login, logout, setFirebaseUser, syncFromFirebase]);

  return <>{children}</>;
}
