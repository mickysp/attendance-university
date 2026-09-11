"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

type AlertType = "success" | "error" | "warning" | "info";

interface Alert {
  message: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

const iconMap = {
  success: <CheckCircleIcon className="h-5 w-5" />,
  error: <XCircleIcon className="h-5 w-5" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5" />,
  info: <InformationCircleIcon className="h-5 w-5" />,
};

export const useAlert = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  return context;
};

export const AlertProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (
    message: string,
    type: AlertType = "info",
  ) => {
    setAlert({ message, type });
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
    }, 2500);

    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div
          className="
            pointer-events-none
            fixed
            top-5
            right-5
            z-50
            font-noto
          "
        >
          <div
            className={`
              pointer-events-auto
              relative
              flex
              min-w-[220px]
              items-center
              gap-2
              rounded
              px-4
              py-3
              text-sm
              text-white
              shadow
              transition-all
              duration-300
              ease-in-out

              ${
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }

              ${alert.type === "success" && "bg-green-500"}
              ${alert.type === "error" && "bg-red-500"}
              ${alert.type === "warning" && "bg-yellow-500"}
              ${alert.type === "info" && "bg-blue-500"}
            `}
          >
            <span className="flex-shrink-0">
              {iconMap[alert.type]}
            </span>

            <span>{alert.message}</span>

            <div
              className="
                absolute
                bottom-0
                left-0
                h-[3px]
                bg-white/70
                animate-progress
              "
            />
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};