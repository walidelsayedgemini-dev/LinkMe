import { useState } from "react";
import { cn } from "@/lib/utils";
import { getAvatarPreset, getStreakSkin } from "@shared/gamification-catalog";

export function StudentAvatarBadge({
  avatarPreset,
  equippedSkin,
  size = "md",
  showSkinBadge = true,
  className,
}: {
  avatarPreset?: string | null;
  equippedSkin?: string | null;
  size?: "sm" | "md" | "lg";
  showSkinBadge?: boolean;
  className?: string;
}) {
  const avatar = getAvatarPreset(avatarPreset);
  const skin = getStreakSkin(equippedSkin);
  const [imgFailed, setImgFailed] = useState(false);

  const dims = {
    sm: "size-9 text-lg",
    md: "size-12 text-xl",
    lg: "size-[72px] text-3xl",
  }[size];

  const badgeDims = {
    sm: "size-4 text-[9px] -bottom-0.5 -end-0.5",
    md: "size-5 text-[10px] -bottom-1 -end-1",
    lg: "size-6 text-xs -bottom-1 -end-1",
  }[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br text-white select-none transition-transform",
          avatar.bgClass,
          skin.ringClass,
          dims
        )}
        title={`${avatar.label} · ${skin.name}`}
      >
        {!imgFailed && avatar.imageUrl ? (
          <img
            src={avatar.imageUrl}
            alt={avatar.label}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{avatar.emoji}</span>
        )}
      </div>
      {showSkinBadge && (skin.minStreak > 0 || skin.isPro) && (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full border border-card bg-card shadow-sm",
            badgeDims
          )}
          title={skin.name}
        >
          {skin.badgeEmoji}
        </span>
      )}
    </div>
  );
}
