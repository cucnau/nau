import React, { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, updateDoc, deleteField, addDoc, getDocs, query, where, deleteDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
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
              choco: localChoco,
              goldenChoco: localGChoco,
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
              totalEarnedChoco: state.totalEarnedChoco || 0,
              totalEarnedGChoco: state.totalEarnedGChoco || 0,
              totalSpentChoco: state.totalSpentChoco || 0,
              totalCheckIns: localTotalCheckIns,
              perfectDailyDates: state.perfectDailyDates || [],
              sentMessagesCount: state.sentMessagesCount || 0,
              totalChaptersRead: state.totalChaptersRead || 0,
              totalCommentsCount: state.totalCommentsCount || 0,
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
              chucuGameFragments: state.chucuGameFragments || 0,
              chucuGameGFragments: state.chucuGameGFragments || 0,
              gachaFragments: state.gachaFragments || 0,
              chucuGameBonusPoints: state.chucuGameBonusPoints || 0,
              chucuGamePlaysToday: state.chucuGamePlaysToday || 0,
              chucuGameLastPlayDate: state.chucuGameLastPlayDate || null,
              
              chocoMatchLevel: state.chocoMatchLevel || 1,
              chocoMatchHearts: state.chocoMatchHearts || 5,
              chocoMatchLastHeartTick: state.chocoMatchLastHeartTick || null,

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
            if (newUser.avatarUrl && newUser.avatarUrl.startsWith('data:image/') && newUser.avatarUrl.length > 300000) {
              try {
                const { compressBase64Image } = await import('../store');
                const compressed = await compressBase64Image(newUser.avatarUrl);
                if (compressed && compressed.length < newUser.avatarUrl.length) {
                   newUser.avatarUrl = compressed;
                }
              } catch(e) {}
            }

            if (Array.isArray(newUser.missions) && newUser.missions.length > 300) {
               newUser.missions = [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()];
            }
            if (Array.isArray(newUser.readHistoryList) && newUser.readHistoryList.length > 200) {
               newUser.readHistoryList = newUser.readHistoryList.slice(0, 200);
            }
            
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

            if (data.avatarUrl && data.avatarUrl.startsWith('data:image/') && data.avatarUrl.length > 300000) {
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
              
              // Validate and heal equipped legacy stickers starting with "item-"
              const stickerKeys = ['equippedStickerComment', 'equippedStickerChat', 'equippedStickerPost'] as const;
              (async () => {
                const healerUpdates: any = {};
                let hasHealed = false;
                for (const key of stickerKeys) {
                  const val = latestData[key];
                  if (val && val.startsWith('item-')) {
                    try {
                      const itemQ = query(collection(db, 'gacha_items'), where('id', '==', val));
                      const itemSnap = await getDocs(itemQ);
                      if (!itemSnap.empty) {
                        const actualItem = itemSnap.docs[0].data();
                        const actualUrl = actualItem.image;
                        if (actualUrl) {
                          healerUpdates[key] = actualUrl;
                          hasHealed = true;
                          useStore.setState({ [key]: actualUrl });
                        }
                      }
                    } catch (e) {
                      console.error(`Error healing equipped sticker ${key}:`, e);
                    }
                  }
                }
                if (hasHealed) {
                  await updateDoc(userRef, healerUpdates);
                  console.log("Healed equipped stickers:", healerUpdates);
                }
              })();

              syncFromFirebase(latestData);
            }
          }, (err) => {
            console.error('Error listening to user document updates:', err);
          });

          // Mount subcollection snapshot listeners to load owned items in real-time
          unsubSubStickers = onSnapshot(collection(db, 'users', user.uid, 'owned_stickers'), (snap) => {
             const docsData = snap.docs.map(d => ({ docId: d.id, url: d.data().url })).filter(d => Boolean(d.url));
             const initialUrls = docsData.map(d => d.url);
             useStore.setState({ ownedStickers: Array.from(new Set(initialUrls)) });

             (async () => {
                let changed = false;
                const finalUrls: string[] = [];
                for (const docObj of docsData) {
                  let currentUrl = docObj.url;
                  if (currentUrl && currentUrl.startsWith('item-')) {
                    try {
                      const itemQ = query(collection(db, 'gacha_items'), where('id', '==', currentUrl));
                      const itemSnap = await getDocs(itemQ);
                      if (!itemSnap.empty) {
                        const actualItem = itemSnap.docs[0].data();
                        const actualUrl = actualItem.image;
                        if (actualUrl) {
                          currentUrl = actualUrl;
                          changed = true;
                          await updateDoc(doc(db, 'users', user.uid, 'owned_stickers', docObj.docId), {
                            url: actualUrl
                          });
                        }
                      } else {
                        // The item no longer exists in the DB! Delete it from owned_stickers
                        await deleteDoc(doc(db, 'users', user.uid, 'owned_stickers', docObj.docId));
                        currentUrl = null;
                        changed = true;

                        // Check if this invalid id is currently equipped anywhere and reset it
                        const userRef = doc(db, 'users', user.uid);
                        const cleanUpdates: any = {};
                        let cleanNeeded = false;
                        const currentState = useStore.getState();
                        if (currentState.equippedStickerComment === docObj.url) {
                          cleanUpdates.equippedStickerComment = null;
                          useStore.setState({ equippedStickerComment: null });
                          cleanNeeded = true;
                        }
                        if (currentState.equippedStickerChat === docObj.url) {
                          cleanUpdates.equippedStickerChat = null;
                          useStore.setState({ equippedStickerChat: null });
                          cleanNeeded = true;
                        }
                        if (currentState.equippedStickerPost === docObj.url) {
                          cleanUpdates.equippedStickerPost = null;
                          useStore.setState({ equippedStickerPost: null });
                          cleanNeeded = true;
                        }
                        if (cleanNeeded) {
                          await updateDoc(userRef, cleanUpdates);
                          console.log("Cleaned up orphaned equipped sticker fields!");
                        }
                      }
                    } catch (err) {
                      console.error("Heal sticker error:", err);
                    }
                  }
                  if (currentUrl) {
                    finalUrls.push(currentUrl);
                  }
                }
                if (changed) {
                  useStore.setState({ ownedStickers: Array.from(new Set(finalUrls)) });
                }
             })();
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
        useStore.getState().syncUserDataStatsFromDB();
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

  useEffect(() => {
    const runLegacyCommentsSync = async () => {
      try {
        const snap = await getDocs(collection(db, 'comments'));
        const uncounted = snap.docs.filter(docSnap => docSnap.data().countedAsFire !== true);
        if (uncounted.length === 0) return;

        console.log(`[Sync] Found ${uncounted.length} uncounted comments. Syncing fire points...`);

        const getGMT7DateFromDate = (d: Date): Date => {
          const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
          return new Date(utc + (3600000 * 7));
        };

        const getWeeklyIdFromDate = (date: Date): string => {
          const d = getGMT7DateFromDate(date);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 4 - (d.getDay() || 7));
          const yearStart = new Date(d.getFullYear(), 0, 1);
          const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          return `${d.getFullYear()}-W${weekNo}`;
        };

        for (const commentDoc of uncounted) {
          const commentData = commentDoc.data();
          const storyId = commentData.storyId || commentData.targetId;
          if (!storyId) continue;

          let points = 1;
          if (commentData.type === 'choco_gift' && typeof commentData.giftAmount === 'number') {
            points = commentData.giftAmount;
          }

          let date = new Date();
          if (commentData.createdAt) {
            if (typeof commentData.createdAt.toDate === 'function') {
              date = commentData.createdAt.toDate();
            } else if (typeof commentData.createdAt.toMillis === 'function') {
              date = new Date(commentData.createdAt.toMillis());
            } else if (commentData.createdAt.seconds) {
              date = new Date(commentData.createdAt.seconds * 1000);
            }
          }

          const todayStr = format(getGMT7DateFromDate(date), 'yyyy-MM-dd');
          const weekId = getWeeklyIdFromDate(date);

          // Update story
          await updateDoc(doc(db, 'stories', storyId), {
            viewCount: increment(points),
            [`dailyViews.${todayStr}`]: increment(points),
            [`weeklyViews.${weekId}`]: increment(points)
          });

          // Mark comment as counted
          await updateDoc(doc(db, 'comments', commentDoc.id), {
            countedAsFire: true
          });
        }
        console.log(`[Sync] Successfully synced ${uncounted.length} legacy comments.`);
      } catch (err) {
        console.error('[Sync] Error syncing legacy comments:', err);
      }
    };

    // Run sync when auth state is resolved and a user is signed in
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const timer = setTimeout(runLegacyCommentsSync, 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsub();
  }, []);

  return <>{children}</>;
}
