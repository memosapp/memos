import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Hash,
  MessageSquare,
  Sparkles,
  Tag,
  Clock,
} from "lucide-react";
import "@/styles/animation.css";

export function MemorySkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6 animate-fade-slide-down">
          <div className="flex items-center gap-4">
            <Button variant="outline" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              <span>Memory</span>
              <span className="mx-2">›</span>
              <Skeleton className="h-4 w-8 inline-block" />
            </div>
          </div>
          <Button
            variant="default"
            disabled
            className="flex items-center gap-2"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-6 animate-fade-slide-down delay-1">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="animate-fade-slide-down delay-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                <Skeleton className="h-6 w-24" />
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-6" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-12" />
                </div>
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
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Section */}
          <Card className="animate-fade-slide-down delay-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card className="animate-fade-slide-down delay-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-primary" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </CardContent>
          </Card>

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
                      <Skeleton className="h-5 w-32 rounded" />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium min-w-24">
                        User ID:
                      </span>
                      <Skeleton className="h-5 w-28 rounded" />
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
                      <Skeleton className="h-5 w-8 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <Skeleton className="h-4 w-24" />
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
