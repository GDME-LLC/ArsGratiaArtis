"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type LikeButtonProps = {
  filmId: string;
  initialLikeCount: number;
  initialLiked: boolean;
};

export function LikeButton({
  filmId,
  initialLikeCount,
  initialLiked,
}: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const nextLiked = !liked;
      const response = await fetch(`/api/films/${filmId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const payload = (await response.json()) as { error?: string; likeCount?: number; liked?: boolean };

      if (!response.ok) {
        return;
      }

      setLiked(Boolean(payload.liked));
      setCount(typeof payload.likeCount === "number" ? payload.likeCount : count);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={liked ? "default" : "ghost"}
      size="lg"
      onClick={handleClick}
      disabled={isPending}
    >
      {liked ? "Liked" : "Like"} {count}
    </Button>
  );
}
