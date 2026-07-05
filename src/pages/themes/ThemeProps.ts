export interface ThemeProps {
  story: any;
  actualStoryId: string | null;
  chapters: any[];
  comments: any[];
  activeTab: 'chapters' | 'comments';
  setActiveTab: (tab: 'chapters' | 'comments') => void;
  chapterPage: number;
  setChapterPage: (p: number) => void;
  chapterSortDesc: boolean;
  setChapterSortDesc: (v: boolean) => void;
  CHAPTERS_PER_PAGE: number;
  
  // Gift State
  showGiftModal: boolean;
  setShowGiftModal: (v: boolean) => void;
  giftAmount: number;
  setGiftAmount: (v: number) => void;
  giftMessage: string;
  setGiftMessage: (v: string) => void;
  handleGiftSubmit: () => void;
  
  // Comment State
  commentText: string;
  setCommentText: (v: string) => void;
  submittingComment: boolean;
  handleSendComment: (e: React.FormEvent) => void;
  
  // Reply State
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  submittingReply: boolean;
  handleSendReply: (comment: any) => void;

  // Other shared data
  profilesCache: Record<string, any>;
  
  // App states
  isLoggedIn: boolean;
  savedStories: string[];
  toggleSaveStory: (id: string) => void;
  handleSaveToggle: () => void;
  choco: number;
  uid: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  unlockedPassChapters: string[];
  unlockedEarlyAccessChapters: string[];
  getTitleColor: (title: string | null) => string | undefined;
  
  // Navigate
  navigate: any;
}
