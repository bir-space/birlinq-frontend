"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * "Are you sure?" sheet — bottom sheet on phones, centred dialog from `sm`
 * up, after the pattern of `public/AbuseModal`. The parent renders it only
 * while open and owns the confirm call; `loading` keeps both buttons busy
 * and `error` shows the failure inline instead of closing.
 *
 * Every label is a prop: the caller has the namespace, this component has
 * none.
 */
export function ConfirmModal({
  title,
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading = false,
  danger = false,
  error = null,
  children,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  error?: string | null;
  /** Extra content between the text and the buttons. */
  children?: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, loading]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="rounded-(--radius-panel) p-6">
          <h2 className="text-[17px] font-bold">{title}</h2>
          {text && <p className="mt-1.5 text-[13px] text-muted">{text}</p>}
          {children && <div className="mt-4">{children}</div>}
          {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant={danger ? "danger" : "accent"}
              className="w-full"
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            {/* Focus lands on the safe choice when the sheet opens. */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading}
              onClick={onClose}
              autoFocus
            >
              {cancelLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
