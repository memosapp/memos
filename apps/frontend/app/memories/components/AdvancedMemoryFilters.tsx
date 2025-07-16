"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  User,
  Tag,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthorRole } from "@/components/types";

interface FilterState {
  appNames: string[];
  tags: string[];
  authorRoles: AuthorRole[];
  sortBy: "createdAt" | "updatedAt" | "accessCount";
  sortOrder: "asc" | "desc";
}

const initialFilterState: FilterState = {
  appNames: [],
  tags: [],
  authorRoles: [],
  sortBy: "updatedAt",
  sortOrder: "desc",
};

export function AdvancedMemoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memos = useSelector((state: RootState) => state.memories.memos);

  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [tempFilters, setTempFilters] =
    useState<FilterState>(initialFilterState);

  // Extract unique values from memos for filter options
  const uniqueAppNames = [
    ...new Set(memos.map((memo) => memo.appName).filter(Boolean)),
  ] as string[];
  const uniqueTags = [...new Set(memos.flatMap((memo) => memo.tags || []))];
  const authorRoles = Object.values(AuthorRole);

  // Load filters from URL params
  useEffect(() => {
    const appNamesParam = searchParams.get("appNames");
    const tagsParam = searchParams.get("tags");
    const authorRolesParam = searchParams.get("authorRoles");
    const sortByParam = searchParams.get("sortBy");
    const sortOrderParam = searchParams.get("sortOrder");

    const appNames = appNamesParam?.split(",").filter(Boolean) || [];
    const tags = tagsParam?.split(",").filter(Boolean) || [];
    const authorRoles =
      (authorRolesParam?.split(",").filter(Boolean) as AuthorRole[]) || [];
    const sortBy = (sortByParam as FilterState["sortBy"]) || "updatedAt";
    const sortOrder = (sortOrderParam as FilterState["sortOrder"]) || "desc";

    const newFilters = {
      appNames,
      tags,
      authorRoles,
      sortBy,
      sortOrder,
    };

    setFilters(newFilters);
    setTempFilters(newFilters);
  }, [
    searchParams.get("appNames"),
    searchParams.get("tags"),
    searchParams.get("authorRoles"),
    searchParams.get("sortBy"),
    searchParams.get("sortOrder"),
  ]);

  // Apply filters to URL
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Set filter parameters
    if (tempFilters.appNames.length > 0) {
      params.set("appNames", tempFilters.appNames.join(","));
    } else {
      params.delete("appNames");
    }

    if (tempFilters.tags.length > 0) {
      params.set("tags", tempFilters.tags.join(","));
    } else {
      params.delete("tags");
    }

    if (tempFilters.authorRoles.length > 0) {
      params.set("authorRoles", tempFilters.authorRoles.join(","));
    } else {
      params.delete("authorRoles");
    }

    params.set("sortBy", tempFilters.sortBy);
    params.set("sortOrder", tempFilters.sortOrder);

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }, [tempFilters, searchParams, router]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setTempFilters(initialFilterState);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("appNames");
    params.delete("tags");
    params.delete("authorRoles");
    params.delete("sortBy");
    params.delete("sortOrder");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }, [searchParams, router]);

  // Quick sort functionality
  const quickSort = useCallback(
    (sortBy: FilterState["sortBy"], sortOrder: FilterState["sortOrder"]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Filter toggle functions
  const toggleAppName = (appName: string) => {
    setTempFilters((prev) => ({
      ...prev,
      appNames: prev.appNames.includes(appName)
        ? prev.appNames.filter((a) => a !== appName)
        : [...prev.appNames, appName],
    }));
  };

  const toggleTag = (tag: string) => {
    setTempFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleAuthorRole = (role: AuthorRole) => {
    setTempFilters((prev) => ({
      ...prev,
      authorRoles: prev.authorRoles.includes(role)
        ? prev.authorRoles.filter((r) => r !== role)
        : [...prev.authorRoles, role],
    }));
  };

  // Count active filters
  const activeFiltersCount =
    filters.appNames.length + filters.tags.length + filters.authorRoles.length;

  return (
    <div className="flex items-center gap-2 mb-4">
      {/* Quick Sort Buttons */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {filters.sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => quickSort("updatedAt", "desc")}>
            <Clock className="h-4 w-4 mr-2" />
            Newest Updated
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickSort("updatedAt", "asc")}>
            <Clock className="h-4 w-4 mr-2" />
            Oldest Updated
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickSort("createdAt", "desc")}>
            <Calendar className="h-4 w-4 mr-2" />
            Newest Created
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickSort("createdAt", "asc")}>
            <Calendar className="h-4 w-4 mr-2" />
            Oldest Created
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickSort("accessCount", "desc")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Most Viewed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickSort("accessCount", "asc")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Least Viewed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Filters Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter Memories</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="apps" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apps" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Apps
                {tempFilters.appNames.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tempFilters.appNames.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
                {tempFilters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tempFilters.tags.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Roles
                {tempFilters.authorRoles.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tempFilters.authorRoles.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apps" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Select Apps</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTempFilters((prev) => ({ ...prev, appNames: [] }))
                    }
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {uniqueAppNames.map((appName) => (
                    <div key={appName} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${appName}`}
                        checked={tempFilters.appNames.includes(appName)}
                        onCheckedChange={() => toggleAppName(appName)}
                      />
                      <Label
                        htmlFor={`app-${appName}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {appName}
                      </Label>
                    </div>
                  ))}
                  {uniqueAppNames.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No apps found in your memories
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Select Tags</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTempFilters((prev) => ({ ...prev, tags: [] }))
                    }
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {uniqueTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={tempFilters.tags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                  {uniqueTags.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No tags found in your memories
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Select Author Roles</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTempFilters((prev) => ({ ...prev, authorRoles: [] }))
                    }
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {authorRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={tempFilters.authorRoles.includes(role)}
                        onCheckedChange={() => toggleAuthorRole(role)}
                      />
                      <Label
                        htmlFor={`role-${role}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTempFilters(filters);
                  setIsOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.appNames.map((appName) => (
            <Badge key={appName} variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {appName}
              <button
                onClick={() => {
                  const newAppNames = filters.appNames.filter(
                    (a) => a !== appName
                  );
                  const params = new URLSearchParams(searchParams.toString());
                  if (newAppNames.length > 0) {
                    params.set("appNames", newAppNames.join(","));
                  } else {
                    params.delete("appNames");
                  }
                  router.push(`?${params.toString()}`);
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => {
                  const newTags = filters.tags.filter((t) => t !== tag);
                  const params = new URLSearchParams(searchParams.toString());
                  if (newTags.length > 0) {
                    params.set("tags", newTags.join(","));
                  } else {
                    params.delete("tags");
                  }
                  router.push(`?${params.toString()}`);
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.authorRoles.map((role) => (
            <Badge key={role} variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {role}
              <button
                onClick={() => {
                  const newRoles = filters.authorRoles.filter(
                    (r) => r !== role
                  );
                  const params = new URLSearchParams(searchParams.toString());
                  if (newRoles.length > 0) {
                    params.set("authorRoles", newRoles.join(","));
                  } else {
                    params.delete("authorRoles");
                  }
                  router.push(`?${params.toString()}`);
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
