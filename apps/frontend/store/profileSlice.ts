import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@supabase/supabase-js";

interface ProfileState {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  totalMemories: number;
  totalApps: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  apps: any[];
  isAuthenticated: boolean;
}

const initialState: ProfileState = {
  userId: "",
  email: null,
  name: null,
  avatarUrl: null,
  phoneNumber: null,
  emailVerified: false,
  createdAt: null,
  lastSignInAt: null,
  totalMemories: 0,
  totalApps: 0,
  status: "idle",
  error: null,
  apps: [],
  isAuthenticated: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      const user = action.payload;
      if (user) {
        state.userId = user.id;
        state.email = user.email || null;
        state.name =
          user.user_metadata?.name || user.user_metadata?.full_name || null;
        state.avatarUrl = user.user_metadata?.avatar_url || null;
        state.phoneNumber = user.phone || null;
        state.emailVerified = user.email_confirmed_at !== null;
        state.createdAt = user.created_at || null;
        state.lastSignInAt = user.last_sign_in_at || null;
        state.isAuthenticated = true;
      } else {
        // Reset to initial state when user is null
        state.userId = "";
        state.email = null;
        state.name = null;
        state.avatarUrl = null;
        state.phoneNumber = null;
        state.emailVerified = false;
        state.createdAt = null;
        state.lastSignInAt = null;
        state.isAuthenticated = false;
      }
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setProfileLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setProfileError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    resetProfileState: (state) => {
      state.status = "idle";
      state.error = null;
      state.userId = "";
      state.email = null;
      state.name = null;
      state.avatarUrl = null;
      state.phoneNumber = null;
      state.emailVerified = false;
      state.createdAt = null;
      state.lastSignInAt = null;
      state.isAuthenticated = false;
    },
    setTotalMemories: (state, action: PayloadAction<number>) => {
      state.totalMemories = action.payload;
    },
    setTotalApps: (state, action: PayloadAction<number>) => {
      state.totalApps = action.payload;
    },
    setApps: (state, action: PayloadAction<any[]>) => {
      state.apps = action.payload;
    },
  },
});

export const {
  setUser,
  setUserId,
  setProfileLoading,
  setProfileError,
  resetProfileState,
  setTotalMemories,
  setTotalApps,
  setApps,
} = profileSlice.actions;

export default profileSlice.reducer;
