"use client";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  type: "delete" | "contract";
  userName?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ type, userName, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0806]/80 p-4">
      <div className="vessel p-5 max-w-sm w-full">
        <p className="text-sm font-medium text-[#e8d5a3] mb-5">
          {type === "delete"
            ? "Delete this need? This cannot be undone."
            : `Form a contract with ${userName}?`}
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" variant="default" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
