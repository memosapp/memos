import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContentDisplayProps {
  content: string;
  maxHeight?: number;
  showCopyButton?: boolean;
  className?: string;
}

export function ContentDisplay({
  content,
  maxHeight = 400,
  showCopyButton = true,
  className = "",
}: ContentDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const containerStyle = {
    maxHeight: isExpanded ? "none" : `${maxHeight}px`,
    overflow: isExpanded ? "visible" : "hidden",
  };

  const shouldShowExpandButton = content.length > 1000;
  const isTransparent = className.includes("bg-transparent");

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${
          isTransparent
            ? "bg-transparent p-4"
            : "bg-muted/30 p-6 rounded-lg border"
        } transition-all duration-200`}
        style={containerStyle}
      >
        {/* Copy Button */}
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity z-10"
            title="Copy content"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}

        {/* Markdown Content */}
        <div className="pr-8 prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-muted-foreground prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mb-4 prose-h3:mb-3 prose-p:leading-7 prose-p:mb-4 prose-li:leading-7 prose-ul:my-4 prose-ol:my-4 prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for different elements
              h1: ({ children, ...props }) => (
                <h1
                  className="text-xl font-bold text-foreground border-b border-border pb-3 mb-6"
                  {...props}
                >
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2
                  className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4 mt-6"
                  {...props}
                >
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3
                  className="text-base font-semibold text-foreground mb-3 mt-5"
                  {...props}
                >
                  {children}
                </h3>
              ),
              p: ({ children, ...props }) => (
                <p
                  className="text-foreground leading-7 mb-4 text-sm"
                  {...props}
                >
                  {children}
                </p>
              ),
              ul: ({ children, ...props }) => (
                <ul className="text-foreground my-4 pl-6 space-y-2" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="text-foreground my-4 pl-6 space-y-2" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="text-foreground leading-7 text-sm" {...props}>
                  {children}
                </li>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote
                  className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4"
                  {...props}
                >
                  {children}
                </blockquote>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-semibold text-foreground" {...props}>
                  {children}
                </strong>
              ),
              code: ({ children, ...props }) => (
                <code
                  className="bg-muted px-1 py-0.5 rounded text-xs text-foreground font-mono"
                  {...props}
                >
                  {children}
                </code>
              ),
              pre: ({ children, ...props }) => (
                <pre
                  className="bg-muted p-4 rounded-lg overflow-x-auto my-4"
                  {...props}
                >
                  {children}
                </pre>
              ),
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table
                    className="min-w-full border-collapse border border-border"
                    {...props}
                  >
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children, ...props }) => (
                <thead className="bg-muted/50" {...props}>
                  {children}
                </thead>
              ),
              th: ({ children, ...props }) => (
                <th
                  className="border border-border px-3 py-2 text-left font-semibold text-foreground text-sm"
                  {...props}
                >
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td
                  className="border border-border px-3 py-2 text-foreground text-sm"
                  {...props}
                >
                  {children}
                </td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Fade overlay when collapsed */}
        {!isExpanded && shouldShowExpandButton && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/Collapse Button */}
      {shouldShowExpandButton && (
        <div className="flex justify-center mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
