import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, query, where, orderBy, writeBatch, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, Plus, Edit, ShieldAlert, CheckCircle, Smile, BookOpen, Users, Save, MessageSquare, Award } from 'lucide-react';
import { ACHIEVEMENTS_LIST } from '../types/achievements';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  genres: string[];
  chapterCount: number;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  isPasswordProtected?: boolean;
  requiresPass?: boolean;
  requiresEarlyAccess?: boolean;
}

interface CustomTitle {
  id: string;
  name: string;
  color: string;
}

interface AdminUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  choco: number;
  goldenChoco: number;
  isBanned?: boolean;
  banExpiresAt?: number | null;
  customTitles?: CustomTitle[];
  claimedAchievements?: string[];
  unlockedAchievements?: string[];
}

interface AdminComment {
  id: string;
  targetId: string;
  uid: string;
  displayName: string;
  content: string;
  type: 'story' | 'chapter';
  createdAt: any;
}

export function Admin() {
  const { email, firebaseUser } = useStore();

  const [activeTab, setActiveTab] = useState<'stories' | 'users' | 'comments' | 'messages' | 'stickers' | 'posts' | 'titles'>('stories');
  
  // Custom Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{ text: string; action: () => void } | null>(null);

  // Stories Management
  const [stories, setStories] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('');
  const [editingStory, setEditingStory] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Chapter Management
  const [managingStoryChapters, setManagingStoryChapters] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterModalMode, setChapterModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');
  const [cRequiresPass, setCRequiresPass] = useState(false);
  const [cRequiresEarlyAccess, setCRequiresEarlyAccess] = useState(false);

  // Users Management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [givingChoco, setGivingChoco] = useState<number>(0);
  const [givingGChoco, setGivingGChoco] = useState<number>(0);
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null);
  const [banDurationHours, setBanDurationHours] = useState<number>(0); // 0 means permanent

  const handleBanUser = async () => {
    if (!banningUser) return;
    try {
      const banExpiresAt = banDurationHours > 0 ? Date.now() + banDurationHours * 60 * 60 * 1000 : null;
      await updateDoc(doc(db, 'users', banningUser.id), {
        isBanned: true,
        banExpiresAt,
      });
      alert(`Đã cấm tài khoản ${banningUser.email} ${banDurationHours > 0 ? `trong ${banDurationHours} giờ` : 'vĩnh viễn'}.`);
      setBanningUser(null);
      setBanDurationHours(0);
      fetchUsers();
    } catch (err: any) {
      alert('Không thể cấm tài khoản. Lỗi: ' + (err.message || err));
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: false,
        banExpiresAt: null,
      });
      alert('Đã gỡ cấm tài khoản.');
      fetchUsers();
    } catch (err: any) {
      alert('Không thể gỡ cấm. Lỗi: ' + (err.message || err));
    }
  };

  // Comments Management
  const [comments, setComments] = useState<AdminComment[]>([]);

  // Lounge Messages Management
  const [messages, setMessages] = useState<any[]>([]);

  // Avatar Stickers state
  const [stickers, setStickers] = useState<any[]>([]);
  const [stName, setStName] = useState('');
  const [stDesc, setStDesc] = useState('');
  const [stPrice, setStPrice] = useState<number>(0);
  const [stType, setStType] = useState<'choco' | 'golden'>('choco');
  const [stUrl, setStUrl] = useState('');
  const [editingSticker, setEditingSticker] = useState<any | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);
  const editStickerFileInputRef = useRef<HTMLInputElement>(null);

  // Posts Management
  const [posts, setPosts] = useState<any[]>([]);

  // Titles Management
  const [globalTitles, setGlobalTitles] = useState<CustomTitle[]>([]);
  const [achievementColors, setAchievementColors] = useState<Record<string, string>>({});
  const [newTitleName, setNewTitleName] = useState('');
  const [newTitleColor, setNewTitleColor] = useState('#8D6E63');
  const [assigningTitleUser, setAssigningTitleUser] = useState<AdminUser | null>(null);
  const [selectedTitleIdToAssign, setSelectedTitleIdToAssign] = useState<string>('');
  const [viewingTitleUsers, setViewingTitleUsers] = useState<{ id: string, name: string, isAchievement: boolean } | null>(null);

  useEffect(() => {
    const isReady = email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com';
    if (isReady) {
      fetchStories();
      fetchUsers();
      fetchComments();
      fetchMessages();
      fetchStickers();
      fetchPosts();
      fetchGlobalTitles();
      fetchAchievementColors();
    }
  }, [email, firebaseUser, activeTab]);

  const fetchAchievementColors = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'achievement_colors'));
      if (docSnap.exists()) {
         setAchievementColors(docSnap.data() as Record<string, string>);
      }
    } catch(err) { console.log(err); }
  };

  useEffect(() => {
    const unsubStories = onSnapshot(query(collection(db, 'stories'), orderBy('createdAt', 'desc')), (snap) => {
      const list: Book[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title,
          author: data.author,
          coverUrl: data.coverUrl || '',
          description: data.description || '',
          genres: data.genres || [],
          chapterCount: data.chapterCount || 0,
        });
      });
      setStories(list);
    }, (err) => {
      console.error('Lỗi tải danh sách truyện realtime:', err);
    });

    return () => {
      unsubStories();
    };
  }, []);

  const fetchStories = async () => {
    // Legacy function kept for references, but data is now fetched via onSnapshot above
  };

  const fetchGlobalTitles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'custom_titles'));
      const list: CustomTitle[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          color: data.color || '#8D6E63',
        });
      });
      setGlobalTitles(list);
    } catch (err: any) {
      console.error('Lỗi tải danh hiệu:', err);
    }
  };

  const handleSaveAchievementColor = async (achievementId: string, color: string) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'achievement_colors'), { [achievementId]: color }, { merge: true });
    } catch(err) { console.error('Failed to save achievement color', err); }
  };

  const handleCreateTitle = async () => {
    if (!newTitleName.trim()) return;
    try {
      await addDoc(collection(db, 'custom_titles'), {
        name: newTitleName.trim(),
        color: newTitleColor,
        createdAt: serverTimestamp(),
      });
      setNewTitleName('');
      fetchGlobalTitles();
      alert('Đã tạo danh hiệu mới');
    } catch(err: any) { alert('Lỗi: ' + err.message); }
  };

  const handleDeleteTitle = async (id: string) => {
    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa danh hiệu này?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'custom_titles', id));
          fetchGlobalTitles();
        } catch(err: any) { alert('Lỗi: ' + err.message); }
      }
    });
  };

  const handleAssignTitle = async () => {
    if (!assigningTitleUser || !selectedTitleIdToAssign) return;
    const titleObj = globalTitles.find(t => t.id === selectedTitleIdToAssign);
    if (!titleObj) return;

    try {
      const currentTitles = assigningTitleUser.customTitles || [];
      if (currentTitles.find(t => t.id === titleObj.id)) {
        alert('Người dùng đã có danh hiệu này');
        return;
      }
      
      const newTitles = [...currentTitles, titleObj];
      await updateDoc(doc(db, 'users', assigningTitleUser.id), {
        customTitles: newTitles
      });
      setAssigningTitleUser(null);
      setSelectedTitleIdToAssign('');
      fetchUsers();
    } catch(err: any) { alert('Lỗi: ' + err.message); }
  };

  const handleRemoveUserTitle = async (userId: string, titleId: string) => {
     setConfirmDialog({
       text: 'Gỡ danh hiệu của người dùng này?',
       action: async () => {
         try {
           const user = users.find(u => u.id === userId);
           if (!user) return;
           const newTitles = (user.customTitles || []).filter(t => t.id !== titleId);
           await updateDoc(doc(db, 'users', userId), {
             customTitles: newTitles
           });
           fetchUsers();
         } catch(err: any) { alert('Lỗi: ' + err.message); }
       }
     });
  };

  const handleRemoveUserAchievement = async (userId: string, achievementId: string) => {
     setConfirmDialog({
       text: 'Gỡ danh hiệu thành tựu của người dùng này?',
       action: async () => {
         try {
           const user = users.find(u => u.id === userId);
           if (!user) return;
           const newClaimed = (user.claimedAchievements || []).filter(id => id !== achievementId);
           const newUnlocked = (user.unlockedAchievements || []).filter(id => id !== achievementId);
           await updateDoc(doc(db, 'users', userId), {
             claimedAchievements: newClaimed,
             unlockedAchievements: newUnlocked
           });
           fetchUsers();
         } catch(err: any) { alert('Lỗi: ' + err.message); }
       }
     });
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: AdminUser[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          displayName: data.displayName || 'Vô danh',
          email: data.email || '',
          choco: data.choco || 0,
          goldenChoco: data.goldenChoco || 0,
          isBanned: data.isBanned || false,
          banExpiresAt: data.banExpiresAt || null,
          customTitles: data.customTitles || [],
          claimedAchievements: data.claimedAchievements || [],
          unlockedAchievements: data.unlockedAchievements || [],
        });
      });
      setUsers(list);
    } catch (err: any) {
      console.error('Lỗi tải danh sách người dùng:', err);
      alert('Không thể tải danh sách người dùng. Lỗi: ' + (err.message || err));
    }
  };

  const fetchComments = async () => {
    try {
      const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: AdminComment[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          targetId: data.targetId,
          uid: data.uid,
          displayName: data.displayName || 'Vô danh',
          content: data.content,
          type: data.type || 'story',
          createdAt: data.createdAt,
        });
      });
      setComments(list);
    } catch (err: any) {
      console.error('Lỗi tải bình luận:', err);
      alert('Không thể tải bình luận. Lỗi: ' + (err.message || err));
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'chatMessages'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid,
          displayName: data.displayName || 'Vô danh',
          content: data.content,
          createdAt: data.createdAt,
        });
      });
      setMessages(list);
    } catch (err: any) {
      console.error('Lỗi tải tin nhắn:', err);
      alert('Không thể tải tin nhắn. Lỗi: ' + (err.message || err));
    }
  };

  useEffect(() => {
    const unsubStickers = onSnapshot(query(collection(db, 'store_stickers'), orderBy('createdAt', 'desc')), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data
        });
      });
      setStickers(list);
    }, (err) => {
      console.error('Error fetching stickers realtime:', err);
    });

    return () => {
      unsubStickers();
    };
  }, []);

  const fetchStickers = async () => {
    // Legacy function kept for references, but data is now fetched via onSnapshot above
  };

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'newsFeed'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid,
          displayName: data.displayName || 'Vô danh',
          content: data.content,
          createdAt: data.createdAt,
        });
      });
      setPosts(list);
    } catch (err: any) {
      console.error('Lỗi tải bài đăng:', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;
    try {
      await deleteDoc(doc(db, 'newsFeed', id));
      setPosts(posts.filter(m => m.id !== id));
      alert('Đã xóa bài đăng.');
    } catch (err: any) {
      alert('Không thể xóa. Lỗi: ' + (err.message || err));
    }
  };

  const handleImageResize = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 300;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64Data: string;
    if (file.type === 'image/gif') {
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await handleImageResize(file);
    }

    if (base64Data.length > 500000) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh dung lượng nhỏ hơn (dưới ~350KB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      return;
    }

    if (isEditing && editingStory) {
      setEditingStory({ ...editingStory, coverUrl: base64Data });
    } else {
      setCoverUrl(base64Data);
    }
  };

  const handleStickerImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64Data: string;
    if (file.type === 'image/gif') {
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await handleImageResize(file);
    }

    if (base64Data.length > 500000) {
      alert('Ảnh sticker quá lớn! Vui lòng chọn ảnh dung lượng nhỏ hơn (dưới ~350KB).');
      if (stickerFileInputRef.current) stickerFileInputRef.current.value = '';
      if (editStickerFileInputRef.current) editStickerFileInputRef.current.value = '';
      return;
    }

    if (isEditing && editingSticker) {
      setEditingSticker({ ...editingSticker, url: base64Data });
    } else {
      setStUrl(base64Data);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const genreArray = genres.split(',').map((g) => g.trim()).filter(Boolean);
      await addDoc(collection(db, 'stories'), {
        title,
        author,
        coverUrl,
        description,
        genres: genreArray,
        chapterCount: 0,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setAuthor('');
      setCoverUrl('');
      setDescription('');
      setGenres('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'resource-exhausted') {
        alert('Lỗi: Firebase đã hết tài nguyên viết miễn phí hôm nay (Quota Limit Exceeded). Không thể thêm truyện.');
      } else {
        alert('Lỗi thêm truyện: ' + err.message);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;
    try {
      const genreArray = typeof editingStory.genres === 'string'
        ? (editingStory.genres as string).split(',').map((g: string) => g.trim()).filter(Boolean)
        : editingStory.genres;

      await updateDoc(doc(db, 'stories', editingStory.id), {
        title: editingStory.title,
        author: editingStory.author,
        coverUrl: editingStory.coverUrl,
        description: editingStory.description || '',
        genres: genreArray,
      });
      setEditingStory(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      fetchStories();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStory = (id: string) => {
    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa truyện này và tất cả chương của nó?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'stories', id));
          // Clean chapters
          const chSnap = await getDocs(collection(db, 'stories', id, 'chapters'));
          const batch = writeBatch(db);
          chSnap.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
          fetchStories();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Chapter handlers
  const fetchChaptersForAdmin = async (storyId: string) => {
    try {
      const q = query(collection(db, 'stories', storyId, 'chapters'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const list: Chapter[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title,
          content: data.content,
          order: data.order,
          isPasswordProtected: data.isPasswordProtected || false,
        });
      });
      setChapters(list);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddChapter = (storyId: string) => {
    setManagingStoryChapters(storyId);
    setChapterModalMode('add');
    setEditingChapter(null);
    setCTitle('');
    setCContent('');
    setCRequiresPass(false);
    setCRequiresEarlyAccess(false);
  };

  const openEditChapter = (storyId: string, chapter: Chapter) => {
    setManagingStoryChapters(storyId);
    setChapterModalMode('edit');
    setEditingChapter(chapter);
    setCTitle(chapter.title);
    setCContent(chapter.content);
    setCRequiresPass(chapter.requiresPass || false);
    setCRequiresEarlyAccess(chapter.requiresEarlyAccess || false);
  };

  const submitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStoryChapters) return;

    try {
      if (chapterModalMode === 'add') {
        const nextOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.order)) + 1 : 1;
        const newChapterDoc = await addDoc(collection(db, 'stories', managingStoryChapters, 'chapters'), {
          title: cTitle,
          content: cContent,
          order: nextOrder,
          storyId: managingStoryChapters,
          requiresPass: cRequiresPass,
          requiresEarlyAccess: cRequiresEarlyAccess,
          createdAt: Date.now()
        });
        // Update chapter count on story
        const storyRef = doc(db, 'stories', managingStoryChapters);
        const storySnap = await getDoc(storyRef);
        if (storySnap.exists()) {
          const currentCount = storySnap.data().chapterCount || 0;
          await updateDoc(storyRef, { chapterCount: currentCount + 1 });

          // Send notifications to users who have saved this story
          const storyData = storySnap.data();
          const storyTitle = storyData.title || 'Truyện';
          try {
             const usersQuery = query(collection(db, 'users'), where('savedStories', 'array-contains', managingStoryChapters));
             const usersSnap = await getDocs(usersQuery);
             const notifyPromises = usersSnap.docs.map(userDoc => {
                return addDoc(collection(db, 'notifications'), {
                   userId: userDoc.id,
                   storyId: managingStoryChapters,
                   chapterId: newChapterDoc.id,
                   storyTitle: storyTitle,
                   chapterTitle: cTitle,
                   isRead: false,
                   createdAt: Date.now()
                });
             });
             await Promise.all(notifyPromises);
          } catch (notifErr) {
             console.error('Lỗi gửi thông báo:', notifErr);
          }
        }
      } else if (chapterModalMode === 'edit' && editingChapter) {
        await updateDoc(doc(db, 'stories', managingStoryChapters, 'chapters', editingChapter.id), {
          title: cTitle,
          content: cContent,
          requiresPass: cRequiresPass,
          requiresEarlyAccess: cRequiresEarlyAccess,
        });
      }

      setChapterModalMode(null);
      setEditingChapter(null);
      setCTitle('');
      setCContent('');
      fetchChaptersForAdmin(managingStoryChapters);
      fetchStories();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'resource-exhausted') {
        alert('Lỗi: Đã hết tài nguyên viết Firebase miễn phí hôm nay.');
      } else {
        alert('Lỗi khi lưu chương: ' + err.message);
      }
    }
  };

  const deleteChapter = (storyId: string, chapterId: string) => {
    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa chương này?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'stories', storyId, 'chapters', chapterId));
          const storyRef = doc(db, 'stories', storyId);
          const storySnap = await getDoc(storyRef);
          if (storySnap.exists()) {
            const currentCount = storySnap.data().chapterCount || 0;
            await updateDoc(storyRef, { chapterCount: Math.max(0, currentCount - 1) });
          }
          fetchChaptersForAdmin(storyId);
          fetchStories();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Give currency handler
  const handleGiveCurrency = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const currentChoco = data.choco || 0;
        const currentGChoco = data.goldenChoco || 0;
        await updateDoc(userRef, {
          choco: currentChoco + givingChoco,
          goldenChoco: currentGChoco + givingGChoco,
        });
        alert('Tặng thành công!');
        setGivingChoco(0);
        setGivingGChoco(0);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Comments
  const deleteCommentItem = (id: string) => {
    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa bình luận này?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'comments', id));
          fetchComments();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Delete Messages
  const deleteMessageItem = (id: string) => {
    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa tin nhắn này trong Lounge?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'chatMessages', id));
          fetchMessages();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Sticker handlers
  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stUrl) {
      alert('Vui lòng chọn ảnh sticker!');
      return;
    }
    try {
      await addDoc(collection(db, 'store_stickers'), {
        name: stName,
        description: stDesc,
        price: stPrice,
        type: stType,
        url: stUrl,
        createdAt: serverTimestamp()
      });
      setStName('');
      setStDesc('');
      setStPrice(0);
      setStType('choco');
      setStUrl('');
      if (stickerFileInputRef.current) stickerFileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error creating sticker:', err);
      if (err?.code === 'resource-exhausted') {
        alert('Lỗi: Đã vượt quá hạn mức ghi dữ liệu của máy chủ Firebase hôm nay (Quota Exceeded).');
      } else {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  const handleUpdateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSticker) return;
    try {
      await updateDoc(doc(db, 'store_stickers', editingSticker.id), {
        name: editingSticker.name,
        description: editingSticker.description,
        price: Number(editingSticker.price),
        type: editingSticker.type,
        url: editingSticker.url
      });
      setEditingSticker(null);
      if (editStickerFileInputRef.current) editStickerFileInputRef.current.value = '';
      fetchStickers();
    } catch (err: any) {
      console.error('Error updating sticker:', err);
      if (err?.code === 'resource-exhausted') {
        alert('Lỗi: Đã vượt quá hạn mức dữ liệu của máy chủ Firebase hôm nay.');
      } else {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  const deleteSticker = (id: string) => {
    const stickerToDelete = stickers.find(s => s.id === id);
    const stickerUrl = stickerToDelete ? stickerToDelete.url : null;

    setConfirmDialog({
      text: 'Bạn có chắc chắn muốn xóa sticker này khỏi cửa hàng? Điều này cũng sẽ gỡ sticker khỏi hồ sơ của tất cả những ai đang sở hữu/trang bị nó.',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'store_stickers', id));
          
          if (stickerUrl) {
            // Cập nhật Firestore cho tất cả người dùng
            const usersSnap = await getDocs(collection(db, 'users'));
            const batchPromises = usersSnap.docs.map(async (userDoc) => {
              const userData = userDoc.data();
              let needsUpdate = false;
              const updateData: any = {};

              if (userData.equippedSticker === stickerUrl) {
                updateData.equippedSticker = null;
                needsUpdate = true;
              }

              if (Array.isArray(userData.ownedStickers) && userData.ownedStickers.includes(stickerUrl)) {
                updateData.ownedStickers = userData.ownedStickers.filter((u: string) => u !== stickerUrl);
                needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(doc(db, 'users', userDoc.id), updateData);
              }
            });
            await Promise.all(batchPromises);

            // Đồng thời cập nhật trạng thái trong bộ nhớ cục bộ (Zustand store) nếu người dùng hiện tại đang đeo sticker này
            const { ownedStickers, equippedSticker, syncFromFirebase } = useStore.getState();
            const newOwned = (ownedStickers || []).filter((u: string) => u !== stickerUrl);
            const newEquipped = equippedSticker === stickerUrl ? null : equippedSticker;
            syncFromFirebase({
              ownedStickers: newOwned,
              equippedSticker: newEquipped
            });
          }

          fetchStickers();
        } catch (err: any) {
          console.error('Error deleting sticker:', err);
          const errMsg = err?.message || String(err);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || err?.code === 'resource-exhausted') {
            alert('Lỗi: Đã vượt quá hạn mức ghi dữ liệu của máy chủ miễn phí (Quota Limit Exceeded) hôm nay. Bạn không thể thực hiện thao tác này lúc này.');
            if (typeof window !== 'undefined' && (window as any).__setQuotaExceeded) {
              (window as any).__setQuotaExceeded(true);
            }
          } else {
            alert('Có lỗi xảy ra khi xóa sticker: ' + errMsg);
          }
        }
      }
    });
  };

  const isAdmin = email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com';
  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Không có quyền truy cập. ({email || firebaseUser?.email || 'Chưa đăng nhập'})</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-[#3E2723] uppercase tracking-tighter">Bảng Điều Khiển Admin</h1>

      <div className="flex bg-[#FDF6EC] p-1 rounded-xl sticky top-4 z-10 border border-[#D7CCC8]/50 shadow-sm overflow-x-auto">
         <button onClick={() => setActiveTab('stories')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'stories' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <BookOpen className="w-4 h-4" /> Truyện
         </button>
         <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <Users className="w-4 h-4" /> Thành viên
         </button>
         <button onClick={() => setActiveTab('comments')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'comments' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <MessageSquare className="w-4 h-4" /> Bình luận
         </button>
         <button onClick={() => setActiveTab('messages')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'messages' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <MessageSquare className="w-4 h-4" /> Choco Lounge
         </button>
         <button onClick={() => setActiveTab('stickers')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'stickers' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <Smile className="w-4 h-4" /> Stickers
         </button>
         <button onClick={() => setActiveTab('posts')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'posts' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <MessageSquare className="w-4 h-4" /> Bài đăng
         </button>
         <button onClick={() => setActiveTab('titles')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'titles' ? 'bg-[#8D6E63] text-white shadow' : 'text-[#8D6E63] hover:bg-[#D7CCC8]/30'}`}>
            <Award className="w-4 h-4" /> Danh hiệu
         </button>
      </div>

      {activeTab === 'stickers' && (
         <>
         {editingSticker ? (
           <form onSubmit={handleUpdateSticker} className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">Sửa Sticker Avatar</h2>
             <div className="flex gap-4">
               <div className="w-24 h-24 bg-gray-50 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2">
                 {editingSticker.url && <img src={editingSticker.url} className="w-16 h-16 object-contain" />}
               </div>
               <div className="flex-1 flex flex-col justify-end gap-2">
                  <input type="file" accept="image/png, image/webp, image/gif" onChange={e => handleStickerImageChange(e, true)} ref={editStickerFileInputRef} className="hidden" />
                  <button type="button" onClick={() => editStickerFileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors">Đổi ảnh sticker</button>
               </div>
             </div>
             <input type="text" placeholder="Tên sticker" value={editingSticker.name} onChange={e => setEditingSticker({...editingSticker, name: e.target.value})} className="px-4 py-2 border rounded-lg" required />
             <input type="text" placeholder="Mô tả" value={editingSticker.description} onChange={e => setEditingSticker({...editingSticker, description: e.target.value})} className="px-4 py-2 border rounded-lg" required />
             <div className="flex gap-4">
                 <input type="number" placeholder="Giá" value={editingSticker.price} onChange={e => setEditingSticker({...editingSticker, price: e.target.value})} className="px-4 py-2 border rounded-lg flex-1" required />
                 <select value={editingSticker.type} onChange={e => setEditingSticker({...editingSticker, type: e.target.value})} className="px-4 py-2 border rounded-lg w-32">
                    <option value="choco">Choco</option>
                    <option value="golden">Golden Choco</option>
                 </select>
             </div>
             <div className="flex justify-end gap-2 mt-2">
               <button type="button" onClick={() => setEditingSticker(null)} className="px-4 py-2 bg-gray-200 rounded font-bold hover:bg-gray-300">Hủy</button>
               <button type="submit" className="px-4 py-2 bg-[#8D6E63] text-white rounded font-bold hover:bg-[#5D4037]">Cập nhật</button>
             </div>
           </form>
         ) : (
           <form onSubmit={handleCreateSticker} className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">Thêm Sticker Avatar</h2>
             <div className="flex gap-4">
               <div className="w-24 h-24 bg-gray-50 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2">
                 {stUrl ? <img src={stUrl} className="w-16 h-16 object-contain" /> : <div className="text-xs text-gray-500 text-center">Chưa có ảnh</div>}
               </div>
               <div className="flex-1 flex flex-col justify-end gap-2">
                  <input type="file" accept="image/png, image/webp, image/gif" onChange={e => handleStickerImageChange(e, false)} ref={stickerFileInputRef} className="hidden" />
                  <button type="button" onClick={() => stickerFileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors">Chọn ảnh sticker (PNG/WebP/GIF trong suốt)</button>
               </div>
             </div>
             <input type="text" placeholder="Tên sticker" value={stName} onChange={e => setStName(e.target.value)} className="px-4 py-2 border rounded-lg" required />
             <input type="text" placeholder="Mô tả" value={stDesc} onChange={e => setStDesc(e.target.value)} className="px-4 py-2 border rounded-lg" required />
             <div className="flex gap-4">
                 <input type="number" placeholder="Giá" value={stPrice} onChange={e => setStPrice(Number(e.target.value))} className="px-4 py-2 border rounded-lg flex-1" required />
                 <select value={stType} onChange={e => setStType(e.target.value as any)} className="px-4 py-2 border rounded-lg w-32">
                     <option value="choco">Choco</option>
                     <option value="golden">Golden Choco</option>
                 </select>
             </div>
             <button type="submit" className="mt-2 bg-[#8D6E63] text-white py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors">Tạo Sticker</button>
           </form>
         )}
   
         <div className="space-y-4 pb-20">
            <h2 className="text-xl font-bold text-[#3E2723]">Danh sách sticker ({stickers.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stickers.map(s => (
                 <div key={s.id} className="p-4 bg-white rounded-xl border border-[#D7CCC8] shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 relative mb-4 p-2 bg-gray-50 rounded-xl border flex items-center justify-center shrink-0">
                       {s.url ? (
                         <img src={s.url} alt="" className="w-12 h-12 object-contain pointer-events-none" />
                       ) : (
                         <div className="text-xs text-gray-400">Trống</div>
                       )}
                    </div>
                    <h3 className="font-bold text-[#3E2723] leading-tight">{s.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 mt-1 line-clamp-2">{s.description}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${s.type === 'golden' ? 'bg-yellow-100 text-yellow-800' : 'bg-[#D7CCC8]/30 text-[#5D4037]'}`}>
                        {s.price} {s.type === 'golden' ? 'GChoco' : 'Choco'}
                    </span>
                    <div className="flex gap-2 mt-4 w-full">
                       <button onClick={() => setEditingSticker(s)} className="flex-1 py-1.5 text-xs bg-[#D7CCC8]/30 rounded font-bold hover:bg-[#D7CCC8]/60 transition-colors">Sửa</button>
                       <button onClick={() => deleteSticker(s.id)} className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded font-bold hover:bg-red-200 transition-colors flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                 </div>
              ))}
            </div>
         </div>
         </>
      )}

      {activeTab === 'stories' && (
         <>
         {editingStory ? (
           <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">Sửa Truyện</h2>
             <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-200 shrink-0 border rounded shadow-sm">
                  {editingStory.coverUrl && <img src={editingStory.coverUrl} className="w-full h-full object-cover rounded" />}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                   <input type="file" accept="image/*" onChange={e => handleImageChange(e, true)} ref={editFileInputRef} className="hidden" />
                   <button type="button" onClick={() => editFileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors">Đổi ảnh bìa</button>
                </div>
             </div>
             <input type="text" value={editingStory.title} onChange={e => setEditingStory({...editingStory, title: e.target.value})} placeholder="Tên truyện" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <input type="text" value={editingStory.author} onChange={e => setEditingStory({...editingStory, author: e.target.value})} placeholder="Tác giả" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <input type="text" value={Array.isArray(editingStory.genres) ? editingStory.genres.join(', ') : editingStory.genres} onChange={e => setEditingStory({...editingStory, genres: e.target.value})} placeholder="Thể loại (cách nhau dấu phẩy)" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <textarea value={editingStory.description || ''} onChange={e => setEditingStory({...editingStory, description: e.target.value})} placeholder="Giới thiệu" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[100px]" />
             <div className="flex gap-2">
                <button type="submit" className="bg-[#8D6E63] hover:bg-[#5D4037] text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><Save className="w-4 h-4"/> Lưu Cập Nhật</button>
                <button type="button" onClick={() => setEditingStory(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold transition-colors">Hủy</button>
             </div>
           </form>
         ) : (
           <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">Thêm Truyện Mới</h2>
             <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-200 shrink-0 border rounded shadow-sm">
                  {coverUrl && <img src={coverUrl} className="w-full h-full object-cover rounded" />}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                   <input type="file" accept="image/*" onChange={e => handleImageChange(e, false)} ref={fileInputRef} className="hidden" />
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors">Chọn ảnh bìa</button>
                </div>
             </div>
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên truyện" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Tác giả" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <input type="text" value={genres} onChange={e => setGenres(e.target.value)} placeholder="Thể loại (cách nhau dấu phẩy)" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Giới thiệu" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[100px]" />
             <button type="submit" className="bg-[#8D6E63] hover:bg-[#5D4037] text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">Thêm Truyện</button>
           </form>
         )}

         <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#3E2723]">Danh sách truyện ({stories.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map(s => (
                 <div key={s.id} className="p-4 bg-white rounded-2xl border border-[#D7CCC8]/80 shadow-sm flex gap-4">
                    <div className="w-20 h-28 bg-gray-100 border rounded shrink-0 overflow-hidden">
                       {s.coverUrl ? <img src={s.coverUrl} className="w-full h-full object-cover" /> : <div className="text-xs text-gray-400 p-2 text-center">Trống</div>}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                       <div>
                          <h3 className="font-bold text-[#3E2723] leading-snug">{s.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">Tác giả: {s.author}</p>
                          <div className="flex gap-1 flex-wrap mt-2">
                             {s.genres.map(g => (
                                <span key={g} className="text-[10px] bg-[#FDF6EC] text-[#8D6E63] font-semibold px-2 py-0.5 rounded-full border border-[#D7CCC8]/30">{g}</span>
                             ))}
                          </div>
                       </div>
                       <div className="flex gap-2 mt-4 flex-wrap">
                          <button onClick={() => setEditingStory(s)} className="text-xs bg-[#D7CCC8]/30 px-3 py-1 rounded font-semibold hover:bg-[#D7CCC8]/60 transition-colors">Sửa thông tin</button>
                          <button onClick={() => openAddChapter(s.id)} className="text-xs bg-[#3E2723] text-[#FDF6EC] px-3 py-1 rounded font-semibold hover:bg-black transition-colors">Thêm Chương</button>
                          <button onClick={() => { setManagingStoryChapters(s.id); fetchChaptersForAdmin(s.id); }} className="text-xs border border-[#8D6E63] text-[#8D6E63] px-3 py-1 rounded font-semibold hover:bg-[#F5E6D3] transition-colors">QL Chương ({s.chapterCount || 0})</button>
                          <button onClick={() => deleteStory(s.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded font-semibold hover:bg-red-200 transition-colors ml-auto"><Trash2 className="w-3 h-3 inline mr-1"/> Xóa Truyện</button>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
         </div>
         </>
      )}

      {activeTab === 'users' && (
         <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-6">
            <h2 className="text-xl font-bold text-[#3E2723]">Thành Viên ({users.length})</h2>
            <input type="text" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="Tìm email thành viên..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
            <div className="divide-y max-h-[400px] overflow-y-auto pr-2">
               {users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase())).map(u => (
                  <div key={u.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <p className="font-bold text-[#3E2723]">
                           {u.displayName}
                           {u.isBanned && (
                              <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                {u.banExpiresAt ? `Khóa đến ${new Date(u.banExpiresAt).toLocaleString('vi-VN')}` : 'Khóa vĩnh viễn'}
                              </span>
                           )}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                           <span className="font-semibold text-amber-700">Choco: {u.choco}</span>
                           <span className="font-semibold text-yellow-600">Golden Choco: {u.goldenChoco}</span>
                        </div>
                        {u.customTitles && u.customTitles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                             {u.customTitles.map(t => (
                               <span key={t.id} style={{ color: t.color, borderColor: t.color }} className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/50 flex items-center gap-1">
                                 {t.name}
                                 <button onClick={() => handleRemoveUserTitle(u.id, t.id)} className="text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>
                               </span>
                             ))}
                          </div>
                        )}
                     </div>
                     <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                           <button onClick={() => setAssigningTitleUser(u)} className="px-3 py-1 bg-[#FDF6EC] border border-[#8D6E63] text-[#8D6E63] text-xs font-bold rounded hover:bg-white transition-colors whitespace-nowrap">Trao Danh hiệu</button>
                        </div>
                        <div className="flex items-center gap-2">
                           <input type="number" placeholder="Choco" value={givingChoco || ''} onChange={e => setGivingChoco(Number(e.target.value))} className="w-20 px-2 py-1 text-xs border rounded focus:outline-none" />
                           <input type="number" placeholder="GChoco" value={givingGChoco || ''} onChange={e => setGivingGChoco(Number(e.target.value))} className="w-20 px-2 py-1 text-xs border rounded focus:outline-none" />
                           <button onClick={() => handleGiveCurrency(u.id)} className="px-3 py-1 bg-[#8D6E63] text-white text-xs font-bold rounded hover:bg-[#5D4037] transition-colors">Tặng</button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                           {u.isBanned ? (
                              <button onClick={() => handleUnbanUser(u.id)} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 transition-colors whitespace-nowrap">Gỡ Ban</button>
                           ) : (
                              <button onClick={() => setBanningUser(u)} className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition-colors whitespace-nowrap">Ban</button>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'comments' && (
         <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#3E2723]">Bình Luận Gần Đây</h2>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {comments.map(c => (
                 <div key={c.id} className="py-3 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                       <p className="text-xs text-gray-500 font-bold">{c.displayName} <span className="font-normal">• {c.type === 'story' ? 'Truyện' : 'Chương'}</span></p>
                       <p className="text-sm text-gray-800">{c.content}</p>
                    </div>
                    <button onClick={() => deleteCommentItem(c.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                 </div>
              ))}
            </div>
         </div>
      )}

      {activeTab === 'messages' && (
         <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#3E2723]">Tin Nhắn Choco Lounge ({messages.length})</h2>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {messages.map(m => (
                 <div key={m.id} className="py-3 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                       <p className="text-xs text-gray-500 font-bold">{m.displayName}</p>
                       <p className="text-sm text-gray-800">{m.content}</p>
                    </div>
                    <button onClick={() => deleteMessageItem(m.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                 </div>
              ))}
            </div>
         </div>
      )}

      {activeTab === 'posts' && (
         <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#3E2723]">Bản tin Choco ({posts.length})</h2>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {posts.map(post => (
                 <div key={post.id} className="py-3 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                       <p className="text-xs text-gray-500 font-bold">{post.displayName}</p>
                       <p className="text-sm text-gray-800">{post.content}</p>
                    </div>
                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                 </div>
              ))}
              {posts.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có bài đăng nào.</p>}
            </div>
         </div>
      )}

      {activeTab === 'titles' && (
         <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#3E2723]">Tạo Danh Hiệu Mới</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <input type="text" value={newTitleName} onChange={e => setNewTitleName(e.target.value)} placeholder="Tên danh hiệu (VD: Người Nổi Tiếng)" className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">Màu viền/chữ:</span>
                  <input type="color" value={newTitleColor} onChange={e => setNewTitleColor(e.target.value)} className="w-10 h-10 rounded border" />
                </div>
                <button onClick={handleCreateTitle} className="bg-[#8D6E63] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors whitespace-nowrap">Tạo Danh Hiệu</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D7CCC8] shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#3E2723]">Danh Hiệu Tự Tạo ({globalTitles.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {globalTitles.map(t => (
                   <div key={t.id} className="p-4 border rounded-xl flex items-center justify-between" style={{ borderColor: t.color }}>
                      <span className="font-bold text-lg" style={{ color: t.color }}>{t.name}</span>
                      <div className="flex items-center gap-2">
                         <button onClick={() => setViewingTitleUsers({ id: t.id, name: t.name, isAchievement: false })} className="text-[#8D6E63] hover:text-[#5D4037] p-2 rounded-lg hover:bg-orange-50 transition-colors" title="Xem người sở hữu"><Users className="w-5 h-5"/></button>
                         <button onClick={() => handleDeleteTitle(t.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Xóa danh hiệu"><Trash2 className="w-5 h-5"/></button>
                      </div>
                   </div>
                 ))}
                 {globalTitles.length === 0 && <p className="text-gray-500 text-sm py-4 col-span-full">Chưa có danh hiệu nào.</p>}
              </div>

              <h2 className="text-xl font-bold text-[#3E2723] mt-6 border-t pt-6">Danh Hiệu Thành Tựu ({ACHIEVEMENTS_LIST.length})</h2>
              <p className="text-xs text-gray-500 mb-2">Thành tựu người dùng đạt được cũng có thể được hiển thị như một danh hiệu. Bạn có thể đổi màu cho chúng tại đây.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {ACHIEVEMENTS_LIST.map(ach => {
                    const tColor = achievementColors[ach.id] || '#8D6E63';
                    return (
                       <div key={ach.id} className="p-4 border rounded-xl flex flex-col gap-3" style={{ borderColor: tColor }}>
                          <div className="flex items-start justify-between gap-2">
                             <div className="flex flex-col flex-1 min-w-0">
                               <span className="font-bold text-sm truncate" style={{ color: tColor }} title={ach.name}>{ach.name}</span>
                               <span className="text-[10px] text-gray-500 line-clamp-2" title={ach.description}>{ach.description}</span>
                             </div>
                             <button onClick={() => setViewingTitleUsers({ id: ach.id, name: ach.name, isAchievement: true })} className="text-[#8D6E63] hover:text-[#5D4037] p-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0" title="Xem người sở hữu"><Users className="w-5 h-5"/></button>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t pt-2">
                             <span className="text-xs font-semibold text-gray-600">Đổi màu:</span>
                             <input 
                                type="color" 
                                value={tColor} 
                                onChange={(e) => setAchievementColors(prev => ({...prev, [ach.id]: e.target.value}))} 
                                onBlur={(e) => handleSaveAchievementColor(ach.id, e.target.value)}
                                className="w-8 h-8 rounded border" 
                             />
                          </div>
                       </div>
                    );
                 })}
              </div>
            </div>
         </div>
      )}

      {assigningTitleUser && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">Trao Danh Hiệu</h2>
             <p className="text-sm">Trao danh hiệu cho <strong>{assigningTitleUser.displayName}</strong></p>
             <div>
               <label className="block text-sm font-semibold mb-2">Chọn danh hiệu</label>
               <select value={selectedTitleIdToAssign} onChange={e => setSelectedTitleIdToAssign(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="">-- Chọn danh hiệu --</option>
                  {globalTitles.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
               </select>
             </div>
             <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => { setAssigningTitleUser(null); setSelectedTitleIdToAssign(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
               <button onClick={handleAssignTitle} className="px-4 py-2 bg-[#8D6E63] text-white font-bold rounded-lg hover:bg-[#5D4037]">Xác nhận</button>
             </div>
           </div>
         </div>
      )}

      {viewingTitleUsers && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4 max-h-[80vh]">
             <div className="flex justify-between items-center border-b pb-3">
               <h2 className="text-lg font-bold text-[#3E2723]">Thành viên có danh hiệu: {viewingTitleUsers.name}</h2>
               <button onClick={() => setViewingTitleUsers(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
             </div>
             <div className="overflow-y-auto flex-1 flex flex-col gap-2">
                {(() => {
                   const titleId = viewingTitleUsers.id;
                   const filteredUsers = users.filter(u => {
                      if (viewingTitleUsers.isAchievement) {
                         return u.claimedAchievements && u.claimedAchievements.includes(titleId);
                      } else {
                         return u.customTitles && u.customTitles.some(t => t.id === titleId);
                      }
                   });

                   if (filteredUsers.length === 0) {
                      return <p className="text-sm text-gray-500 text-center py-4">Chưa có ai sở hữu danh hiệu này.</p>;
                   }

                   return filteredUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                         <div>
                            <p className="font-bold text-sm text-[#3E2723]">{u.displayName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                         </div>
                            <button onClick={() => {
                                if (viewingTitleUsers.isAchievement) {
                                    handleRemoveUserAchievement(u.id, titleId);
                                } else {
                                    handleRemoveUserTitle(u.id, titleId)
                                }
                            }} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Gỡ</button>
                         </div>
                   ));
                })()}
             </div>
           </div>
         </div>
      )}

      {/* Chapter Manager UI Overlay */}
      {managingStoryChapters && !chapterModalMode && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b">
                 <h2 className="text-xl font-bold text-[#3E2723]">Quản lý chương ({chapters.length})</h2>
                 <button onClick={() => setManagingStoryChapters(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">Đóng</button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y my-4 pr-2">
                 {chapters.map(c => (
                    <div key={c.id} className="py-3 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-[#3E2723] text-sm">Chương {c.order}: {c.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.content}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => openEditChapter(managingStoryChapters, c)} className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">Sửa</button>
                          <button onClick={() => deleteChapter(managingStoryChapters, c.id)} className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Xóa</button>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-end">
                 <button onClick={() => openAddChapter(managingStoryChapters)} className="px-4 py-2 bg-[#3E2723] text-[#FDF6EC] font-bold rounded-lg hover:bg-[#2D1B19] transition-colors">Thêm Chương Mới</button>
              </div>
           </div>
         </div>
      )}

      {chapterModalMode && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <form onSubmit={submitChapter} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
             <h2 className="text-xl font-bold text-[#3E2723]">{chapterModalMode === 'add' ? 'Thêm Chương Mới' : 'Sửa Chương'}</h2>
             <input type="text" value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="Tên chương" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]" />
             <textarea value={cContent} onChange={e => setCContent(e.target.value)} placeholder="Nội dung chương" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[200px]" />
             <div className="flex gap-4 items-center">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cRequiresPass} onChange={e => setCRequiresPass(e.target.checked)} className="rounded text-[#8D6E63] focus:ring-[#8D6E63]" />
                    <span className="text-sm font-medium">Yêu cầu vé pass truyện</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cRequiresEarlyAccess} onChange={e => setCRequiresEarlyAccess(e.target.checked)} className="rounded text-[#8D6E63] focus:ring-[#8D6E63]" />
                    <span className="text-sm font-medium">Yêu cầu vé đọc sớm</span>
                 </label>
             </div>
             <div className="flex gap-2 justify-end mt-2">
               <button type="button" onClick={() => setChapterModalMode(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
               <button type="submit" className="px-4 py-2 bg-[#8D6E63] text-white font-bold rounded-lg hover:bg-[#5D4037]">{chapterModalMode === 'add' ? 'Đăng Chương' : 'Lưu Chương'}</button>
             </div>
           </form>
         </div>
      )}

      {banningUser && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl flex flex-col gap-4">
             <h2 className="text-xl font-bold text-red-600">Ban Thành Viên</h2>
             <p className="text-sm">Bạn đang chuẩn bị ban <strong>{banningUser.email}</strong></p>
             <div>
               <label className="block text-sm font-semibold mb-2">Thời gian khóa (Giờ)</label>
               <input type="number" min="0" value={banDurationHours} onChange={e => setBanDurationHours(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500" />
               <p className="text-xs text-gray-500 mt-1">Ghi chú: Để 0 = Khóa vĩnh viễn</p>
             </div>
             <div className="flex justify-end gap-2 mt-2">
               <button onClick={() => { setBanningUser(null); setBanDurationHours(0); }} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
               <button onClick={handleBanUser} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Xác nhận Khóa</button>
             </div>
           </div>
         </div>
      )}

      {confirmDialog && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#3E2723]">Xác nhận</h2>
              <p className="text-gray-700">{confirmDialog.text}</p>
              <div className="flex gap-2 justify-end mt-2">
                 <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
                 <button onClick={() => { confirmDialog.action(); setConfirmDialog(null); }} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Đồng ý</button>
              </div>
           </div>
         </div>
      )}
    </div>
  )
}
