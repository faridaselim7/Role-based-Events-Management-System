// src/components/ui/simple-dialog.jsx
import React from "react";
import { cn } from "./utils";

// Very simple controlled dialog: no internal state, no refs, no animations.
export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  const handleOverlayClick = () => {
    onOpenChange?.(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleOverlayClick}
      />
      {/* Content container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = "", children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-lg p-6 border border-[#E2E8F0]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return (
    <div
      className={cn("mb-4 flex flex-col gap-2 text-left", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className = "", ...props }) {
  return (
    <h2
      className={cn("text-xl font-semibold leading-tight", className)}
      {...props}
    />
  );
}
