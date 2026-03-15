"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCountValue, formatFollowerCount } from "@/lib/utils";

type FollowButtonProps = {
  creatorId: string;
  initialFollowerCount: number;
  initialFollowing: boolean;
  isCurrentUser: boolean;
};

export function FollowButton({
  creatorId,
  initialFollowerCount,
  initialFollowing,
  isCurrentUser,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialFollowerCount);
  const [isPending, setIsPending] = useState(false);

  if (isCurrentUser) {
    return null;
  }

  async function handleClick() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const nextFollowing = !following;
      const response = await fetch(`/api/creators/${creatorId}/follow`, {
        method: nextFollowing ? "POST" : "DELETE",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        followerCount?: number;
        following?: boolean;
      };

      if (!response.ok) {
        return;
      }

      setFollowing(Boolean(payload.following));
      setCount(typeof payload.followerCount === "number" ? payload.followerCount : count);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const buttonLabel = following ? "Following" : "Follow";

  return (
    <Button
      type="button"
      variant={following ? "default" : "ghost"}
      size="lg"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`${buttonLabel} this filmmaker. ${formatFollowerCount(count)}.`}
      title={formatFollowerCount(count)}
    >
      {buttonLabel}
      <span className="ml-2 text-muted-foreground">{formatCountValue(count)}</span>
    </Button>
  );
}
