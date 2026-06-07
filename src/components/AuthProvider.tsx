import React, { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore } from '../store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setFirebaseUser, syncFromFirebase } = useStore();

  useEffect(() => {
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
              alert('Tài khoản của bạn đã bị khóa hoặc cấm truy cập.');
              auth.signOut();
              return;
            }
            if (user.email?.toLowerCase() === 'cucnau01@gmail.com' && (data.choco < 999999 || data.goldenChoco < 999999)) {
              data.choco = 9999999;
              data.goldenChoco = 9999999;
              try {
                await setDoc(userRef, { choco: 9999999, goldenChoco: 9999999 }, { merge: true });
              } catch (e) {
                console.error('Error updating admin doc', e);
              }
            }
            syncFromFirebase(data);
          }
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

    return () => unsubscribe();
  }, [login, logout, setFirebaseUser, syncFromFirebase]);

  return <>{children}</>;
}
