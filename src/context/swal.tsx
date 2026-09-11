"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import {
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import "@/styles/swal.css";

type ConfirmVariant = "delete" | "warning" | "info" | "edit" | "withdraw";

type ConfirmType = {
  message: string;
  onConfirm: () => void;
  variant: ConfirmVariant;
  description?: string;
};

type ConfirmContextType = {
  showConfirm: (
    message: string,
    onConfirm: () => void,
    variant?: ConfirmVariant,
    description?: string,
  ) => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);

  const [shake, setShake] = useState(false);

  const handleOutsideClick = () => {
    if (shake) return;

    setShake(true);

    setTimeout(() => {
      setShake(false);
    }, 180);
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    variant: ConfirmVariant = "info",
    description?: string,
  ) => {
    setConfirm({
      message,
      onConfirm,
      variant,
      description,
    });
  };

  const handleClose = () => {
    setConfirm(null);
  };

  const handleConfirm = () => {
    if (!confirm) return;

    confirm.onConfirm();
    handleClose();
  };

  useEffect(() => {
    if (!confirm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirm]);

  const getIcon = () => {
    switch (confirm?.variant) {
      case "delete":
        return <TrashIcon />;

      case "warning":
        return <ExclamationTriangleIcon />;

      case "edit":
        return <PencilSquareIcon />;

      case "withdraw":
        return <ArrowUturnLeftIcon />;

      default:
        return <DocumentCheckIcon />;
    }
  };

  const getDefaultDescription = () => {
    switch (confirm?.variant) {
      case "delete":
        return "การลบข้อมูลนี้ไม่สามารถกู้คืนได้";

      case "warning":
        return "การดำเนินการนี้อาจมีผลกระทบกับข้อมูล";

      case "edit":
        return "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่";

      case "withdraw":
        return "คุณต้องการถอนรายวิชานี้ใช่หรือไม่";

      default:
        return "คุณต้องการบันทึกข้อมูลใช่หรือไม่";
    }
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      {confirm && (
        <div className="confirm-overlay" onClick={handleOutsideClick}>
          <div
            className={`confirm-modal ${shake ? "confirm-modal-shake" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="confirm-close"
              aria-label="ปิด"
            >
              <XMarkIcon />
            </button>

            <div className={`confirm-icon confirm-icon-${confirm.variant}`}>
              {getIcon()}
            </div>

            <p className="confirm-message">{confirm.message}</p>

            <p className="confirm-description">
              {confirm.description || getDefaultDescription()}
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                onClick={handleClose}
                className="confirm-cancel"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className={`confirm-submit confirm-submit-${confirm.variant}`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return ctx;
};
