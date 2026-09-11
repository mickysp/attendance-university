"use client";

import { createContext, useContext, type ReactNode } from "react";
import { appSwal, type ConfirmVariant } from "@/lib/swal";

type ConfirmContextType = {
  showConfirm: (
    message: string,
    onConfirm: () => void | Promise<void>,
    variant?: ConfirmVariant,
    description?: string,
  ) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const showConfirm: ConfirmContextType["showConfirm"] = async (
    message,
    onConfirm,
    variant = "info",
    description,
  ) => {
    try {
      const result = await appSwal.confirm({
        title: message,
        variant,
        description,
      });

      if (result.isConfirmed) {
        await onConfirm();
      }
    } catch (error) {
      console.error("Confirmation action failed:", error);
      await appSwal.error("ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return context;
};
