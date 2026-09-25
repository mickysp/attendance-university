"use client";
import { useLanguage } from "@/lib/language";


import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  src: string;
  onClose: () => void;
};

export default function ProfileImageDialog({ src, onClose }: Props) {
  const { tr } = useLanguage();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="profile-image-title"
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}

      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const dialog = event.currentTarget;
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        )
          return;
        dialog.classList.remove("app-dialog-attention");
        void dialog.offsetWidth;
        dialog.classList.add("app-dialog-attention");
      }}

      onAnimationEnd={(event) => {
        if (event.animationName === "app-dialog-attention")
          event.currentTarget.classList.remove("app-dialog-attention");
      }}
      className="app-dialog-panel fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-5 font-noto shadow-sm backdrop:bg-black/40 sm:w-[calc(100%-3rem)] sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <UserCircleIcon
              className="h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
          </div>

          <h2
            id="profile-image-title"
            className="text-lg font-semibold text-gray-800"
          >{tr("รูปโปรไฟล์")}</h2>
        </div>

        <button
          type="button"
          autoFocus
          aria-label={tr("ปิดรูปโปรไฟล์")}
          onClick={() => dialogRef.current?.close()}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex h-[min(65dvh,640px)] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50">
        {failed ? (
          <p role="alert" className="px-4 text-center text-sm text-gray-500">{tr("ไม่สามารถโหลดรูปโปรไฟล์ได้ กรุณาปิดแล้วลองอีกครั้ง")}</p>
        ) : (
          <Image
            unoptimized
            loading="eager"
            fill
            src={src}
            alt={tr("รูปโปรไฟล์ขนาดเต็ม")}
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </dialog>
  );
}
