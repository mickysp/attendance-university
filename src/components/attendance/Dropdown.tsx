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
  searchable?: boolean;
  ariaLabel: string;
};

export default function AttendanceDropdown({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  allowEmpty = true,
  searchable = false,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) =>
    option.label
      .toLocaleLowerCase("th")
      .includes((query ?? "").trim().toLocaleLowerCase("th")),
  );

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
    <div
      ref={rootRef}
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {searchable ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            autoComplete="off"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open && !disabled}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder={placeholder}
            value={open && query !== null ? query : selected?.label || ""}
            onFocus={(event) => {
              setQuery(null);
              setOpen(true);
              event.currentTarget.select();
            }}
            onClick={() => {
              if (!open) {
                setQuery(null);
                setOpen(true);
              }
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (!open) {
                  setQuery(null);
                  setOpen(true);
                } else {
                  rootRef.current
                    ?.querySelector<HTMLButtonElement>('[role="option"]')
                    ?.focus();
                }
              }
              if (
                event.key === "Enter" &&
                open &&
                filteredOptions.length === 1
              ) {
                event.preventDefault();
                onChange(filteredOptions[0].value);
                setOpen(false);
              }
            }}
            className={`min-h-10 w-full rounded-md border border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-400 ${open ? "border-blue-300 ring-2 ring-blue-100" : ""}`}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open && !disabled}
            aria-controls={listId}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                inputRef.current?.focus();
                setQuery(null);
                setOpen(true);
              }
            }}
            className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center disabled:cursor-default"
          >
            <ChevronDownIcon
              className={`h-4 w-4 text-blue-500 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            setQuery("");
            setOpen((current) => !current);
          }}
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
      )}

      {open && !disabled && (
        <div className="absolute right-0 left-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <div id={listId} role="listbox" aria-label={ariaLabel}>
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
            {filteredOptions.length === 0 ? (
              <p role="status" className="px-4 py-3 text-sm text-gray-400">
                {query?.trim() ? "ไม่พบข้อมูลที่ตรงกับคำค้นหา" : "ไม่มีข้อมูล"}
              </p>
            ) : (
              filteredOptions.map((option) => (
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
