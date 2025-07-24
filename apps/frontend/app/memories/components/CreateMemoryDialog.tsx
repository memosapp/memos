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
import {
  X,
  Plus,
  MessageSquare,
  Sparkles,
  Wand2,
  Loader2,
  FileText,
  Upload,
} from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { AuthorRole } from "@/components/types";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { aiAssistance, pdfProcessing } from "@/lib/api";

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
    content: defaultContent || "",
    summary: defaultSummary || "",
    authorRole: defaultAuthorRole || AuthorRole.USER,
    importance: defaultImportance || 0.5,
    tags: defaultTags || [],
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

  // PDF processing state
  const [pdfState, setPdfState] = useState({
    isProcessing: false,
    selectedFile: null as File | null,
  });

  const handleAddTag = () => {
    const trimmedTag = (newTag || "").trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
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
    setPdfState({
      isProcessing: false,
      selectedFile: null,
    });
  };

  // AI assistance handlers
  const handleGenerateSummary = async () => {
    if (!(formData.content || "").trim()) {
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
    if (!(formData.content || "").trim()) {
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
    const currentContent = (formData.content || "").trim();

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

  // PDF processing handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        // 20MB limit
        toast.error("PDF file size must be less than 20MB");
        return;
      }

      setPdfState((prev) => ({ ...prev, selectedFile: file }));
    }
  };

  const handleProcessPDF = async () => {
    if (!pdfState.selectedFile) {
      toast.error("Please select a PDF file first");
      return;
    }

    setPdfState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const result = await pdfProcessing.processPDF(pdfState.selectedFile);

      // Auto-populate form fields with extracted content
      setFormData((prev) => ({
        ...prev,
        content: result.memo.content,
        summary: result.memo.summary || prev.summary,
        tags: result.memo.tags
          ? [...new Set([...prev.tags, ...result.memo.tags])]
          : prev.tags,
        appName: result.processingResult.appName,
      }));

      toast.success(`Successfully created memory from PDF`);

      // Clear the selected file
      setPdfState((prev) => ({ ...prev, selectedFile: null }));

      // Close dialog and refresh memories since memo was already created
      setOpen(false);
      onSuccess?.(result.memo);
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      toast.error(
        error.response?.data?.error || error.message || "Failed to process PDF"
      );
    } finally {
      setPdfState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handleCreateMemory = async () => {
    if (!(formData.content || "").trim()) {
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
          {/* PDF Upload */}
          <div className="space-y-3 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <Label className="text-zinc-300 font-medium">
                Upload PDF Document
              </Label>
            </div>
            <div className="text-sm text-zinc-400 mb-3">
              Upload a PDF file to automatically create a memory with structured
              content (max 20MB)
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={pdfState.isProcessing}
                  className="bg-zinc-700 border-zinc-600 text-white file:bg-zinc-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                />
              </div>

              {pdfState.selectedFile && (
                <Button
                  type="button"
                  onClick={handleProcessPDF}
                  disabled={pdfState.isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 px-4"
                >
                  {pdfState.isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Memory
                    </>
                  )}
                </Button>
              )}
            </div>

            {pdfState.selectedFile && (
              <div className="text-sm text-zinc-400 mt-2">
                Selected: {pdfState.selectedFile.name} (
                {Math.round(pdfState.selectedFile.size / 1024)} KB)
              </div>
            )}
          </div>

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
                    (formData.content || "").trim()
                      ? "Enhance existing content with more context and clarity"
                      : "Generate new content from scratch"
                  }
                >
                  {aiLoading.generateContent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {(formData.content || "").trim() ? "Enhance" : "Generate"}
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
              disabled={
                aiLoading.generateContent ||
                aiLoading.generateSummary ||
                aiLoading.generateTags
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
                disabled={
                  aiLoading.generateSummary || !(formData.content || "").trim()
                }
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
              disabled={aiLoading.generateSummary}
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
                disabled={
                  aiLoading.generateTags || !(formData.content || "").trim()
                }
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
                disabled={aiLoading.generateTags}
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!(newTag || "").trim() || aiLoading.generateTags}
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
              disabled={isLoading || !(formData.content || "").trim()}
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
