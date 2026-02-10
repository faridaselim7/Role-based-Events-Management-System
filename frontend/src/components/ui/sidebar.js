"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftIcon, Calendar, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react";

import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

// --- Constants ---
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "18rem";
const SIDEBAR_WIDTH_MOBILE = "20rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = React.createContext(null);

// --- Hook ---
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

// --- Provider ---
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) setOpenProp(openState);
      else _setOpen(openState);

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

// --- Sidebar ---
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-white text-[#816251] flex h-full w-[--sidebar-width] flex-col border-r border-[#E5E9D5]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-white text-[#816251] w-[--sidebar-width] p-0 [&>button]:hidden border-r border-[#E5E9D5]"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-[#816251] hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l border-[#E5E9D5]"
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-white flex h-full w-full flex-col group-data-[variant=floating]:border group-data-[variant=floating]:border-[#E5E9D5] group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// --- SidebarTrigger ---
function SidebarTrigger({ className, onClick, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-8 text-[#816251] hover:bg-[#F0F2FF] hover:text-[#6F7EEA]", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

// --- Additional Components ---
function SidebarRail(props) {
  return <div data-slot="sidebar-rail" className="w-[--sidebar-width-icon]" {...props} />;
}

function SidebarHeader({ className, ...props }) {
  return (
    <div 
      data-slot="sidebar-header" 
      className={cn("p-6 border-b border-[#E5E9D5]", className)} 
      {...props}
    >
      <h1 className="text-2xl font-bold text-[#6F7EEA]">Brains704</h1>
      <div className="h-1 w-10 bg-[#E5E59B] rounded-full mt-2" />
    </div>
  );
}

function SidebarFooter({ className, ...props }) {
  return <div data-slot="sidebar-footer" className={cn("p-4 mt-auto border-t border-[#E5E9D5]", className)} {...props} />;
}

function SidebarGroup({ className, ...props }) {
  return <div data-slot="sidebar-group" className={cn("px-3 py-2", className)} {...props} />;
}

function SidebarGroupLabel({ className, ...props }) {
  return (
    <div 
      data-slot="sidebar-group-label" 
      className={cn("px-3 text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide", className)} 
      {...props} 
    />
  );
}

function SidebarGroupContent({ className, ...props }) {
  return <div data-slot="sidebar-group-content" className={cn("mt-2 space-y-1", className)} {...props} />;
}

function SidebarMenu({ className, ...props }) {
  return <div data-slot="sidebar-menu" className={cn("flex flex-col gap-1 px-3", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }) {
  return <div data-slot="sidebar-menu-item" className={cn("relative", className)} {...props} />;
}

function SidebarMenuButton({ className, isActive, asChild, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
        "hover:bg-[#F0F2FF] hover:text-[#6F7EEA]",
        "data-[active=true]:bg-[#F0F2FF] data-[active=true]:text-[#6F7EEA] data-[active=true]:font-semibold",
        "border border-transparent hover:border-[#E0E7FF]",
        className
      )}
      {...props}
    />
  );
}

function SidebarInput(props) {
  return (
    <Input 
      data-slot="sidebar-input" 
      className="h-9 bg-[#F8F9FA] border-[#E5E9D5] text-[#816251] placeholder:text-[#8A8A8A]"
      {...props} 
    />
  );
}

function SidebarSeparator(props) {
  return (
    <Separator 
      data-slot="sidebar-separator" 
      className="my-3 bg-[#E5E9D5]" 
      {...props} 
    />
  );
}

function SidebarSkeleton() {
  return (
    <Skeleton 
      data-slot="sidebar-skeleton" 
      className="h-10 w-full rounded-xl bg-[#E5E9D5]" 
    />
  );
}

// --- Exports ---
export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  SidebarSeparator,
  SidebarSkeleton,
  useSidebar,
};