"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  Hash,
  Star,
  Clock,
  Eye,
  MessageSquare,
  Sparkles,
  Tag,
} from "lucide-react";
import { Memo } from "@/components/types";
import { formatDate } from "@/lib/helpers";
import apiClient from "@/lib/api";
import "@/styles/animation.css";

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoId = params.id as string;

  useEffect(() => {
    const fetchMemo = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/memo/${memoId}`);
        const data = response.data;

        // Convert date strings to Date objects
        data.createdAt = new Date(data.createdAt);
        data.updatedAt = new Date(data.updatedAt);

        setMemo(data);
      } catch (err: any) {
        console.error("Error fetching memo:", err);
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to load memo";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (memoId) {
      fetchMemo();
    }
  }, [memoId]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-6 max-w-4xl">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6 animate-fade-slide-down">
            <Skeleton className="h-10 w-20" />
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Title Skeleton */}
          <div className="mb-6 animate-fade-slide-down delay-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6 animate-fade-slide-down delay-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-6 animate-fade-slide-down">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[400px] animate-fade-slide-down delay-1">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-destructive" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    Error Loading Memory
                  </h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!memo) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-6 animate-fade-slide-down">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[400px] animate-fade-slide-down delay-1">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Hash className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    Memory Not Found
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    The requested memory could not be found or may have been
                    deleted.
                  </p>
                  <Button onClick={() => router.push("/memories")}>
                    Browse Memories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6 animate-fade-slide-down">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <span>Memory</span>
            <span className="mx-2">›</span>
            <span className="font-medium">#{memo.id}</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-6 animate-fade-slide-down delay-1">
          <h1 className="text-3xl font-bold mb-2">Memory Detail</h1>
          <p className="text-muted-foreground">
            Created{" "}
            {formatDate(
              memo.createdAt instanceof Date
                ? memo.createdAt.getTime()
                : new Date(memo.createdAt).getTime()
            )}
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="animate-fade-slide-down delay-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Memory #{memo.id}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  {memo.authorRole}
                </Badge>
                {memo.importance && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" />
                    {memo.importance}/10
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(
                    memo.createdAt instanceof Date
                      ? memo.createdAt.getTime()
                      : new Date(memo.createdAt).getTime()
                  )}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  {memo.accessCount || 0} views
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Content Section */}
          <Card className="animate-fade-slide-down delay-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                  {memo.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Section */}
          {memo.summary && (
            <Card className="animate-fade-slide-down delay-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {memo.summary}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Section */}
          {memo.tags && memo.tags.length > 0 && (
            <Card className="animate-fade-slide-down delay-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5 text-primary" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {memo.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata Section */}
          <Card className="animate-fade-slide-down delay-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Session Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium min-w-24">
                        Session ID:
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {memo.sessionId}
                      </code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium min-w-24">
                        User ID:
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {memo.userId}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Activity
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Access Count:</span>
                      <Badge variant="outline" className="text-xs">
                        {memo.accessCount || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(
                          memo.updatedAt instanceof Date
                            ? memo.updatedAt.getTime()
                            : new Date(memo.updatedAt).getTime()
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
