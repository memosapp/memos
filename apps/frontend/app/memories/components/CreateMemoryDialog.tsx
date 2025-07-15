"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { GoPlus } from "react-icons/go";
import { Loader2 } from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { AuthorRole } from "@/components/types";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function CreateMemoryDialog() {
  const { createMemo, isLoading } = useMemoriesApi();
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const userId = useSelector((state: RootState) => state.profile.userId);

  const handleCreateMemory = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      await createMemo({
        sessionId: `session_${Date.now()}`, // Generate a session ID
        userId: userId,
        content: text,
        authorRole: AuthorRole.USER,
        importance: 1.0,
        tags: [], // Could be extracted from content later
      });

      toast.success("Memory created successfully");
      setOpen(false);

      // Clear the textarea
      if (textRef.current) {
        textRef.current.value = "";
      }

      // Refresh the page to show the new memory
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create memory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <GoPlus />
          Create Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Create Memory</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Add a new memory to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="memory-text" className="text-white">
              Memory Content
            </Label>
            <Textarea
              id="memory-text"
              ref={textRef}
              placeholder="Enter your memory content here..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (textRef.current) {
                handleCreateMemory(textRef.current.value);
              }
            }}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Memory"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
