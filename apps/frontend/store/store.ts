import { configureStore } from "@reduxjs/toolkit";
import memoriesReducer from "./memoriesSlice";
import profileReducer from "./profileSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    memories: memoriesReducer,
    profile: profileReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
