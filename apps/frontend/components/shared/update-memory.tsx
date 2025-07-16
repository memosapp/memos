"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { usePathname } from "next/navigation";
import { aiAssistance } from "@/lib/api";

interface UpdateMemoProps {
  memoId: string;
  memoContent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpdateMemo = ({
  memoId,
  memoContent,
  open,
  onOpenChange,
}: UpdateMemoProps) => {
  const { updateMemo, isLoading, fetchMemos, fetchMemoById } = useMemoriesApi();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // AI assistance loading states
  const [aiLoading, setAiLoading] = useState({
    enhanceContent: false,
    generateContent: false,
  });

  const handleUpdateMemo = async (text: string) => {
    try {
      await updateMemo(memoId, { content: text });
      toast.success("Memo updated successfully");
      onOpenChange(false);
      if (pathname.includes("memories")) {
        await fetchMemos();
      } else {
        await fetchMemoById(memoId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update memo");
    }
  };

  // AI assistance handlers
  const handleEnhanceContent = async () => {
    const currentContent = textRef.current?.value || "";
    if (!currentContent.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setAiLoading((prev) => ({ ...prev, enhanceContent: true }));
    try {
      const enhancedContent = await aiAssistance.enhanceContent(currentContent);
      if (textRef.current) {
        textRef.current.value = enhancedContent;
      }
      toast.success("Content enhanced successfully!");
    } catch (error) {
      console.error("Error enhancing content:", error);
      toast.error("Failed to enhance content");
    } finally {
      setAiLoading((prev) => ({ ...prev, enhanceContent: false }));
    }
  };

  const handleGenerateContent = async () => {
    const prompt =
      "Write a helpful memo about productivity tips for developers";

    setAiLoading((prev) => ({ ...prev, generateContent: true }));
    try {
      const generatedContent = await aiAssistance.generateContent(prompt);
      if (textRef.current) {
        textRef.current.value = generatedContent;
      }
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content");
    } finally {
      setAiLoading((prev) => ({ ...prev, generateContent: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-zinc-900 border-zinc-800 z-50">
        <DialogHeader>
          <DialogTitle>Update Memory</DialogTitle>
          <DialogDescription>Edit your existing memory</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="memory">Memory</Label>
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
                  disabled={aiLoading.enhanceContent}
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
              ref={textRef}
              id="memo"
              className="bg-zinc-950 border-zinc-800 min-h-[150px]"
              defaultValue={memoContent}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="w-[140px]"
            disabled={isLoading}
            onClick={() => handleUpdateMemo(textRef?.current?.value || "")}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Update Memory"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMemo;
