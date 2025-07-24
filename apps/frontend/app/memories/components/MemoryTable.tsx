import {
  Edit,
  MoreHorizontal,
  Trash2,
  Pause,
  Archive,
  Play,
  Sparkles,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  selectMemo,
  deselectMemo,
  selectAllMemos,
  clearSelection,
} from "@/store/memoriesSlice";

import { HiMiniRectangleStack } from "react-icons/hi2";
import { PiSwatches } from "react-icons/pi";
import { GoPackage } from "react-icons/go";
import { CiCalendar } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Tags from "@/components/shared/tags";
import { useUI } from "@/hooks/useUI";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/helpers";
import { AttachedFiles } from "@/components/shared/attached-files";

export function MemoryTable() {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const selectedMemoIds = useSelector(
    (state: RootState) => state.memories.selectedMemoIds
  );
  const memos = useSelector((state: RootState) => state.memories.memos);

  const { deleteMemo, isLoading } = useMemoriesApi();

  const handleDeleteMemo = async (id: string) => {
    try {
      await deleteMemo(id);
      toast({
        title: "Success",
        description: "Memory deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete memory:", error);
      toast({
        title: "Error",
        description: "Failed to delete memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      dispatch(selectAllMemos());
    } else {
      dispatch(clearSelection());
    }
  };

  const handleSelectMemo = (id: number, checked: boolean) => {
    if (checked) {
      dispatch(selectMemo(id));
    } else {
      dispatch(deselectMemo(id));
    }
  };
  const { handleOpenUpdateMemoDialog } = useUI();

  const handleEditMemo = (memo_id: string, memo_content: string) => {
    handleOpenUpdateMemoDialog(memo_id, memo_content);
  };

  const handleUpdateMemoryState = async (id: string, newState: string) => {
    // Memory state updates are not supported in the current backend
    console.log("Memory state update not supported:", id, newState);
  };

  const isAllSelected =
    memos.length > 0 && selectedMemoIds.length === memos.length;
  const isPartiallySelected =
    selectedMemoIds.length > 0 && selectedMemoIds.length < memos.length;

  const handleMemoClick = (id: number) => {
    router.push(`/memory/${id}`);
  };

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50 backdrop-blur-sm">
      <Table className="">
        <TableHeader>
          <TableRow className="bg-zinc-800/50 hover:bg-zinc-800/50 border-b border-zinc-700">
            <TableHead className="w-[50px] pl-6">
              <Checkbox
                className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 border-zinc-500"
                checked={isAllSelected}
                data-state={
                  isPartiallySelected
                    ? "indeterminate"
                    : isAllSelected
                    ? "checked"
                    : "unchecked"
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="border-zinc-700">
              <div className="flex items-center min-w-[600px] text-zinc-300 font-medium">
                <HiMiniRectangleStack className="mr-2 h-4 w-4" />
                Memory
              </div>
            </TableHead>
            <TableHead className="border-zinc-700">
              <div className="flex items-center text-zinc-300 font-medium">
                <PiSwatches className="mr-2 h-4 w-4" />
                Tags
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center text-zinc-300 font-medium">
                <GoPackage className="mr-2 h-4 w-4" />
                Created By
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center w-full justify-center text-zinc-300 font-medium">
                <Sparkles className="mr-2 h-4 w-4" />
                App
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center w-full justify-center text-zinc-300 font-medium">
                <CiCalendar className="mr-2 h-4 w-4" />
                Created On
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center w-full justify-center text-zinc-300 font-medium">
                <Clock className="mr-2 h-4 w-4" />
                Last Updated
              </div>
            </TableHead>
            <TableHead className="w-[100px] border-zinc-700">
              <div className="flex items-center w-full justify-center text-zinc-300 font-medium">
                <Eye className="mr-2 h-4 w-4" />
                Views
              </div>
            </TableHead>
            <TableHead className="text-right border-zinc-700">
              <div className="flex items-center justify-center text-zinc-300 font-medium">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memos.map((memo) => (
            <TableRow
              key={memo.id}
              className={`hover:bg-zinc-800/40 border-b border-zinc-800/50 transition-colors duration-200 ${
                isLoading ? "animate-pulse opacity-50" : ""
              }`}
            >
              <TableCell className="pl-6">
                <Checkbox
                  className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 border-zinc-500"
                  checked={selectedMemoIds.includes(memo.id)}
                  onCheckedChange={(checked) =>
                    handleSelectMemo(memo.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="py-4">
                <div
                  onClick={() => handleMemoClick(memo.id)}
                  className="font-medium text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 line-clamp-2"
                >
                  {memo.summary}
                </div>
                {memo.attachedFiles && memo.attachedFiles.length > 0 && (
                  <div className="mt-2">
                    <AttachedFiles files={memo.attachedFiles} compact={true} />
                  </div>
                )}
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-wrap gap-1">
                  <Tags tags={memo.tags || []} isPaused={false} concat={true} />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="flex items-center justify-center">
                  <div className="px-2 py-1 rounded-full bg-zinc-800/50 text-xs text-zinc-400 capitalize border border-zinc-700">
                    {memo.authorRole || "user"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                {memo.appName ? (
                  <div className="flex items-center justify-center">
                    <div className="px-2 py-1 rounded-full bg-green-600/20 text-xs text-green-400 capitalize border border-green-600/30">
                      {memo.appName}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="px-2 py-1 rounded-full bg-zinc-800/50 text-xs text-zinc-500 border border-zinc-700">
                      Manual
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="text-xs text-zinc-400 font-mono">
                  {formatDate(
                    typeof memo.createdAt === "string"
                      ? new Date(memo.createdAt).getTime()
                      : memo.createdAt.getTime()
                  )}
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="text-xs text-zinc-400 font-mono">
                  {formatDate(
                    typeof memo.updatedAt === "string"
                      ? new Date(memo.updatedAt).getTime()
                      : memo.updatedAt.getTime()
                  )}
                </div>
              </TableCell>
              <TableCell className="w-[100px] text-center py-4">
                <div className="flex items-center justify-center">
                  <div className="px-2 py-1 rounded-full bg-blue-600/20 text-xs text-blue-400 border border-blue-600/30 min-w-[40px]">
                    {memo.accessCount || 0}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-zinc-800 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-900 border-zinc-800"
                    >
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-300"
                        onClick={() =>
                          handleEditMemo(memo.id.toString(), memo.content)
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-600/10 focus:bg-red-600/10 focus:text-red-300"
                        onClick={() => handleDeleteMemo(memo.id.toString())}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
