import React from 'react';
import { User } from 'lucide-react';
import { cn } from './Layout';

interface UserAvatarProps {
  avatarUrl?: string | null;
  equippedAccessory?: string | null;
  accessoryPosition?: { x: number; y: number; scale: number; rotate: number } | null;
  bgClass?: string;
  className?: string; // e.g. "w-10 h-10" or "w-8 h-8"
  stickerSizeClass?: string; // KEEP THIS if needed by other files temporarily, wait, let's remove it if it's safe.
  fallbackIconSizeClass?: string; // e.g. "w-4 h-4" or "w-5 h-5"
  borderClass?: string; // e.g. "border border-[#D7CCC8]/30"
}

export function UserAvatar({
  avatarUrl,
  equippedAccessory,
  accessoryPosition,
  className = "w-8 h-8",
  stickerSizeClass,
  fallbackIconSizeClass = "w-4 h-4",
  borderClass = "border border-[#D7CCC8]/30",
  bgClass,
}: UserAvatarProps) {
  const roundedClass = className?.split(' ').find(c => c.startsWith('rounded-')) || 'rounded-full';
  const finalBgClass = bgClass !== undefined ? bgClass : (avatarUrl ? "bg-transparent" : "bg-[#5D4037]");

  return (
    <div className={cn("rounded-full flex items-center justify-center relative shrink-0 overflow-visible", className, borderClass)}>
      <div className={cn("w-full h-full overflow-hidden flex items-center justify-center", roundedClass, finalBgClass)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className={cn("text-[#A1887F]", fallbackIconSizeClass)} />
        )}
      </div>
      {equippedAccessory && (
        <img 
          src={equippedAccessory} 
          alt="Accessory" 
          style={{
            transform: `translate(${accessoryPosition?.x || 0}%, ${accessoryPosition?.y || 0}%) scale(${(accessoryPosition?.scale ?? 100) / 100}) rotate(${accessoryPosition?.rotate || 0}deg)`,
          }}
          className="absolute inset-0 m-auto object-contain pointer-events-none z-20 w-full h-full max-w-none max-h-none"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
