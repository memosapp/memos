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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { GoPlus } from "react-icons/go";
import { Loader2, X } from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { toast } from "sonner";
import { AuthorRole } from "@/components/types";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function CreateMemoryDialog() {
  const { createMemo, isLoading } = useMemoriesApi();
  const [open, setOpen] = useState(false);
  const userId = useSelector((state: RootState) => state.profile.userId);

  // Form state
  const [formData, setFormData] = useState({
    sessionId: `session_${Date.now()}`,
    userId: userId,
    content: "",
    summary: "",
    authorRole: AuthorRole.USER,
    importance: 1.0,
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const resetForm = () => {
    setFormData({
      sessionId: `session_${Date.now()}`,
      userId: userId,
      content: "",
      summary: "",
      authorRole: AuthorRole.USER,
      importance: 1.0,
      tags: [],
    });
    setNewTag("");
  };

  const handleCreateMemory = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      const memoRequest = {
        sessionId: formData.sessionId,
        userId: formData.userId,
        content: formData.content,
        summary: formData.summary || undefined,
        authorRole: formData.authorRole,
        importance: formData.importance,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await createMemo(memoRequest);

      toast.success("Memory created successfully");
      setOpen(false);
      resetForm();

      // Refresh the page to show the new memory
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create memory");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
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
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Memory</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Add a new memory to your collection with all details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Session ID */}
          <div className="grid gap-2">
            <Label htmlFor="session-id" className="text-white">
              Session ID
            </Label>
            <Input
              id="session-id"
              value={formData.sessionId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sessionId: e.target.value }))
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              placeholder="Enter session ID"
            />
          </div>

          {/* User ID */}
          <div className="grid gap-2">
            <Label htmlFor="user-id" className="text-white">
              User ID
            </Label>
            <Input
              id="user-id"
              value={formData.userId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, userId: e.target.value }))
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              placeholder="Enter user ID"
            />
          </div>

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="content" className="text-white">
              Content *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Enter your memory content here..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              rows={4}
            />
          </div>

          {/* Summary */}
          <div className="grid gap-2">
            <Label htmlFor="summary" className="text-white">
              Summary <span className="text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="Enter a brief summary of the memory..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              rows={2}
            />
          </div>

          {/* Author Role */}
          <div className="grid gap-2">
            <Label htmlFor="author-role" className="text-white">
              Author Role
            </Label>
            <Select
              value={formData.authorRole}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  authorRole: value as AuthorRole,
                }))
              }
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select author role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value={AuthorRole.USER} className="text-white">
                  User
                </SelectItem>
                <SelectItem value={AuthorRole.AGENT} className="text-white">
                  Agent
                </SelectItem>
                <SelectItem value={AuthorRole.SYSTEM} className="text-white">
                  System
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Importance */}
          <div className="grid gap-2">
            <Label htmlFor="importance" className="text-white">
              Importance: {formData.importance}
            </Label>
            <Slider
              id="importance"
              min={0}
              max={10}
              step={0.1}
              value={[formData.importance]}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, importance: value[0] }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>0 (Low)</span>
              <span>10 (High)</span>
            </div>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags" className="text-white">
              Tags <span className="text-zinc-400">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
            onClick={handleCreateMemory}
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
