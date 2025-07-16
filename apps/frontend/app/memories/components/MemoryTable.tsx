import {
  Edit,
  MoreHorizontal,
  Trash2,
  Pause,
  Archive,
  Play,
  Sparkles,
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
    await deleteMemo(id);
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
    <div className="rounded-md border">
      <Table className="">
        <TableHeader>
          <TableRow className="bg-zinc-800 hover:bg-zinc-800">
            <TableHead className="w-[50px] pl-4">
              <Checkbox
                className="data-[state=checked]:border-primary border-zinc-500/50"
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
              <div className="flex items-center min-w-[600px]">
                <HiMiniRectangleStack className="mr-1" />
                Memory
              </div>
            </TableHead>
            <TableHead className="border-zinc-700">
              <div className="flex items-center">
                <PiSwatches className="mr-1" size={15} />
                Tags
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center">
                <GoPackage className="mr-1" />
                Created By
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center w-full justify-center">
                <Sparkles className="mr-1" size={16} />
                App
              </div>
            </TableHead>
            <TableHead className="w-[140px] border-zinc-700">
              <div className="flex items-center w-full justify-center">
                <CiCalendar className="mr-1" size={16} />
                Created On
              </div>
            </TableHead>
            <TableHead className="text-right border-zinc-700 flex justify-center">
              <div className="flex items-center justify-end">
                <MoreHorizontal className="h-4 w-4 mr-2" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memos.map((memo) => (
            <TableRow
              key={memo.id}
              className={`hover:bg-zinc-900/50 ${
                isLoading ? "animate-pulse opacity-50" : ""
              }`}
            >
              <TableCell className="pl-4">
                <Checkbox
                  className="data-[state=checked]:border-primary border-zinc-500/50"
                  checked={selectedMemoIds.includes(memo.id)}
                  onCheckedChange={(checked) =>
                    handleSelectMemo(memo.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="">
                <div
                  onClick={() => handleMemoClick(memo.id)}
                  className={`font-medium text-white cursor-pointer`}
                >
                  {memo.summary}
                </div>
              </TableCell>
              <TableCell className="">
                <div className="flex flex-wrap gap-1">
                  <Tags tags={memo.tags || []} isPaused={false} concat={true} />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center">
                <div className="text-xs text-zinc-500 capitalize">
                  {memo.authorRole || "user"}
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center">
                {memo.appName ? (
                  <div className="text-xs text-green-600 capitalize">
                    {memo.appName}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">Manual</div>
                )}
              </TableCell>
              <TableCell className="w-[140px] text-center">
                {formatDate(
                  typeof memo.createdAt === "string"
                    ? new Date(memo.createdAt).getTime()
                    : memo.createdAt.getTime()
                )}
              </TableCell>
              <TableCell className="text-right flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-zinc-900 border-zinc-800"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        handleEditMemo(memo.id.toString(), memo.content)
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:text-red-500"
                      onClick={() => handleDeleteMemo(memo.id.toString())}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
