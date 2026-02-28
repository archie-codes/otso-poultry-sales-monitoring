"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import DeleteUserButton from "./DeleteUserButton";
import EditUserModal from "./EditUserModal";
import { useSearchParams, useRouter } from "next/navigation";

export default function UserCard({
  user,
  currentUserEmail,
}: {
  user: any;
  currentUserEmail?: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isNew = searchParams.get("newUserId") === String(user.id);
  const [glow, setGlow] = useState(isNew);
  const isCurrentUser = user.email === currentUserEmail;

  useEffect(() => {
    if (isNew) {
      setGlow(true);
      const timer = setTimeout(() => {
        setGlow(false);
        router.replace("/settings", { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew, router]);

  const isOwner = user.role === "owner";

  const cardTheme = isOwner
    ? "border-l-purple-500 from-purple-500/10 via-purple-500/5 to-transparent hover:border-purple-500/40"
    : "border-l-emerald-500 from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/40";

  const avatarTheme = isOwner
    ? "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30"
    : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

  return (
    <div
      className={`relative flex items-center justify-between p-4 rounded-2xl border-y border-r border-border/50 border-l-4 transition-all duration-500 group overflow-hidden ${
        glow
          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] scale-[1.02] z-10 border-l-blue-500"
          : `bg-linear-to-r ${cardTheme} backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5`
      }`}
    >
      {/* LEFT SIDE: Avatar & Info */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Dynamic Color Avatar */}
        <div
          className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden relative border shadow-sm transition-colors duration-700 ${
            glow
              ? "bg-blue-500/20 text-blue-500 border-blue-500/50"
              : avatarTheme
          }`}
        >
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* User Details */}
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-bold truncate text-foreground"
              title={user.name}
            >
              {user.name}
            </p>
            {isCurrentUser && (
              <span
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest shrink-0 shadow-sm ${
                  isOwner
                    ? "bg-purple-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                YOU
              </span>
            )}
          </div>

          <p
            className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5"
            title={user.email}
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.email}</span>
            {/* REMOVED the duplicate EditUserModal that was accidentally here! */}
          </p>

          <div className="mt-1.5 flex">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border shadow-sm ${
                isOwner
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Sleek Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 ml-2 z-10 bg-background/50 rounded-lg pl-1">
        {/* CORRECT PLACEMENT: Added the isCurrentUser prop here */}
        <EditUserModal user={user} isCurrentUser={isCurrentUser} />

        {!isCurrentUser && (
          <DeleteUserButton userId={user.id} userName={user.name} />
        )}
      </div>
    </div>
  );
}
