"use client";

import { useState, useCallback } from "react";
import { Heart, ThumbsUp, Bookmark, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// 타입 정의
type TargetType = "PRODUCT" | "TUTORIAL" | "POST" | "COMMENT";
type ReactionType = "LIKE" | "RECOMMEND" | "HELPFUL" | "BOOKMARK";

interface ReactionCounts {
  LIKE: number;
  RECOMMEND: number;
  HELPFUL: number;
  BOOKMARK: number;
}

interface ReactionButtonsProps {
  targetType: TargetType;
  targetId: string;
  initialCounts?: ReactionCounts;
  initialUserReactions?: ReactionType[];
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "card";
  enabledReactions?: ReactionType[];
  className?: string;
}

// 반응 타입별 아이콘과 라벨
const reactionConfig: Record<
  ReactionType,
  {
    icon: typeof Heart;
    label: string;
    activeColor: string;
    hoverColor: string;
  }
> = {
  LIKE: {
    icon: Heart,
    label: "좋아요",
    activeColor: "text-red-500 fill-red-500",
    hoverColor: "hover:text-red-500",
  },
  RECOMMEND: {
    icon: ThumbsUp,
    label: "추천",
    activeColor: "text-blue-500 fill-blue-500",
    hoverColor: "hover:text-blue-500",
  },
  HELPFUL: {
    icon: HelpCircle,
    label: "도움됨",
    activeColor: "text-green-500 fill-green-500",
    hoverColor: "hover:text-green-500",
  },
  BOOKMARK: {
    icon: Bookmark,
    label: "저장",
    activeColor: "text-yellow-500 fill-yellow-500",
    hoverColor: "hover:text-yellow-500",
  },
};

// 사이즈별 스타일
const sizeStyles = {
  sm: {
    button: "h-8 px-2 text-xs",
    icon: "h-3.5 w-3.5",
    gap: "gap-1",
  },
  md: {
    button: "h-9 px-3 text-sm",
    icon: "h-4 w-4",
    gap: "gap-1.5",
  },
  lg: {
    button: "h-10 px-4 text-base",
    icon: "h-5 w-5",
    gap: "gap-2",
  },
};

export function ReactionButtons({
  targetType,
  targetId,
  initialCounts = { LIKE: 0, RECOMMEND: 0, HELPFUL: 0, BOOKMARK: 0 },
  initialUserReactions = [],
  showLabels = false,
  size = "md",
  variant = "default",
  enabledReactions = ["LIKE", "BOOKMARK"],
  className,
}: ReactionButtonsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const [userReactions, setUserReactions] = useState<ReactionType[]>(initialUserReactions);
  const [loading, setLoading] = useState<ReactionType | null>(null);

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      if (loading) return;

      setLoading(type);

      // Optimistic update
      const isActive = userReactions.includes(type);
      const newUserReactions = isActive
        ? userReactions.filter((r) => r !== type)
        : [...userReactions, type];
      const newCounts = {
        ...counts,
        [type]: isActive ? counts[type] - 1 : counts[type] + 1,
      };

      setUserReactions(newUserReactions);
      setCounts(newCounts);

      try {
        const response = await fetch("/api/reactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetType,
            targetId,
            type,
          }),
        });

        if (!response.ok) {
          throw new Error("반응 처리 실패");
        }

        const data = await response.json();
        
        // 서버 응답으로 상태 동기화
        setCounts(data.counts);
        setUserReactions(data.userReactions);
      } catch (error) {
        // 실패 시 롤백
        setUserReactions(userReactions);
        setCounts(counts);
        console.error("반응 처리 오류:", error);
      } finally {
        setLoading(null);
      }
    },
    [session, router, loading, userReactions, counts, targetType, targetId]
  );

  const styles = sizeStyles[size];

  // 변형별 컨테이너 스타일
  const containerStyles = {
    default: "flex items-center gap-2",
    minimal: "flex items-center gap-1",
    card: "flex items-center justify-around p-2 border-t",
  };

  return (
    <div className={cn(containerStyles[variant], className)}>
      {enabledReactions.map((type) => {
        const config = reactionConfig[type];
        const Icon = config.icon;
        const isActive = userReactions.includes(type);
        const count = counts[type];

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading === type}
            className={cn(
              styles.button,
              styles.gap,
              "flex items-center transition-all",
              isActive ? config.activeColor : `text-muted-foreground ${config.hoverColor}`,
              loading === type && "opacity-50"
            )}
          >
            <Icon
              className={cn(
                styles.icon,
                "transition-transform",
                isActive && "scale-110",
                loading === type && "animate-pulse"
              )}
            />
            {(showLabels || count > 0) && (
              <span className={cn(showLabels ? "" : "min-w-[1rem]")}>
                {showLabels ? config.label : count > 0 ? count : ""}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// 단일 반응 버튼 (간단한 사용 케이스)
interface SingleReactionButtonProps {
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
  initialCount?: number;
  initialActive?: boolean;
  showCount?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SingleReactionButton({
  targetType,
  targetId,
  type,
  initialCount = 0,
  initialActive = false,
  showCount = true,
  showLabel = false,
  size = "md",
  className,
}: SingleReactionButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [count, setCount] = useState(initialCount);
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const config = reactionConfig[type];
  const Icon = config.icon;
  const styles = sizeStyles[size];

  const handleClick = async () => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (loading) return;

    setLoading(true);

    // Optimistic update
    const newActive = !isActive;
    const newCount = newActive ? count + 1 : count - 1;
    setIsActive(newActive);
    setCount(newCount);

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("반응 처리 실패");
      }

      const data = await response.json();
      setCount(data.counts[type]);
      setIsActive(data.userReactions.includes(type));
    } catch (error) {
      // 롤백
      setIsActive(isActive);
      setCount(count);
      console.error("반응 처리 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        styles.button,
        styles.gap,
        "flex items-center transition-all",
        isActive ? config.activeColor : `text-muted-foreground ${config.hoverColor}`,
        loading && "opacity-50",
        className
      )}
    >
      <Icon
        className={cn(
          styles.icon,
          "transition-transform",
          isActive && "scale-110",
          loading && "animate-pulse"
        )}
      />
      {showLabel && <span>{config.label}</span>}
      {showCount && count > 0 && <span>{count}</span>}
    </Button>
  );
}

// 좋아요 버튼 (가장 많이 사용되는 케이스를 위한 간편 컴포넌트)
interface LikeButtonProps {
  targetType: TargetType;
  targetId: string;
  initialCount?: number;
  initialActive?: boolean;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LikeButton({
  targetType,
  targetId,
  initialCount = 0,
  initialActive = false,
  showCount = true,
  size = "md",
  className,
}: LikeButtonProps) {
  return (
    <SingleReactionButton
      targetType={targetType}
      targetId={targetId}
      type="LIKE"
      initialCount={initialCount}
      initialActive={initialActive}
      showCount={showCount}
      size={size}
      className={className}
    />
  );
}

// 북마크 버튼
export function BookmarkButton({
  targetType,
  targetId,
  initialCount = 0,
  initialActive = false,
  showCount = false,
  size = "md",
  className,
}: LikeButtonProps) {
  return (
    <SingleReactionButton
      targetType={targetType}
      targetId={targetId}
      type="BOOKMARK"
      initialCount={initialCount}
      initialActive={initialActive}
      showCount={showCount}
      size={size}
      className={className}
    />
  );
}
