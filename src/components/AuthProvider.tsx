import React, { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, updateDoc, deleteField, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ACHIEVEMENTS_LIST } from '../types/achievements';
import { auth, db } from '../lib/firebase';
import { useStore, getDailyMissions, getWeeklyMissions, getPermanentMissions } from '../store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setFirebaseUser, syncFromFirebase } = useStore();

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubSubStickers: (() => void) | null = null;
    let unsubSubAccessories: (() => void) | null = null;

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
      if (unsubSubStickers) {
        unsubSubStickers();
        unsubSubStickers = null;
      }
      if (unsubSubAccessories) {
        unsubSubAccessories();
        unsubSubAccessories = null;
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
            const state = useStore.getState();
            
            const localChoco = state.choco || 0;
            const localGChoco = state.goldenChoco || 0;
            const localLevel = state.level || 1;
            const localExp = state.exp || 0;
            const localStreak = state.checkInStreak || 0;
            const localTotalCheckIns = state.totalCheckIns || 0;
            const localLastCheckInDate = state.lastCheckInDate || null;
            
            const newUser = {
              uid: user.uid,
              choco: isEditor ? 9999999 : localChoco,
              goldenChoco: isEditor ? 9999999 : localGChoco,
              level: localLevel,
              exp: localExp,
              createdAt: serverTimestamp(),
              displayName: state.displayName || user.displayName || 'Reader ' + user.uid.slice(0,4),
              email: user.email || '',
              avatarUrl: state.avatarUrl || user.photoURL || '',
              checkInStreak: localStreak,
              lastCheckInDate: localLastCheckInDate || '',
              lastDailyResetDate: state.lastDailyResetDate || '',
              lastWeeklyResetId: state.lastWeeklyResetId || '',
              
              // Initializing Achievements and Active Points fields
              unlockedAchievements: state.unlockedAchievements || [],
              claimedAchievements: state.claimedAchievements || [],
              totalEarnedChoco: isEditor ? 9999999 : (state.totalEarnedChoco || 0),
              totalEarnedGChoco: isEditor ? 9999999 : (state.totalEarnedGChoco || 0),
              totalSpentChoco: state.totalSpentChoco || 0,
              totalCheckIns: localTotalCheckIns,
              perfectDailyDates: state.perfectDailyDates || [],
              sentMessagesCount: state.sentMessagesCount || 0,
              genresRead: state.genresRead || [],
              activePoints: state.activePoints || 0,
              lastActiveWeek: state.lastActiveWeek || '',
              prevActivePoints: state.prevActivePoints || 0,
              prevActiveWeek: state.prevActiveWeek || '',
              activeTitle: state.activeTitle || null,
              chucuLevel: state.chucuLevel || 1,
              chucuExp: state.chucuExp || 0,
              chucuSatiety: state.chucuSatiety || 70,
              chucuHappiness: state.chucuHappiness || 50,
              chucuInteractions: state.chucuInteractions || 0,
              chucuPremiumFeeds: state.chucuPremiumFeeds || 0,
              chucuLastTime: state.chucuLastTime || Date.now(),
              
              missions: state.missions || [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()],
              storyProgress: state.storyProgress || {},
              readHistoryList: state.readHistoryList || [],
              savedStories: state.savedStories || [],
              
              equippedStickerComment: state.equippedStickerComment || null,
              stickerPositionComment: state.stickerPositionComment || 'top-right',
              equippedStickerChat: state.equippedStickerChat || null,
              equippedStickerPost: state.equippedStickerPost || null,
              stickerPositionPost: state.stickerPositionPost || 'top-right',
              equippedAccessory: state.equippedAccessory || null,
              accessoryPosition: state.accessoryPosition || { x: 0, y: 0, scale: 100, rotate: 0 },
              
              ownedChucuAccessories: state.ownedChucuAccessories || [],
              equippedChucuAccessory: state.equippedChucuAccessory || null,
              showChucu: state.showChucu !== false,
              ownedPassTickets: state.ownedPassTickets || 0,
              ownedPriorityTickets: state.ownedPriorityTickets || 0,
              ownedMysteryBoxes: state.ownedMysteryBoxes || 0,
              ownedStreakTickets: state.ownedStreakTickets || 0,
              activeStreakProtection: state.activeStreakProtection || false,
              lastFreeStreakRecoveryMonth: state.lastFreeStreakRecoveryMonth || null
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

            // Tự động kiểm tra và dọn dẹp các trường rác/obsolete siêu lớn (như ownedFrames, equippedSticker cũ)
            // để giải phóng dung lượng document Firestore (giới hạn 1MB) giúp tài khoản hoạt động mượt mà hơn.
            const fieldsToDelete: any = {};
            if ('ownedFrames' in data) fieldsToDelete.ownedFrames = deleteField();
            if ('frameUrl' in data) fieldsToDelete.frameUrl = deleteField();
            if ('equippedSticker' in data) fieldsToDelete.equippedSticker = deleteField();
            if ('stickerPosition' in data) fieldsToDelete.stickerPosition = deleteField();
            
            // Dọn dẹp rác bộ nhớ cục bộ vô tình lưu lên Firestore
            const localObsoleteKeys = ['allUsersUnlockedAchievements', 'allUsersClaimedAchievements', 'allUsersMissions', 'allUsersStoryProgress', 'allUsersReadHistoryList', 'allUsersSavedStories', 'allUsersOwnedStickers', 'allUsersOwnedAccessories'];
            localObsoleteKeys.forEach(k => {
              if (k in data) fieldsToDelete[k] = deleteField();
            });

            if (data.avatarUrl && data.avatarUrl.startsWith('data:image/') && data.avatarUrl.length > 80000) {
              try {
                const { compressBase64Image } = await import('../store');
                const compressed = await compressBase64Image(data.avatarUrl);
                if (compressed && compressed.length < data.avatarUrl.length) {
                   fieldsToDelete.avatarUrl = compressed;
                }
              } catch(e) {}
            }

            // Tiến hành di chuyển dữ liệu ownedStickers từ trường sang subcollection
            if (Array.isArray(data.ownedStickers) && data.ownedStickers.length > 0) {
              console.log('Phát hiện ownedStickers cũ ở document gốc. Đang di chuyển sang subcollection...');
              const pStickers = data.ownedStickers.map(async (url: string) => {
                if (!url) return;
                try {
                  const q = query(collection(db, 'users', user.uid, 'owned_stickers'), where('url', '==', url));
                  const hold = await getDocs(q);
                  if (hold.empty) {
                    await addDoc(collection(db, 'users', user.uid, 'owned_stickers'), {
                      url,
                      acquiredAt: Date.now()
                    });
                  }
                } catch (e) {
                  console.error('Lỗi khi migrate sticker:', e);
                }
              });
              await Promise.all(pStickers);
              fieldsToDelete.ownedStickers = deleteField();
            } else if ('ownedStickers' in data) {
              fieldsToDelete.ownedStickers = deleteField();
            }

            // Tiến hành di chuyển dữ liệu ownedAccessories từ trường sang subcollection
            if (Array.isArray(data.ownedAccessories) && data.ownedAccessories.length > 0) {
              console.log('Phát hiện ownedAccessories cũ ở document gốc. Đang di chuyển sang subcollection...');
              const pAccessories = data.ownedAccessories.map(async (url: string) => {
                if (!url) return;
                try {
                  const q = query(collection(db, 'users', user.uid, 'owned_accessories'), where('url', '==', url));
                  const hold = await getDocs(q);
                  if (hold.empty) {
                    await addDoc(collection(db, 'users', user.uid, 'owned_accessories'), {
                      url,
                      acquiredAt: Date.now()
                    });
                  }
                } catch (e) {
                  console.error('Lỗi khi migrate phụ kiện:', e);
                }
              });
              await Promise.all(pAccessories);
              fieldsToDelete.ownedAccessories = deleteField();
            } else if ('ownedAccessories' in data) {
              fieldsToDelete.ownedAccessories = deleteField();
            }
            
            if (Object.keys(fieldsToDelete).length > 0) {
              console.log('Phát hiện trường obsolete lớn hoặc đã migrate xong, tiến hành dọn dẹp:', Object.keys(fieldsToDelete));
              try {
                await updateDoc(userRef, fieldsToDelete);
              } catch (err) {
                console.error('Lỗi khi dọn dẹp trường obsolete:', err);
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
              // Sync state to local Zustand store in real-time (leaving subcollection data out of root doc sync)
              if (latestData) {
                delete latestData.ownedStickers;
                delete latestData.ownedAccessories;
              }
              syncFromFirebase(latestData);
            }
          }, (err) => {
            console.error('Error listening to user document updates:', err);
          });

          // Mount subcollection snapshot listeners to load owned items in real-time
          unsubSubStickers = onSnapshot(collection(db, 'users', user.uid, 'owned_stickers'), (snap) => {
             const urls = snap.docs.map(d => d.data().url).filter(Boolean);
             const uniqueUrls = Array.from(new Set(urls));
              useStore.setState({ ownedStickers: uniqueUrls });
          }, (err) => {
             console.error('Error listening to user owned_stickers updates:', err);
          });

          unsubSubAccessories = onSnapshot(collection(db, 'users', user.uid, 'owned_accessories'), (snap) => {
             const urls = snap.docs.map(d => d.data().url).filter(Boolean);
             const uniqueUrls = Array.from(new Set(urls));
             useStore.setState({ ownedAccessories: uniqueUrls });
          }, (err) => {
              console.error('Error listening to user owned_accessories updates:', err);
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
        // Bao ve du lieu: Khong tu dong reset / logout de tranh loi mat sach du lieu khi reload (F5) trong moi truong iframe/Vercel
        // Chi thuc su xoa sach nho vao logout() cua nut bam Dang xet chu dong.
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubSubStickers) unsubSubStickers();
      if (unsubSubAccessories) unsubSubAccessories();
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

    // 3. Subscribe to maintenance mode
    const unsubMaintenance = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.isMaintenance === 'boolean') {
          useStore.getState().setMaintenance(data.isMaintenance);
        }
      }
    }, (err) => {
      console.error('Error fetching maintenance settings:', err);
    });

    return () => {
      unsubCustoms();
      unsubAchColors();
      unsubMaintenance();
    };
  }, []);

  return <>{children}</>;
}
