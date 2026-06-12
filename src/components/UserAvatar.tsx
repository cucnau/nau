import React from 'react';
import { User } from 'lucide-react';
import { cn } from './Layout';

interface UserAvatarProps {
  avatarUrl?: string | null;
  equippedSticker?: string | null;
  stickerPosition?: string | null;
  equippedAccessory?: string | null;
  accessoryPosition?: { x: number; y: number; scale: number; rotate: number } | null;
  className?: string; // e.g. "w-10 h-10" or "w-8 h-8"
  stickerSizeClass?: string; // e.g. "w-4 h-4" or "w-3 h-3"
  fallbackIconSizeClass?: string; // e.g. "w-4 h-4" or "w-5 h-5"
  borderClass?: string; // e.g. "border border-[#D7CCC8]/30"
}

export function UserAvatar({
  avatarUrl,
  equippedSticker,
  stickerPosition,
  equippedAccessory,
  accessoryPosition,
  className = "w-8 h-8",
  stickerSizeClass = "w-4 h-4",
  fallbackIconSizeClass = "w-4 h-4",
  borderClass = "border border-[#D7CCC8]/30",
}: UserAvatarProps) {
  return (
    <div className={cn("rounded-full bg-[#5D4037] flex items-center justify-center relative shrink-0 overflow-visible", className, borderClass)}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className={cn("text-[#A1887F]", fallbackIconSizeClass)} />
        )}
      </div>
      {equippedSticker && (
        <img 
          src={equippedSticker} 
          alt="Sticker" 
          className={cn(
            "absolute object-contain pointer-events-none z-10 animate-pulse",
            stickerSizeClass,
            stickerPosition === 'top-left' && "left-0 top-0 -translate-x-1/4 -translate-y-1/4",
            stickerPosition === 'top-right' && "right-0 top-0 translate-x-1/4 -translate-y-1/4",
            stickerPosition === 'bottom-left' && "left-0 bottom-0 -translate-x-1/4 translate-y-1/4",
            (stickerPosition === 'bottom-right' || !stickerPosition) && "right-0 bottom-0 translate-x-1/4 translate-y-1/4"
          )} 
        />
      )}
      {equippedAccessory && (
        <img 
          src={equippedAccessory} 
          alt="Accessory" 
          style={{
            transform: `translate(${accessoryPosition?.x || 0}px, ${accessoryPosition?.y || 0}px) scale(${(accessoryPosition?.scale ?? 100) / 100}) rotate(${accessoryPosition?.rotate || 0}deg)`,
          }}
          className="absolute inset-0 m-auto object-contain pointer-events-none z-20 w-full h-full max-w-none max-h-none"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
