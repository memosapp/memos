import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { openUpdateMemoDialog, closeUpdateMemoDialog } from "@/store/uiSlice";

export const useUI = () => {
  const dispatch = useDispatch<AppDispatch>();
  const updateMemoDialog = useSelector(
    (state: RootState) => state.ui.dialogs.updateMemo
  );

  const handleOpenUpdateMemoDialog = (memoId: string, memoContent: string) => {
    dispatch(openUpdateMemoDialog({ memoId, memoContent }));
  };

  const handleCloseUpdateMemoDialog = () => {
    dispatch(closeUpdateMemoDialog());
  };

  return {
    updateMemoDialog,
    handleOpenUpdateMemoDialog,
    handleCloseUpdateMemoDialog,
  };
};
