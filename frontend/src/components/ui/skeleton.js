"use client";

import React from "react";
import { cn } from "./utils";

/**
 * Skeleton component — used as a loading placeholder.
 * 
 * Example usage:
 * <Skeleton className="h-6 w-32" />
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

export { Skeleton };
