import React from "react";
import { AttachedFile } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  Download,
  ExternalLink,
  FileIcon,
  Paperclip,
} from "lucide-react";
import { formatDate } from "@/lib/helpers";

interface AttachedFilesProps {
  files: AttachedFile[];
  showUploadDate?: boolean;
  compact?: boolean;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  } else if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  } else if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  } else if (mimeType.startsWith("text/")) {
    return <FileText className="h-4 w-4" />;
  }
  return <FileIcon className="h-4 w-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toUpperCase() || "";
};

export function AttachedFiles({
  files,
  showUploadDate = false,
  compact = false,
}: AttachedFilesProps) {
  if (!files || files.length === 0) {
    return null;
  }

  const handleFileClick = (fileUrl: string, fileName: string) => {
    // Open file in new tab
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (
    fileUrl: string,
    fileName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-zinc-500" />
        <span className="text-sm text-zinc-400">
          {files.length} file{files.length > 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attached Files ({files.length})
      </h4>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/80 transition-colors group cursor-pointer"
            onClick={() => handleFileClick(file.fileUrl, file.fileName)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(file.fileMimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate hover:text-blue-400 transition-colors">
                    {file.fileName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getFileExtension(file.fileName)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-zinc-400">
                    {formatFileSize(file.fileSize)}
                  </span>
                  {showUploadDate && (
                    <span className="text-xs text-zinc-400">
                      Uploaded{" "}
                      {formatDate(
                        typeof file.uploadedAt === "string"
                          ? new Date(file.uploadedAt).getTime()
                          : file.uploadedAt.getTime()
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-zinc-700"
                onClick={(e) => handleDownload(file.fileUrl, file.fileName, e)}
                title="Download file"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-zinc-700"
                title="Open in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
