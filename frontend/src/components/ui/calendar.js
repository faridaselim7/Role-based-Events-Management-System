"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6 bg-white rounded-xl border border-[#E5E9D5] shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "flex flex-col gap-4 w-full",
        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
        caption_label: "text-lg font-semibold text-[#816251]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 bg-transparent p-0 hover:bg-[#F0F2FF] border border-[#E5E9D5] rounded-lg"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex justify-between mb-2",
        head_cell: "text-[#816251] font-medium text-sm w-10 h-10 flex items-center justify-center",
        row: "flex w-full justify-between mb-1",
        cell: cn(
          "relative text-center text-sm focus-within:relative focus-within:z-20 w-10 h-10",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day: cn(
          "size-10 p-0 font-normal rounded-lg flex items-center justify-center text-[#816251] hover:bg-[#F0F2FF] hover:text-[#6F7EEA] transition-colors"
        ),
        day_range_start: "bg-[#6F7EEA] text-white hover:bg-[#5A67B8] hover:text-white",
        day_range_end: "bg-[#6F7EEA] text-white hover:bg-[#5A67B8] hover:text-white",
        day_selected: "bg-[#6F7EEA] text-white hover:bg-[#5A67B8] hover:text-white",
        day_today: "bg-[#E5E59B] text-[#816251] font-semibold",
        day_outside: "text-[#8A8A8A] opacity-60",
        day_disabled: "text-[#8A8A8A] opacity-40 cursor-not-allowed",
        day_range_middle: "bg-[#F0F2FF] text-[#6F7EEA]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4 text-[#816251]", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4 text-[#816251]", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };