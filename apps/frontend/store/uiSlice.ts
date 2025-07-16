import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DialogState {
  updateMemo: {
    isOpen: boolean;
    memoId: string | null;
    memoContent: string | null;
  };
}

interface UIState {
  dialogs: DialogState;
}

const initialState: UIState = {
  dialogs: {
    updateMemo: {
      isOpen: false,
      memoId: null,
      memoContent: null,
    },
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openUpdateMemoDialog: (
      state,
      action: PayloadAction<{ memoId: string; memoContent: string }>
    ) => {
      state.dialogs.updateMemo.isOpen = true;
      state.dialogs.updateMemo.memoId = action.payload.memoId;
      state.dialogs.updateMemo.memoContent = action.payload.memoContent;
    },
    closeUpdateMemoDialog: (state) => {
      state.dialogs.updateMemo.isOpen = false;
      state.dialogs.updateMemo.memoId = null;
      state.dialogs.updateMemo.memoContent = null;
    },
  },
});

export const { openUpdateMemoDialog, closeUpdateMemoDialog } = uiSlice.actions;

export default uiSlice.reducer;
