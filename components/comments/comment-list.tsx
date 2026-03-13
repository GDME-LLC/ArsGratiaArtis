import type { FilmComment } from "@/types";

type CommentListProps = {
  comments: FilmComment[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <p className="body-sm text-muted-foreground">
          No comments yet. Start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="rounded-[24px] border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="display-kicker">
                {comment.authorHandle ? `@${comment.authorHandle}` : comment.authorDisplayName}
              </p>
              {!comment.isDeleted ? (
                <p className="mt-2 text-sm text-foreground">{comment.authorDisplayName}</p>
              ) : null}
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="body-sm mt-4">
            {comment.isDeleted ? "Comment removed." : comment.body}
          </p>
        </article>
      ))}
    </div>
  );
}
