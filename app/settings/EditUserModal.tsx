"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateUser } from "./actions";
import { Pencil, X, Loader2, Save } from "lucide-react";
import { UploadButton } from "../../utils/uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ADDED: isCurrentUser prop
export default function EditUserModal({
  user,
  isCurrentUser,
}: {
  user: any;
  isCurrentUser?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(user.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ADDED: Hooks for updating the session and refreshing the layout
  const { update } = useSession();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", String(user.id));

    // Explicitly append the imageUrl (or empty string if removed)
    formData.append("imageUrl", imageUrl);

    const result = await updateUser(formData);

    if (result.error) {
      toast.error("Action Failed", {
        description: result.error,
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          borderColor: "#dc2626",
        },
      });
      setLoading(false);
    } else {
      toast.success("User Updated!", {
        description: `${user.name}'s account has been updated successfully.`,
        style: {
          backgroundColor: "#3b82f6",
          color: "white",
          borderColor: "#2563eb",
        },
      });

      // ADDED: Real-time NextAuth session update if it's the logged-in user!
      if (isCurrentUser) {
        await update({
          name: formData.get("name"),
          imageUrl: imageUrl || null,
        });
        // Force Next.js to re-fetch the layout with the fresh cookie
        router.refresh();
      }

      setIsOpen(false);
      setLoading(false);
    }
  }

  return (
    <>
      {/* Sleek Edit Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        title={`Edit ${user.name}`}
        className="p-2 rounded-lg text-blue-500 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200 cursor-pointer"
      >
        <Pencil className="w-[18px] h-[18px]" />
      </button>

      {/* The Modal */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="fixed z-101 w-full max-w-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Edit Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Update credentials or roles for {user.name}.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload Dropzone */}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl bg-secondary/20 min-h-[160px]">
                  <label className="text-sm font-bold text-foreground mb-4 text-center w-full">
                    Profile Picture
                  </label>
                  {isUploading ? (
                    <div className="flex flex-col items-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                      <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                        Uploading...
                      </p>
                    </div>
                  ) : imageUrl ? (
                    <div className="relative mt-2 mb-2 animate-in zoom-in-95 duration-300">
                      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-background shadow-lg relative">
                        <Image
                          src={imageUrl}
                          alt="Profile Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute -top-1 -right-1 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors cursor-pointer z-10 border-2 border-background"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm flex justify-center">
                      <UploadButton
                        endpoint="profileImage"
                        content={{
                          button: "Upload New Picture",
                          allowedContent: "Images up to 4MB",
                        }}
                        appearance={{
                          button:
                            "bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 py-2 rounded-xl text-sm cursor-pointer w-full",
                          allowedContent: "text-gray-500 text-xs mt-2",
                        }}
                        onUploadBegin={() => setIsUploading(true)}
                        onClientUploadComplete={(res) => {
                          setIsUploading(false);
                          if (res && res[0]) setImageUrl(res[0].url);
                        }}
                        onUploadError={() => setIsUploading(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Input Fields (Pre-filled) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={user.name}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={user.email}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      New Password{" "}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      minLength={8}
                      placeholder="Leave blank to keep current"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">System Role</label>
                    <select
                      name="role"
                      required
                      defaultValue={user.role}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
                    >
                      <option value="staff">Farm Staff (Data Entry)</option>
                      <option value="owner">Owner (Full Admin Access)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
