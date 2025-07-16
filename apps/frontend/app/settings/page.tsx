"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Edit2,
  Save,
  X,
  Upload,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Activity,
} from "lucide-react";
import { supabase } from "@/app/providers";
import { Session } from "@supabase/supabase-js";
import { setUser } from "@/store/profileSlice";
import { AppDispatch } from "@/store/store";
import { toast } from "sonner";
import { apiKeys } from "@/lib/api";
import {
  ApiKey,
  ApiKeyPermission,
  CreateApiKeyRequest,
  GeneratedApiKey,
  ApiKeyStats,
  ApiKeyPermissionInfo,
} from "@/components/types";

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  // API Key Management State
  const [userApiKeys, setUserApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStats | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<
    ApiKeyPermissionInfo[]
  >([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [createKeyDialog, setCreateKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<GeneratedApiKey | null>(
    null
  );
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const [createKeyForm, setCreateKeyForm] = useState({
    name: "",
    permissions: [ApiKeyPermission.READ] as ApiKeyPermission[],
    expiresAt: "",
  });
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [editKeyDialog, setEditKeyDialog] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          router.push("/signin");
          return;
        }

        setSession(session);

        // Update profile store with user data
        if (session?.user) {
          dispatch(setUser(session.user));
          // Initialize form state
          setDisplayName(
            session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              ""
          );
          // Load API keys
          loadApiKeys();
        }
      } catch (error) {
        console.error("Error in getSession:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        dispatch(setUser(session.user));
      } else {
        router.push("/signin");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, dispatch]);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out. Please try again.");
      } else {
        dispatch(setUser(null));
        toast.success("Signed out successfully!");
        router.push("/signin");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      setSignOutLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error("Avatar file must be less than 2MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${session?.user?.id}/${Date.now()}.${fileExt}`;

      // Remove old avatar if it exists
      const oldAvatarUrl = session?.user?.user_metadata?.avatar_url;
      if (oldAvatarUrl && oldAvatarUrl.includes("supabase")) {
        try {
          const urlParts = oldAvatarUrl.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          if (oldFileName) {
            await supabase.storage
              .from("avatars")
              .remove([`${session?.user?.id}/${oldFileName}`]);
          }
        } catch (error) {
          console.log("Could not remove old avatar:", error);
        }
      }

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Error uploading avatar:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user) return;

    // Validate display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Display name must be at least 2 characters long");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Display name must be less than 50 characters");
      return;
    }

    setUpdateLoading(true);
    try {
      let avatarUrl = session.user.user_metadata?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          toast.error("Failed to upload avatar");
          setUpdateLoading(false);
          return;
        }
      }

      // Update user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: trimmedName,
          full_name: trimmedName,
          avatar_url: avatarUrl,
        },
      });

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
        return;
      }

      // Update local state
      if (data.user) {
        dispatch(setUser(data.user));
        setSession((prev) => (prev ? { ...prev, user: data.user } : null));
      }

      // Reset form state
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // Reset form to original values
    setDisplayName(
      session?.user?.user_metadata?.name ||
        session?.user?.user_metadata?.full_name ||
        ""
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  // API Key Management Functions
  const loadApiKeys = async () => {
    try {
      setApiKeysLoading(true);
      const [keys, stats, permissions] = await Promise.all([
        apiKeys.getApiKeys(),
        apiKeys.getApiKeyStats(),
        apiKeys.getApiKeyPermissions(),
      ]);
      setUserApiKeys(keys);
      setApiKeyStats(stats);
      setAvailablePermissions(permissions.permissions);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      if (!createKeyForm.name.trim()) {
        toast.error("Please provide a name for the API key");
        return;
      }

      if (createKeyForm.permissions.length === 0) {
        toast.error("Please select at least one permission");
        return;
      }

      const request: CreateApiKeyRequest = {
        name: createKeyForm.name.trim(),
        permissions: createKeyForm.permissions,
        expiresAt: createKeyForm.expiresAt
          ? new Date(createKeyForm.expiresAt)
          : undefined,
      };

      const newKey = await apiKeys.createApiKey(request);
      setGeneratedKey(newKey);
      setShowGeneratedKey(true);
      setCreateKeyDialog(false);
      setCreateKeyForm({
        name: "",
        permissions: [ApiKeyPermission.READ],
        expiresAt: "",
      });
      toast.success("API key created successfully!");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error creating API key:", error);
      toast.error(error.response?.data?.error || "Failed to create API key");
    }
  };

  const handleUpdateApiKey = async (keyId: number, updates: any) => {
    try {
      await apiKeys.updateApiKey(keyId, updates);
      toast.success("API key updated successfully!");
      await loadApiKeys();
      setEditingKey(null);
      setEditKeyDialog(false);
    } catch (error: any) {
      console.error("Error updating API key:", error);
      toast.error(error.response?.data?.error || "Failed to update API key");
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    try {
      await apiKeys.deleteApiKey(keyId);
      toast.success("API key deleted successfully!");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      toast.error(error.response?.data?.error || "Failed to delete API key");
    }
  };

  const handlePermissionChange = (
    permission: ApiKeyPermission,
    checked: boolean
  ) => {
    setCreateKeyForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter((p) => p !== permission),
    }));
  };

  const formatApiKeyDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPermissionBadgeColor = (permission: ApiKeyPermission) => {
    switch (permission) {
      case ApiKeyPermission.READ:
        return "bg-blue-100 text-blue-800";
      case ApiKeyPermission.WRITE:
        return "bg-green-100 text-green-800";
      case ApiKeyPermission.ADMIN:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    return null;
  }

  const user = session.user;

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
          {/* Profile Overview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your account information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                // View Mode
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.name || user.email || "User"}
                    />
                    <AvatarFallback className="bg-zinc-700 text-white text-lg">
                      {user.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {user.user_metadata?.name ||
                          user.user_metadata?.full_name ||
                          "User"}
                      </h3>
                      <Badge
                        variant={
                          user.email_confirmed_at ? "default" : "destructive"
                        }
                      >
                        {user.email_confirmed_at ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {user.email_confirmed_at ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <p className="text-zinc-400 mb-4">{user.email}</p>
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      disabled={signOutLoading}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {signOutLoading ? "Signing out..." : "Sign Out"}
                    </Button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={avatarPreview || user.user_metadata?.avatar_url}
                          alt={displayName || user.email || "User"}
                        />
                        <AvatarFallback className="bg-zinc-700 text-white text-lg">
                          {user.email ? getInitials(user.email) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer"
                          title="Upload new avatar"
                        >
                          <div className="bg-blue-600 hover:bg-blue-700 p-1 rounded-full transition-colors">
                            <Upload className="h-3 w-3 text-white" />
                          </div>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {avatarFile && (
                        <p className="text-xs text-zinc-400 mt-2 text-center">
                          Selected: {avatarFile.name}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="display-name"
                            className="text-zinc-300"
                          >
                            Display Name
                          </Label>
                          <Input
                            id="display-name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                            maxLength={50}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-zinc-500">
                              2-50 characters
                            </p>
                            <p className="text-xs text-zinc-500">
                              {displayName.length}/50
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-zinc-300">Email</Label>
                          <p className="text-zinc-400 text-sm mt-1">
                            {user.email} (cannot be changed)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateLoading}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateLoading}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your account information and authentication details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm  px-2 py-1 rounded text-zinc-300 font-mono">
                        {user.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.id, "User ID")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white">{user.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(user.email || "", "Email")
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {user.phone && (
                    <div>
                      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </label>
                      <p className="text-white mt-1">{user.phone}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Email Verified
                    </label>
                    <p
                      className={`mt-1 ${
                        user.email_confirmed_at
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {user.email_confirmed_at ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </label>
                    <p className="text-white mt-1">
                      {user.created_at ? formatDate(user.created_at) : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last Sign In
                    </label>
                    <p className="text-white mt-1">
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Management */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Generate and manage API keys for MCP server authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* API Key Stats */}
                {apiKeyStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-sm font-medium text-zinc-300">
                        Total Keys
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {apiKeyStats.totalKeys}
                      </div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-sm font-medium text-zinc-300">
                        Active Keys
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {apiKeyStats.activeKeys}
                      </div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-sm font-medium text-zinc-300">
                        Expired Keys
                      </div>
                      <div className="text-2xl font-bold text-red-400">
                        {apiKeyStats.expiredKeys}
                      </div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-sm font-medium text-zinc-300">
                        Total Usage
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {apiKeyStats.totalUsage}
                      </div>
                    </div>
                  </div>
                )}

                {/* Create New API Key Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Your API Keys
                    </h3>
                    <p className="text-sm text-zinc-400">
                      API keys allow you to authenticate with the MCP server
                    </p>
                  </div>
                  <Dialog
                    open={createKeyDialog}
                    onOpenChange={setCreateKeyDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Create New API Key
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Create a new API key for MCP server authentication
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="key-name" className="text-zinc-300">
                            Name
                          </Label>
                          <Input
                            id="key-name"
                            placeholder="e.g., MCP Production Key"
                            value={createKeyForm.name}
                            onChange={(e) =>
                              setCreateKeyForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>

                        <div>
                          <Label className="text-zinc-300">Permissions</Label>
                          <div className="space-y-2 mt-2">
                            {availablePermissions.map((permission) => (
                              <div
                                key={permission.value}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={permission.value}
                                  checked={createKeyForm.permissions.includes(
                                    permission.value
                                  )}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(
                                      permission.value,
                                      checked as boolean
                                    )
                                  }
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={permission.value}
                                    className="text-zinc-300 font-medium"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-sm text-zinc-400">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="expires-at" className="text-zinc-300">
                            Expiration Date (Optional)
                          </Label>
                          <Input
                            id="expires-at"
                            type="datetime-local"
                            value={createKeyForm.expiresAt}
                            onChange={(e) =>
                              setCreateKeyForm((prev) => ({
                                ...prev,
                                expiresAt: e.target.value,
                              }))
                            }
                            className="bg-zinc-800 border-zinc-700 text-white"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCreateKeyDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateApiKey}>
                            Create API Key
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* API Keys List */}
                <div className="space-y-3">
                  {apiKeysLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-zinc-400">Loading API keys...</p>
                    </div>
                  ) : userApiKeys.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">No API keys found</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Create your first API key to get started
                      </p>
                    </div>
                  ) : (
                    userApiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-white font-medium">
                              {key.name}
                            </h4>
                            <div className="flex gap-1">
                              {key.permissions.map((permission) => (
                                <Badge
                                  key={permission}
                                  className={`text-xs ${getPermissionBadgeColor(
                                    permission
                                  )}`}
                                >
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                            {key.isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            {!key.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-zinc-400 space-y-1">
                            <p>Key: {key.keyPrefix}...</p>
                            <p>Created: {formatApiKeyDate(key.createdAt)}</p>
                            {key.expiresAt && (
                              <p>Expires: {formatApiKeyDate(key.expiresAt)}</p>
                            )}
                            <p>Usage: {key.usageCount} requests</p>
                            {key.lastUsedAt && (
                              <p>
                                Last used: {formatApiKeyDate(key.lastUsedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingKey(key);
                              setEditKeyDialog(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  Delete API Key
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                  Are you sure you want to delete "{key.name}"?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApiKey(key.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated API Key Display */}
          {generatedKey && (
            <Dialog open={showGeneratedKey} onOpenChange={setShowGeneratedKey}>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    API Key Created
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Your API key has been created successfully. Make sure to
                    copy it now as you won't be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-300">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        readOnly
                        value={generatedKey.key}
                        className="bg-zinc-800 border-zinc-700 text-white font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey.key);
                          toast.success("API key copied to clipboard!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      <strong>Important:</strong> This is the only time you'll
                      see this API key. Make sure to copy and store it securely.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setShowGeneratedKey(false);
                        setGeneratedKey(null);
                      }}
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Application Information */}
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
                    Authentication Provider
                  </label>
                  <p className="text-white mt-1">Supabase</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
