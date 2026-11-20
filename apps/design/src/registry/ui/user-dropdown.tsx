/*
 * User Dropdown: the original component by a 21st.dev community author (the demo profile is aymanch-03).
 * Vendored as published for crocwork.studio; the code is the author's, kept as written apart from:
 * - the page's demo and the component are merged into this one file; the demo is the default export
 * - cn comes from @empire/ui
 * - the shadcn avatar, badge and dropdown-menu parts are inlined at the top
 * - type-checking is off for this file: it was written without the strict index checks this repo turns on
 */
// @ts-nocheck
"use client";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight, Circle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@empire/ui";

// shadcn/ui primitives (MIT) that the original imports from its own components folder, inlined so the file stands alone
function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}
function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} {...props} />;
}
function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn("flex size-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  );
}
function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-md border border-transparent bg-primary px-2 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const MENU_ITEM =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
const MENU_PANEL =
  "z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          MENU_PANEL,
          "max-h-(--radix-dropdown-menu-content-available-height)",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn(MENU_ITEM, className)} {...props} />;
}
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem className={cn(MENU_ITEM, "pr-2 pl-8", className)} {...props}>
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(MENU_ITEM, "data-[state=open]:bg-accent", className)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}
function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(MENU_PANEL, "shadow-lg", className)}
      {...props}
    />
  );
}
import { Icon } from "@iconify/react";

const MENU_ITEMS = {
  status: [
    { value: "focus", icon: "solar:emoji-funny-circle-line-duotone", label: "Focus" },
    { value: "offline", icon: "solar:moon-sleep-line-duotone", label: "Appear Offline" },
  ],
  profile: [
    { icon: "solar:user-circle-line-duotone", label: "Your profile", action: "profile" },
    { icon: "solar:sun-line-duotone", label: "Appearance", action: "appearance" },
    { icon: "solar:settings-line-duotone", label: "Settings", action: "settings" },
    { icon: "solar:bell-line-duotone", label: "Notifications", action: "notifications" },
  ],
  premium: [
    {
      icon: "solar:star-bold",
      label: "Upgrade to Pro",
      action: "upgrade",
      iconClass: "text-amber-600",
      badge: { text: "20% off", className: "bg-amber-600 text-white text-[11px]" },
    },
    { icon: "solar:gift-line-duotone", label: "Referrals", action: "referrals" },
  ],
  support: [
    { icon: "solar:download-line-duotone", label: "Download app", action: "download" },
    {
      icon: "solar:letter-unread-line-duotone",
      label: "What's new?",
      action: "whats-new",
      rightIcon: "solar:square-top-down-line-duotone",
    },
    {
      icon: "solar:question-circle-line-duotone",
      label: "Get help?",
      action: "help",
      rightIcon: "solar:square-top-down-line-duotone",
    },
  ],
  account: [
    {
      icon: "solar:users-group-rounded-bold-duotone",
      label: "Switch account",
      action: "switch",
      showAvatar: false,
    },
    { icon: "solar:logout-2-bold-duotone", label: "Log out", action: "logout" },
  ],
};

export const UserDropdown = ({
  user = {
    name: "Ayman Echakar",
    username: "@aymanch-03",
    avatar:
      "https://cdn.21st.dev/assets/mirror/a6/a68f05902fdaa56d255595b34e226a354c18bf5cdb083ca7c978adab7c6141d6.png",
    initials: "AE",
    status: "online",
  },
  onAction = () => {},
  onStatusChange = () => {},
  selectedStatus = "online",
  promoDiscount = "20% off",
  accounts = [],
}) => {
  const renderMenuItem = (item, index) => (
    <DropdownMenuItem
      key={index}
      className={cn(
        item.badge || item.showAvatar || item.rightIcon ? "justify-between" : "",
        "p-2 rounded-lg cursor-pointer",
      )}
      onClick={() => onAction(item.action)}
    >
      <span className="flex items-center gap-1.5 font-medium">
        <Icon
          icon={item.icon}
          className={`size-5 ${item.iconClass || "text-gray-500 dark:text-gray-400"}`}
        />
        {item.label}
      </span>
      {item.badge && (
        <Badge className={item.badge.className}>{promoDiscount || item.badge.text}</Badge>
      )}
      {item.rightIcon && (
        <Icon icon={item.rightIcon} className="size-4 text-gray-500 dark:text-gray-400" />
      )}
      {item.showAvatar && (
        <Avatar className="cursor-pointer size-6 shadow border border-white dark:border-gray-700">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      )}
    </DropdownMenuItem>
  );

  const getStatusColor = (status) => {
    const colors = {
      online:
        "text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/30 dark:border-green-500/50",
      offline:
        "text-gray-600 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600",
      busy: "text-red-600 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900/30 dark:border-red-500/50",
    };
    return colors[status.toLowerCase()] || colors.online;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-10 border border-white dark:border-gray-700">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="no-scrollbar w-[310px] rounded-2xl bg-gray-50 dark:bg-black/90 p-0"
        align="end"
      >
        <section className="bg-white dark:bg-gray-100/10 backdrop-blur-lg rounded-2xl p-1 shadow border border-gray-200 dark:border-gray-700/20">
          <div className="flex items-center p-2">
            <div className="flex-1 flex items-center gap-2">
              <Avatar className="cursor-pointer size-10 border border-white dark:border-gray-700">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {user.name}
                </h3>
                <p className="text-muted-foreground text-xs">{user.username}</p>
              </div>
            </div>
            <Badge
              className={`${getStatusColor(user.status)} border-[0.5px] text-[11px] rounded-sm capitalize`}
            >
              {user.status}
            </Badge>
          </div>

          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer p-2 rounded-lg">
                <span className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400">
                  <Icon
                    icon="solar:smile-circle-line-duotone"
                    className="size-5 text-gray-500 dark:text-gray-400"
                  />
                  Update status
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-white dark:bg-white/10 backdrop-blur-lg">
                  <DropdownMenuRadioGroup value={selectedStatus} onValueChange={onStatusChange}>
                    {MENU_ITEMS.status.map((status, index) => (
                      <DropdownMenuRadioItem className="gap-2" key={index} value={status.value}>
                        <Icon
                          icon={status.icon}
                          className="size-5 text-gray-500 dark:text-gray-400"
                        />
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.profile.map(renderMenuItem)}</DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.premium.map(renderMenuItem)}</DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.support.map(renderMenuItem)}</DropdownMenuGroup>
        </section>

        <section className="mt-1 p-1 rounded-2xl">
          <DropdownMenuGroup>{MENU_ITEMS.account.map(renderMenuItem)}</DropdownMenuGroup>
        </section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function DemoOne() {
  return <UserDropdown />;
}
