"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  ariaLabel: string;
};

export default function AttendanceDropdown({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  allowEmpty = true,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function closeDropdown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-400 ${open ? "border-blue-300 ring-2 ring-blue-100" : ""}`}
      >
        <span
          className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-blue-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && !disabled && (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 left-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {allowEmpty && (
            <DropdownOption
              label={placeholder}
              selected={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            />
          )}
          {options.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">ไม่มีข้อมูล</p>
          ) : (
            options.map((option) => (
              <DropdownOption
                key={option.value}
                label={option.label}
                selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`block w-full cursor-pointer px-4 py-2.5 text-left text-sm transition ${selected ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
    >
      <span className="block truncate">{label}</span>
    </button>
  );
}
