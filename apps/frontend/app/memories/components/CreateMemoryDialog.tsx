"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
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
import { X, Plus, MessageSquare, Sparkles, Wand2, Loader2 } from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { AuthorRole } from "@/components/types";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { aiAssistance } from "@/lib/api";

interface CreateMemoryDialogProps {
  trigger?: React.ReactNode;
  defaultSessionId?: string;
  defaultSummary?: string;
  defaultContent?: string;
  defaultTags?: string[];
  defaultAuthorRole?: AuthorRole;
  defaultImportance?: number;
  onSuccess?: (memo: any) => void;
}

export function CreateMemoryDialog({
  trigger,
  defaultSessionId,
  defaultSummary = "",
  defaultContent = "",
  defaultTags = [],
  defaultAuthorRole = AuthorRole.USER,
  defaultImportance = 0.5,
  onSuccess,
}: CreateMemoryDialogProps) {
  const { createMemo, isLoading } = useMemoriesApi();
  const [open, setOpen] = useState(false);

  // Form state - remove userId from form data
  const [formData, setFormData] = useState({
    sessionId: defaultSessionId || `session_${Date.now()}`,
    content: defaultContent,
    summary: defaultSummary,
    authorRole: defaultAuthorRole,
    importance: defaultImportance,
    tags: defaultTags,
    appName: undefined as string | undefined,
  });

  const [newTag, setNewTag] = useState("");

  // AI assistance loading states
  const [aiLoading, setAiLoading] = useState({
    enhanceContent: false,
    generateSummary: false,
    generateTags: false,
    generateContent: false,
  });

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
      sessionId: defaultSessionId || `session_${Date.now()}`,
      content: defaultContent,
      summary: defaultSummary,
      authorRole: defaultAuthorRole,
      importance: defaultImportance,
      tags: defaultTags,
      appName: undefined,
    });
    setNewTag("");
  };

  // AI assistance handlers
  const handleEnhanceContent = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setAiLoading((prev) => ({ ...prev, enhanceContent: true }));
    try {
      const enhancedContent = await aiAssistance.enhanceContent(
        formData.content
      );
      setFormData((prev) => ({
        ...prev,
        content: enhancedContent,
        appName: "Gemini",
      }));
      toast.success("Content enhanced successfully!");
    } catch (error) {
      console.error("Error enhancing content:", error);
      toast.error("Failed to enhance content");
    } finally {
      setAiLoading((prev) => ({ ...prev, enhanceContent: false }));
    }
  };

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
    const prompt =
      "Write a helpful memo about productivity tips for developers";

    setAiLoading((prev) => ({ ...prev, generateContent: true }));
    try {
      const generatedContent = await aiAssistance.generateContent(prompt);
      setFormData((prev) => ({
        ...prev,
        content: generatedContent,
        appName: "Gemini",
      }));
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content");
    } finally {
      setAiLoading((prev) => ({ ...prev, generateContent: false }));
    }
  };

  const handleCreateMemory = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      // Remove userId from request - it will be handled by auth middleware
      const memoRequest = {
        sessionId: formData.sessionId,
        content: formData.content,
        summary: formData.summary || undefined,
        authorRole: formData.authorRole,
        importance: formData.importance,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        appName: formData.appName || undefined,
      };

      const createdMemo = await createMemo(memoRequest);

      toast.success("Memory created successfully");
      setOpen(false);
      resetForm();

      if (onSuccess) {
        onSuccess(createdMemo);
      } else {
        // Refresh the page to show the new memory
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create memory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Memory
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create New Memory
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
                >
                  {aiLoading.generateContent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnhanceContent}
                  disabled={
                    aiLoading.enhanceContent || !formData.content.trim()
                  }
                  className="text-xs text-zinc-400 hover:text-white border-zinc-600"
                >
                  {aiLoading.enhanceContent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Enhance
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMemory}
              disabled={isLoading || !formData.content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating..." : "Create Memory"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
