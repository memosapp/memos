"use client";

import { useEffect, useState } from "react";
import { Filter, X, ChevronDown, SortAsc, SortDesc } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { RootState } from "@/store/store";
// import { useAppsApi } from "@/hooks/useAppsApi";
// import { useFiltersApi } from "@/hooks/useFiltersApi";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
// import {
//   setSelectedTags,
//   setSelectedApps,
//   setSort,
//   clearFilters,
// } from "@/store/filtersSlice";

const columns = [
  { id: "memory", label: "Memory", sortable: true },
  { id: "tags", label: "Tags", sortable: false },
  { id: "created_at", label: "Created At", sortable: true },
];

export default function FilterComponent() {
  const dispatch = useDispatch();
  const memoriesApi = useMemoriesApi();
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedApps, setTempSelectedApps] = useState<string[]>([]);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // TODO: Implement proper store slices for apps and filters
  const apps: any[] = [];
  const tags: any[] = [];
  const filters: any = { selectedTags: [], selectedApps: [] };

  useEffect(() => {
    setTempSelectedApps(filters.selectedApps);
    setTempSelectedTags(filters.selectedTags);
  }, [filters]);

  const handleClearFilters = async () => {
    setTempSelectedApps([]);
    setTempSelectedTags([]);
    setShowArchived(false);
    // TODO: Implement fetchMemories when available
    // await memoriesApi.fetchMemories();
  };

  const toggleTagFilter = (tag: string) => {
    setTempSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((c) => c !== tag) : [...prev, tag]
    );
  };

  const toggleAppFilter = (app: string) => {
    setTempSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  };

  const toggleAllApps = (checked: boolean) => {
    setTempSelectedApps(checked ? apps.map((app) => app.id) : []);
  };

  const toggleAllTags = (checked: boolean) => {
    setTempSelectedTags(checked ? tags.map((tag) => tag.name) : []);
  };

  const handleClearSelection = () => {
    setTempSelectedApps([]);
    setTempSelectedTags([]);
  };

  const handleApplyFilters = async () => {
    try {
      // Get tag IDs for selected tag names
      const selectedTagIds = tags
        .filter((tag) => tempSelectedTags.includes(tag.name))
        .map((tag) => tag.id);

      const selectedAppIds = apps
        .filter((app) => tempSelectedApps.includes(app.id))
        .map((app) => app.id);

      // Update the global state with temporary selections
      // dispatch(setSelectedApps(tempSelectedApps));
      // dispatch(setSelectedTags(tempSelectedTags));
      // dispatch({ type: "filters/setShowArchived", payload: showArchived });

      // await fetchMemories(undefined, 1, 10, {
      //   apps: selectedAppIds,
      //   tags: selectedTagIds,
      //   sortColumn: filters.sortColumn,
      //   sortDirection: filters.sortDirection,
      //   showArchived: showArchived,
      // });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
  };

  const handleFilterReset = () => {
    setTempSelectedApps(filters.selectedApps);
    setTempSelectedTags(filters.selectedTags);
    setIsOpen(false);
  };

  const setSorting = async (column: string) => {
    // const newDirection =
    //   filters.sortColumn === column && filters.sortDirection === "asc"
    //     ? "desc"
    //     : "asc";
    // updateSort(column, newDirection);

    // Get tag IDs for selected tag names
    const selectedTagIds = tags
      .filter((tag) => tempSelectedTags.includes(tag.name))
      .map((tag) => tag.id);

    const selectedAppIds = apps
      .filter((app) => tempSelectedApps.includes(app.id))
      .map((app) => app.id);

    try {
      // await fetchMemories(undefined, 1, 10, {
      //   apps: selectedAppIds,
      //   tags: selectedTagIds,
      //   sortColumn: column,
      //   sortDirection: newDirection,
      // });
    } catch (error) {
      console.error("Failed to apply sorting:", error);
    }
  };

  const activeFiltersCount =
    filters.selectedTags.length +
    filters.selectedApps.length +
    (showArchived ? 1 : 0);

  const pendingFiltersCount =
    tempSelectedTags.length + tempSelectedApps.length + (showArchived ? 1 : 0);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Filter and Sort Memories</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="tags" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tags" className="flex items-center gap-2">
                  Tags
                  {tempSelectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {tempSelectedTags.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="apps" className="flex items-center gap-2">
                  Apps
                  {tempSelectedApps.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {tempSelectedApps.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sort" className="flex items-center gap-2">
                  Sort
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tags" className="mt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="select-all-tags"
                    checked={
                      tags.length > 0 && tempSelectedTags.length === tags.length
                    }
                    onCheckedChange={(checked) =>
                      toggleAllTags(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="select-all-tags"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {tags.map((tag) => (
                    <div key={tag.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.name}`}
                        checked={tempSelectedTags.includes(tag.name)}
                        onCheckedChange={() => toggleTagFilter(tag.name)}
                      />
                      <Label
                        htmlFor={`tag-${tag.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="apps" className="mt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="select-all-apps"
                    checked={
                      apps.length > 0 && tempSelectedApps.length === apps.length
                    }
                    onCheckedChange={(checked) =>
                      toggleAllApps(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="select-all-apps"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {apps.map((app) => (
                    <div key={app.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${app.id}`}
                        checked={tempSelectedApps.includes(app.id)}
                        onCheckedChange={() => toggleAppFilter(app.id)}
                      />
                      <Label
                        htmlFor={`app-${app.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {app.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="sort" className="mt-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Sort by:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {columns.map((column) => (
                      <Button
                        key={column.id}
                        variant="ghost"
                        className="justify-start h-10"
                        onClick={() => setSorting(column.id)}
                        disabled={!column.sortable}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {/* {filters.sortColumn === column.id && (
                            <>
                              {filters.sortDirection === "asc" ? (
                                <SortAsc className="h-4 w-4" />
                              ) : (
                                <SortDesc className="h-4 w-4" />
                              )}
                            </>
                          )} */}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  disabled={pendingFiltersCount === 0}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Clear All Filters
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleFilterReset}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
