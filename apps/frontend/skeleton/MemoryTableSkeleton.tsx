import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { HiMiniRectangleStack } from "react-icons/hi2";
import { PiSwatches } from "react-icons/pi";
import { GoPackage } from "react-icons/go";
import { CiCalendar } from "react-icons/ci";
import { Clock, Eye, Sparkles, MoreHorizontal } from "lucide-react";

export function MemoryTableSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50 hover:bg-zinc-800/50 border-b border-zinc-700">
            <TableHead className="w-[50px] pl-6">
              <Checkbox className="border-zinc-500" disabled />
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
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow
              key={index}
              className="hover:bg-zinc-800/40 border-b border-zinc-800/50 transition-colors duration-800 animate-pulse"
            >
              <TableCell className="pl-6">
                <Checkbox className="border-zinc-500" disabled />
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[400px] bg-zinc-800" />
                  <Skeleton className="h-3 w-[300px] bg-zinc-800/70" />
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-12 rounded-full bg-zinc-800" />
                  <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
                  <Skeleton className="h-5 w-10 rounded-full bg-zinc-800" />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="flex items-center justify-center">
                  <div className="px-2 py-1 rounded-full bg-zinc-800/50 border border-zinc-700">
                    <Skeleton className="h-3 w-8 bg-zinc-700" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="flex items-center justify-center">
                  {index % 3 === 0 ? (
                    <div className="px-2 py-1 rounded-full bg-green-600/20 border border-green-600/30">
                      <Skeleton className="h-3 w-12 bg-green-600/40" />
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-full bg-zinc-800/50 border border-zinc-700">
                      <Skeleton className="h-3 w-12 bg-zinc-700" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="text-xs text-zinc-400 font-mono">
                  <Skeleton className="h-3 w-16 bg-zinc-800 mx-auto" />
                </div>
              </TableCell>
              <TableCell className="w-[140px] text-center py-4">
                <div className="text-xs text-zinc-400 font-mono">
                  <Skeleton className="h-3 w-16 bg-zinc-800 mx-auto" />
                </div>
              </TableCell>
              <TableCell className="w-[100px] text-center py-4">
                <div className="flex items-center justify-center">
                  <div className="px-2 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 min-w-[40px]">
                    <Skeleton className="h-3 w-4 bg-blue-600/40 mx-auto" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex justify-center">
                  <div className="h-8 w-8 rounded bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
                    <Skeleton className="h-4 w-4 bg-zinc-700" />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
