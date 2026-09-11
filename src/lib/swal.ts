import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";

export type ConfirmVariant =
  | "delete"
  | "warning"
  | "info"
  | "edit"
  | "withdraw";

const baseSwalOptions: SweetAlertOptions = {
  target: "body",
  position: "center",
  backdrop: true,
  allowOutsideClick: () => {
    const popup = Swal.getPopup();

    if (popup) {
      popup.classList.remove("app-swal-bounce");
      // Restart the animation even when the backdrop is clicked repeatedly.
      void popup.offsetWidth;
      popup.classList.add("app-swal-bounce");
    }

    return false;
  },
  willClose: (popup) => {
    popup.classList.remove("app-swal-bounce");
  },
  allowEscapeKey: false,
  showCloseButton: true,
  buttonsStyling: false,
  focusConfirm: false,
};

const getDefaultDescription = (variant: ConfirmVariant) => {
  switch (variant) {
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

const getIconColor = (variant: ConfirmVariant) => {
  switch (variant) {
    case "delete":
      return "#ef4444";

    case "warning":
      return "#eab308";

    case "edit":
      return "#6366f1";

    case "withdraw":
      return "#f97316";

    default:
      return "#3b82f6";
  }
};

const getIconHtml = (variant: ConfirmVariant) => {
  const color = getIconColor(variant);

  const paths = {
    delete: `
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="${color}"
        class="swal-icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21
          c.342.052.682.107 1.022.166m-1.022-.165L18.16
          19.673a2.25 2.25 0 0 1-2.244 2.077H8.084
          a2.25 2.25 0 0 1-2.244-2.077L4.772
          5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397
          m-12.58 0c-.34.059-.68.114-1.022.165m14.456
          0L18.16 19.673a2.25 2.25 0 0 1-2.244
          2.077H8.084a2.25 2.25 0 0 1-2.244
          2.077L4.772 5.79m14.456 0a48.11
          48.11 0 0 0-3.478-.397m-12.58
          0c-.34.059-.68.114-1.022.165m1.022
         -.165a48.11 48.11 0 0 1 3.478-.397
          m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201
          a51.964 51.964 0 0 0-3.32 0C7.91
          2.248 7 3.232 7 4.412v.916m7.5
          0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    `,

    warning: `
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="${color}"
        class="swal-icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 9v3.75m9.303 3.376L13.875
          4.5a2.25 2.25 0 0 0-3.75 0l-7.428
          11.626A2.25 2.25 0 0 0 4.607
          19.5h14.786a2.25 2.25 0 0 0
          1.91-3.374ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    `,

    edit: `
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="${color}"
        class="swal-icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="m16.862 4.487 1.687-1.688
          a1.875 1.875 0 1 1 2.652 2.652L10.582
          16.07a4.5 4.5 0 0 1-1.897 1.13L6
          18l.8-2.685a4.5 4.5 0 0 1
          1.13-1.897L16.862 4.487Zm0 0L19.5
          7.125" />
      </svg>
    `,

    withdraw: `
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="${color}"
        class="swal-icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 15 6 12m0 0 3-3m-3
          3h12a3 3 0 0 0 3-3V6" />
      </svg>
    `,

    info: `
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="${color}"
        class="swal-icon-svg">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21
          12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    `,
  };

  return paths[variant];
};

export const appSwal = {
  nameForm({ title, initialValue = "", onSave }: {
    title: string;
    initialValue?: string;
    onSave: (name: string) => Promise<void>;
  }) {
    return Swal.fire({
      ...baseSwalOptions,
      titleText: title,
      text: "กรอกชื่อ-นามสกุลอาจารย์ให้ครบถ้วนก่อนบันทึก",
      iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-5 9 5-9 5-9-5Zm3 2v6c3 3 9 3 12 0v-6M21 9v7" /></svg>',
      input: "text",
      inputLabel: "ชื่อ-นามสกุลอาจารย์",
      inputPlaceholder: "กรอกชื่อ-นามสกุลอาจารย์",
      inputValue: initialValue,
      inputAttributes: { autocomplete: "name" },
      showCloseButton: false,
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
      confirmButtonText: "บันทึก",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      inputValidator: (value) => !value.trim() ? "กรุณากรอกชื่อ-นามสกุลอาจารย์" : undefined,
      preConfirm: async (value: string) => {
        try {
          await onSave(value.trim());
          return true;
        } catch (error) {
          // Use textContent because API error messages must not become HTML.
          Swal.showValidationMessage("บันทึกไม่สำเร็จ");
          const message = Swal.getValidationMessage();
          if (message) message.textContent = error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง";
          return false;
        }
      },
      customClass: {
        popup: "app-swal-popup app-swal-form",
        title: "app-swal-title",
        htmlContainer: "app-swal-form-description",
        icon: "app-swal-form-icon",
        input: "app-swal-input",
        inputLabel: "app-swal-input-label",
        confirmButton: "app-swal-confirm-btn app-swal-confirm-info",
        cancelButton: "app-swal-cancel-btn",
      },
    });
  },
  confirm({
    title,
    text,
    html,
    variant = "info",
    description,
  }: {
    title: string;
    text?: string;
    html?: string;
    variant?: ConfirmVariant;
    description?: string;
  }) {
    return Swal.fire({
      ...baseSwalOptions,

      titleText: title,

      text: text ?? description ?? getDefaultDescription(variant),

      html,

      showCancelButton: true,

      cancelButtonText: "ยกเลิก",

      confirmButtonText: "ยืนยัน",

      reverseButtons: true,

      iconHtml: getIconHtml(variant),

      customClass: {
        popup: `app-swal-popup app-swal-popup-${variant}`,
        title: "app-swal-title",
        htmlContainer: "app-swal-text",
        confirmButton: `app-swal-confirm-btn app-swal-confirm-${variant}`,
        cancelButton: "app-swal-cancel-btn",
        closeButton: "app-swal-close-btn",
        icon: "app-swal-icon",
      },
    });
  },

  success({
    title,
    text,
    html,
  }: {
    title: string;
    text?: string;
    html?: string;
  }) {
    return Swal.fire({
      ...baseSwalOptions,

      showCloseButton: false,

      icon: "success",

      title,

      text,

      html,

      confirmButtonText: "ตกลง",

      customClass: {
        popup: "app-swal-popup app-swal-popup-success",
        title: "app-swal-title-success",
        htmlContainer: "app-swal-text",
        confirmButton: "app-swal-ok-btn",
        icon: "app-swal-success-icon",
      },
    });
  },

  error(text?: string) {
    return Swal.fire({
      ...baseSwalOptions,

      showCloseButton: false,

      icon: "error",

      title: "เกิดข้อผิดพลาด",

      html: text,

      confirmButtonText: "ตกลง",

      customClass: {
        popup: "app-swal-popup app-swal-popup-error",
        title: "app-swal-title",
        htmlContainer: "app-swal-text",
        confirmButton: "app-swal-ok-btn",
        icon: "app-swal-error-icon",
      },
    });
  },

  warning({
    title,
    text,
    html,
    variant = "warning",
    showCancelButton = false,
    confirmButtonText = "ตกลง",
    cancelButtonText = "ยกเลิก",
  }: {
    title: string;
    text?: string;
    html?: string;
    variant?: ConfirmVariant;
    showCancelButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
  }) {
    return Swal.fire({
      ...baseSwalOptions,

      title,

      text,

      html,

      iconHtml: getIconHtml(variant),

      showCancelButton,

      confirmButtonText,

      cancelButtonText,

      reverseButtons: true,

      customClass: {
        popup: `app-swal-popup app-swal-popup-${variant}`,
        title: "app-swal-title",
        htmlContainer: "app-swal-text",
        confirmButton: showCancelButton
          ? `app-swal-confirm-btn app-swal-confirm-${variant}`
          : "app-swal-ok-btn",
        cancelButton: "app-swal-cancel-btn",
        icon: "app-swal-icon",
        closeButton: "app-swal-close-btn",
      },
    });
  },
};
