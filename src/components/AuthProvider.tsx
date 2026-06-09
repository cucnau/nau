import React, { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';
import { ACHIEVEMENTS_LIST } from '../types/achievements';
import { auth, db } from '../lib/firebase';
import { useStore } from '../store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setFirebaseUser, syncFromFirebase } = useStore();

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    // Handle redirect result to catch any login errors on redirect-back (e.g. unauthorized-domain)
    getRedirectResult(auth).catch((error: any) => {
      console.error('Redirect auth error:', error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert(
          'Lỗi: Tên miền này chưa được cấp phép đăng ký/đăng nhập trong Firebase Auth!\n\n' +
          'Bạn cần thêm "nau-self.vercel.app" vào danh sách "Authorized domains" trong Firebase Console:\n' +
          '1. Truy cập: https://console.firebase.google.com/project/valued-year-b4wsx/authentication/providers\n' +
          '2. Chọn tab Settings (Cấu hình) -> Authorized domains (Miền được ủy quyền).\n' +
          '3. Nhấp "Thêm miền" và nhập đúng: nau-self.vercel.app'
        );
      } else {
        alert('Đăng nhập qua chuyển hướng thất bại: ' + (error?.message || String(error)));
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (user) {
        setFirebaseUser(user);
        
        // Ensure user document exists in firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Create new user profile in Firestore
            const isEditor = user.email?.toLowerCase() === 'cucnau01@gmail.com';
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
              lastDailyResetDate: '',
              lastWeeklyResetId: '',
              
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
              if ((e as any)?.code === 'resource-exhausted') {
                alert('Hệ thống cơ sở dữ liệu đã đạt giới hạn quota miễn phí hôm nay. Vui lòng thử lại sau 24h hoặc nâng cấp gói Firebase.');
              }
            }
          } else {
            const data = userSnap.data();
            if (data.isBanned) {
              if (data.banExpiresAt && data.banExpiresAt > Date.now()) {
                alert(`Tài khoản của bạn đã bị khóa đến ${new Date(data.banExpiresAt).toLocaleString('vi-VN')}.`);
                auth.signOut();
                return;
              } else if (!data.banExpiresAt) {
                alert('Tài khoản của bạn đã bị khóa vĩnh viễn.');
                auth.signOut();
                return;
              } else {
                // Ban expired, remove ban status
                try {
                  await setDoc(userRef, { isBanned: false, banExpiresAt: null }, { merge: true });
                } catch(e) {}
              }
            }
            if (user.email?.toLowerCase() === 'cucnau01@gmail.com' && (data.choco < 999999 || data.goldenChoco < 999999)) {
              try {
                await setDoc(userRef, { choco: 9999999, goldenChoco: 9999999 }, { merge: true });
              } catch (e) {
                console.error('Error updating admin doc', e);
              }
            }
          }

          // Register real-time reference updates for the user profile
          unsubUserDoc = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const latestData = snapshot.data();
              // Validate real-time account ban status
              if (latestData.isBanned) {
                if (latestData.banExpiresAt && latestData.banExpiresAt > Date.now()) {
                  alert(`Tài khoản của bạn đã bị khóa đến ${new Date(latestData.banExpiresAt).toLocaleString('vi-VN')}.`);
                  auth.signOut();
                  return;
                } else if (!latestData.banExpiresAt) {
                  alert('Tài khoản của bạn đã bị khóa vĩnh viễn.');
                  auth.signOut();
                  return;
                }
              }
              // Sync state to local Zustand store in real-time
              syncFromFirebase(latestData);
            }
          }, (err) => {
            console.error('Error listening to user document updates:', err);
          });

        } catch (e) {
             console.error('Error fetching/processing user doc', e);
             if ((e as any)?.code === 'resource-exhausted') {
                alert('Hệ thống cơ sở dữ liệu đã đạt giới hạn quota miễn phí hôm nay. Vui lòng thử lại sau 24h hoặc nâng cấp gói Firebase.');
             }
        }
        
        login(user.displayName || 'Reader'); // Keep fallback for existing components
        useStore.getState()._ensureActiveWeekCalculations();
      } else {
        setFirebaseUser(null);
        logout();
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, [login, logout, setFirebaseUser, syncFromFirebase]);

  useEffect(() => {
    // 1. Subscribe to custom titles
    const unsubCustoms = onSnapshot(collection(db, 'custom_titles'), (snapshot) => {
      const customsMap: Record<string, string> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.name && data.color) {
          customsMap[data.name] = data.color;
        }
      });
      useStore.getState().setCustomTitleColors(customsMap);
    }, (err) => {
      console.error('Error fetching custom titles colors:', err);
    });

    // 2. Subscribe to achievement colors
    const unsubAchColors = onSnapshot(doc(db, 'settings', 'achievement_colors'), (docSnap) => {
      const achColorsMap: Record<string, string> = {};
      if (docSnap.exists()) {
        const data = docSnap.data();
        Object.entries(data).forEach(([achId, color]) => {
          const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
          if (ach) {
            achColorsMap[ach.name] = color as string;
          }
        });
      }
      useStore.getState().setAchievementColors(achColorsMap);
    }, (err) => {
      console.error('Error fetching achievement colors:', err);
    });

    return () => {
      unsubCustoms();
      unsubAchColors();
    };
  }, []);

  return <>{children}</>;
}
