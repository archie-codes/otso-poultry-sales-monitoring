"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  getRecentNotifications, // <-- Updated function name
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notificationActions";

export default function NotificationBell({ userId }: { userId: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Count how many are actually unread for the red badge
  const unreadCount = items.filter((item) => !item.isRead).length;

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getRecentNotifications(userId);
      setItems(data);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (id: number) => {
    // OPTIMISTIC UI: Don't delete it! Just change isRead to true so it fades out.
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    );
    await markAsRead(id);
  };

  const handleClearAll = async () => {
    // Mark everything as read visually
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    await markAllAsRead(userId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />

          {/* THE RED NOTIFICATION DOT (Only shows if there are UNREAD items) */}
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-950"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-2xl shadow-2xl border-border/50 overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black tracking-tight text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* NOTIFICATION LIST */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-500/50 mb-3" />
              <p className="text-sm font-bold text-foreground">
                No Activity Yet
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1">
                System events will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-4 p-5 transition-all group",
                    notif.isRead
                      ? "opacity-60 bg-transparent hover:opacity-100" // Faded if read
                      : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/30", // Highlighted if unread
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full shrink-0 mt-0.5 transition-colors",
                      notif.isRead
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate transition-colors",
                        notif.isRead
                          ? "font-semibold text-muted-foreground"
                          : "font-black text-foreground",
                      )}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <Clock className="w-3 h-3" />
                      {notif.createdAt &&
                        formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                    </div>
                  </div>

                  {/* Only show the checkmark button if it is UNREAD */}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 rounded-full text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER: Link to future Audit Log page */}
        <div className="p-2 border-t border-border/50 bg-slate-50 dark:bg-slate-900/50">
          <Link
            href="/settings/logs"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            View Full System Logs <ArrowRight className="w-3 h-3 ml-2" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
