"use client";

import { Button } from "@/components/ui/button";
import { HiHome, HiMiniRectangleStack } from "react-icons/hi2";
import { RiApps2AddFill } from "react-icons/ri";
import { FiRefreshCcw } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreateMemoryDialog } from "@/app/memories/components/CreateMemoryDialog";
import { useMemoriesApi } from "@/hooks/useMemoriesApi";
import Image from "next/image";
import { Settings } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const memoriesApi = useMemoriesApi();

  // Define route matchers with typed parameter extraction
  const routeBasedFetchMapping: {
    match: RegExp;
    getFetchers: (params: Record<string, string>) => (() => Promise<any>)[];
  }[] = [
    {
      match: /^\/memory\/([^/]+)$/,
      getFetchers: ({ memory_id }) => [
        () => memoriesApi.fetchMemoById(memory_id),
      ],
    },
    {
      match: /^\/memories$/,
      getFetchers: () => [() => memoriesApi.fetchMemos({ limit: 10 })],
    },
    {
      match: /^\/$/,
      getFetchers: () => [() => memoriesApi.fetchMemos({ limit: 10 })],
    },
  ];

  const getFetchersForPath = (path: string) => {
    for (const route of routeBasedFetchMapping) {
      const match = path.match(route.match);
      if (match) {
        if (route.match.source.includes("memory")) {
          return route.getFetchers({ memory_id: match[1] });
        }
        return route.getFetchers({});
      }
    }
    return [];
  };

  const handleRefresh = async () => {
    const fetchers = getFetchersForPath(pathname);
    await Promise.allSettled(fetchers.map((fn) => fn()));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href.substring(0, 5));
  };

  const activeClass = "bg-zinc-800 text-white border-zinc-600";
  const inactiveClass = "text-zinc-300";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Memos" width={26} height={26} />
          <span className="text-xl font-medium">Memos</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/") ? activeClass : inactiveClass
              }`}
            >
              <HiHome />
              Dashboard
            </Button>
          </Link>
          <Link href="/memories">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/memories") ? activeClass : inactiveClass
              }`}
            >
              <HiMiniRectangleStack />
              Memories
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-none ${
                isActive("/settings") ? activeClass : inactiveClass
              }`}
            >
              <Settings />
              Settings
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 border-none text-zinc-300 hover:text-white"
          >
            <FiRefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <CreateMemoryDialog />
        </div>
      </div>
    </header>
  );
}
