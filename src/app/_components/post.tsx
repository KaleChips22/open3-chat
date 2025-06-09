"use client";

import { useState } from "react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs glassmorphic-dark p-4 rounded-xl">
      {latestPost ? (
        <p className="truncate text-white mb-4">Your most recent post: <span className="text-accent">{latestPost.name}</span></p>
      ) : (
        <p className="text-white mb-4">You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-black/30 px-4 py-2 text-white border border-accent/20 focus:border-accent/50 focus:outline-none"
        />
        <Button
          type="submit"
          variant="purple"
          className="rounded-lg px-10 py-3 font-semibold"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
