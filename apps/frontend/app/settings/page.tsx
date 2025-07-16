"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function SettingsPage() {
  const userId = useSelector((state: RootState) => state.profile.userId);

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400 mt-2">
            Manage your Memos preferences and account settings
          </p>
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-zinc-400">
                Your current account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    User ID
                  </label>
                  <p className="text-white mt-1">{userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Status
                  </label>
                  <p className="text-green-400 mt-1">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">About Memos</CardTitle>
              <CardDescription className="text-zinc-400">
                Information about this Memos instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Version
                  </label>
                  <p className="text-white mt-1">1.0.0</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Backend API
                  </label>
                  <p className="text-white mt-1">
                    {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
