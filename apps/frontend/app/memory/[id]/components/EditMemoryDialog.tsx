"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  X,
  Plus,
  MessageSquare,
  Sparkles,
  Wand2,
  Loader2,
  Edit,
} from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { AuthorRole, Memo } from "@/components/types";
import { toast } from "sonner";
import { aiAssistance } from "@/lib/api";

interface EditMemoryDialogProps {
  memo: Memo;
  trigger?: React.ReactNode;
  onSuccess?: (memo: Memo) => void;
}

export function EditMemoryDialog({
  memo,
  trigger,
  onSuccess,
}: EditMemoryDialogProps) {
  const { updateMemo, isLoading } = useMemoriesApi();
  const [open, setOpen] = useState(false);

  // Form state - initialize with current memo data
  const [formData, setFormData] = useState({
    sessionId: memo.sessionId || "",
    content: memo.content,
    summary: memo.summary || "",
    authorRole: memo.authorRole,
    importance: memo.importance || 0.5,
    tags: memo.tags || [],
    appName: memo.appName,
  });

  const [newTag, setNewTag] = useState("");

  // AI assistance loading states
  const [aiLoading, setAiLoading] = useState({
    enhanceContent: false,
    generateSummary: false,
    generateTags: false,
    generateContent: false,
  });

  // Reset form data when memo changes
  useEffect(() => {
    setFormData({
      sessionId: memo.sessionId || "",
      content: memo.content,
      summary: memo.summary || "",
      authorRole: memo.authorRole,
      importance: memo.importance || 0.5,
      tags: memo.tags || [],
      appName: memo.appName,
    });
  }, [memo]);

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
      sessionId: memo.sessionId || "",
      content: memo.content,
      summary: memo.summary || "",
      authorRole: memo.authorRole,
      importance: memo.importance || 0.5,
      tags: memo.tags || [],
      appName: memo.appName,
    });
    setNewTag("");
  };

  // Helper function to check if form data has changed
  const hasChanges = () => {
    const originalData = {
      sessionId: memo.sessionId || "",
      content: memo.content,
      summary: memo.summary || "",
      authorRole: memo.authorRole,
      importance: memo.importance || 0.5,
      tags: memo.tags || [],
      appName: memo.appName,
    };

    // Compare primitive values
    if (
      formData.sessionId !== originalData.sessionId ||
      formData.content !== originalData.content ||
      formData.summary !== originalData.summary ||
      formData.authorRole !== originalData.authorRole ||
      formData.importance !== originalData.importance ||
      formData.appName !== originalData.appName
    ) {
      return true;
    }

    // Compare tags arrays
    if (formData.tags.length !== originalData.tags.length) {
      return true;
    }

    // Check if all tags are the same (order doesn't matter)
    const originalTagsSet = new Set(originalData.tags);
    const formTagsSet = new Set(formData.tags);

    if (originalTagsSet.size !== formTagsSet.size) {
      return true;
    }

    for (const tag of formTagsSet) {
      if (!originalTagsSet.has(tag)) {
        return true;
      }
    }

    return false;
  };

  const isUpdateDisabled =
    isLoading || !formData.content.trim() || !hasChanges();

  // AI assistance handlers
  const handleGenerateSummary = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setAiLoading((prev) => ({ ...prev, generateSummary: true }));
    try {
      const summary = await aiAssistance.summarizeContent(formData.content);
      setFormData((prev) => ({ ...prev, summary, appName: "Gemini" }));
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setAiLoading((prev) => ({ ...prev, generateSummary: false }));
    }
  };

  const handleGenerateTags = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setAiLoading((prev) => ({ ...prev, generateTags: true }));
    try {
      const suggestedTags = await aiAssistance.generateTags(formData.content);
      const uniqueTags = [...new Set([...formData.tags, ...suggestedTags])];
      setFormData((prev) => ({ ...prev, tags: uniqueTags, appName: "Gemini" }));
      toast.success("Tags generated successfully!");
    } catch (error) {
      console.error("Error generating tags:", error);
      toast.error("Failed to generate tags");
    } finally {
      setAiLoading((prev) => ({ ...prev, generateTags: false }));
    }
  };

  const handleGenerateContent = async () => {
    const currentContent = formData.content.trim();

    let prompt: string;

    if (currentContent) {
      // If user has provided content, enhance it with context and clarity
      prompt = `Please enhance and expand the following content by adding context, improving clarity, and enriching details while maintaining the original intent. Make it more comprehensive and well-structured:

"${currentContent}"

Please provide an enhanced version that is more detailed, clear, and informative while staying true to the original message.`;
    } else {
      // If no content provided, use default prompt
      prompt =
        "Write a helpful memo about productivity tips for developers. Include practical advice, best practices, and actionable insights that can improve daily workflow and efficiency.";
    }

    setAiLoading((prev) => ({ ...prev, generateContent: true }));
    try {
      const generatedContent = await aiAssistance.generateContent(prompt);
      setFormData((prev) => ({
        ...prev,
        content: generatedContent,
        appName: "Gemini",
      }));
      toast.success(
        currentContent
          ? "Content enhanced successfully!"
          : "Content generated successfully!"
      );
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(
        currentContent
          ? "Failed to enhance content"
          : "Failed to generate content"
      );
    } finally {
      setAiLoading((prev) => ({ ...prev, generateContent: false }));
    }
  };

  const handleUpdateMemory = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      // Create update request with only changed fields
      const updateRequest = {
        sessionId: formData.sessionId || undefined,
        content: formData.content,
        summary: formData.summary || undefined,
        authorRole: formData.authorRole,
        importance: formData.importance,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        appName: formData.appName || undefined,
      };

      const updatedMemo = await updateMemo(memo.id.toString(), updateRequest);

      toast.success("Memory updated successfully");
      setOpen(false);

      if (onSuccess) {
        onSuccess(updatedMemo);
      } else {
        // Refresh the page to show the updated memory
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update memory");
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (!isUpdateDisabled) {
          handleUpdateMemory();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isUpdateDisabled, handleUpdateMemory]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Memory
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Memory #{memo.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="content"
                className="text-zinc-300 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Content *
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={aiLoading.generateContent}
                  className="text-xs text-zinc-400 hover:text-white border-zinc-600"
                  title={
                    formData.content.trim()
                      ? "Enhance existing content with more context and clarity"
                      : "Generate new content from scratch"
                  }
                >
                  {aiLoading.generateContent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {formData.content.trim() ? "Enhance" : "Generate"}
                </Button>
              </div>
            </div>
            <Textarea
              id="content"
              placeholder="Enter your memory content..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="min-h-[120px] bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              required
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="summary"
                className="text-zinc-300 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Summary
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={aiLoading.generateSummary || !formData.content.trim()}
                className="text-xs text-zinc-400 hover:text-white border-zinc-600"
              >
                {aiLoading.generateSummary ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Generate
              </Button>
            </div>
            <Input
              id="summary"
              placeholder="Optional summary..."
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
            />
          </div>

          {/* Session ID */}
          <div className="space-y-2">
            <Label htmlFor="sessionId" className="text-zinc-300">
              Session ID
            </Label>
            <Input
              id="sessionId"
              placeholder="Session identifier..."
              value={formData.sessionId}
              onChange={(e) =>
                setFormData({ ...formData, sessionId: e.target.value })
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
            />
          </div>

          {/* Author Role */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Author Role</Label>
            <Select
              value={formData.authorRole}
              onValueChange={(value) =>
                setFormData({ ...formData, authorRole: value as AuthorRole })
              }
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value={AuthorRole.USER}>User</SelectItem>
                <SelectItem value={AuthorRole.AGENT}>Agent</SelectItem>
                <SelectItem value={AuthorRole.SYSTEM}>System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Importance */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              Importance: {formData.importance.toFixed(2)}
            </Label>
            <Slider
              value={[formData.importance]}
              onValueChange={(value) =>
                setFormData({ ...formData, importance: value[0] })
              }
              max={1}
              min={0}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Tags</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateTags}
                disabled={aiLoading.generateTags || !formData.content.trim()}
                className="text-xs text-zinc-400 hover:text-white border-zinc-600"
              >
                {aiLoading.generateTags ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Generate
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            {!hasChanges() && !isLoading && formData.content.trim() && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span>💡</span>
                <span>Make changes to enable the update button</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="text-xs text-zinc-500">
                Press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-zinc-800 rounded">
                  Ctrl+S
                </kbd>{" "}
                to save
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMemory}
                  disabled={isUpdateDisabled}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  title={
                    !hasChanges() && !isLoading && formData.content.trim()
                      ? "No changes made"
                      : ""
                  }
                >
                  {isLoading
                    ? "Updating..."
                    : !hasChanges()
                    ? "No Changes"
                    : "Update Memory"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
