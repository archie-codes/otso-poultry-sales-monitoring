// "use client";

// import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import { createUser } from "./actions";
// import { UserPlus, X, Loader2, ShieldPlus } from "lucide-react";
// import { UploadButton } from "../../utils/uploadthing";
// import Image from "next/image";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";

// export default function AddUserModal() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [imageUrl, setImageUrl] = useState<string>("");
//   const [isUploading, setIsUploading] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const router = useRouter();

//   useEffect(() => setMounted(true), []);

//   // UPDATED: Use a standard event handler to force UI updates immediately
//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault(); // 1. Stop default browser submission
//     setLoading(true); // 2. Trigger the loading spinner INSTANTLY

//     const formData = new FormData(e.currentTarget);
//     if (imageUrl) formData.append("imageUrl", imageUrl);

//     // 3. Call the server action
//     const result = await createUser(formData);

//     if (result.error) {
//       toast.error("Action Failed", {
//         description: result.error,
//         style: {
//           backgroundColor: "#ef4444",
//           color: "white",
//           borderColor: "#dc2626",
//         },
//       });
//       setLoading(false); // Stop loading on error
//     } else {
//       toast.success("Success!", {
//         description: "User account created successfully.",
//         style: {
//           backgroundColor: "#3b82f6",
//           color: "white",
//           borderColor: "#2563eb",
//         },
//       });

//       // 4. Reset and Close
//       setImageUrl("");
//       setIsOpen(false);
//       setLoading(false);

//       // 5. Trigger the glowing effect on the new card
//       router.push(`/settings?newUserId=${result.newUserId}`);
//     }
//   }

//   return (
//     <>
//       {/* Trigger Button */}
//       <button
//         onClick={() => setIsOpen(true)}
//         className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground transition-all duration-300 shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
//       >
//         <ShieldPlus className="w-5 h-5 mr-2" /> Add New User
//       </button>

//       {/* The Modal */}
//       {isOpen &&
//         mounted &&
//         createPortal(
//           <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
//             <div className="fixed z-101 w-full max-w-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
//               <div className="flex justify-between items-center mb-6">
//                 <div>
//                   <h2 className="text-2xl font-bold tracking-tight text-foreground">
//                     Create Account
//                   </h2>
//                   <p className="text-sm text-muted-foreground">
//                     Set up credentials for a new staff member or owner.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               {/* UPDATED: Uses onSubmit={handleSubmit} instead of action={handleAction} */}
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Upload Dropzone */}
//                 <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-xl bg-secondary/20 min-h-[160px]">
//                   <label className="text-sm font-bold text-foreground mb-4 text-center w-full">
//                     Profile Picture (Optional)
//                   </label>
//                   {isUploading ? (
//                     <div className="flex flex-col items-center py-4">
//                       <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
//                       <p className="text-sm font-semibold text-muted-foreground animate-pulse">
//                         Uploading...
//                       </p>
//                     </div>
//                   ) : imageUrl ? (
//                     <div className="relative mt-2 mb-2 animate-in zoom-in-95 duration-300">
//                       <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-background shadow-lg relative">
//                         <Image
//                           src={imageUrl}
//                           alt="Profile Preview"
//                           fill
//                           className="object-cover"
//                         />
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => setImageUrl("")}
//                         className="absolute -top-1 -right-1 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors cursor-pointer z-10 border-2 border-background"
//                       >
//                         <X className="w-5 h-5" />
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="w-full max-w-sm flex justify-center">
//                       <UploadButton
//                         endpoint="profileImage"
//                         content={{
//                           button: "Upload Picture",
//                           allowedContent: "Images up to 4MB",
//                         }}
//                         appearance={{
//                           button:
//                             "bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 py-2 rounded-xl text-sm cursor-pointer w-full",
//                           allowedContent: "text-gray-500 text-xs mt-2",
//                         }}
//                         onUploadBegin={() => setIsUploading(true)}
//                         onClientUploadComplete={(res) => {
//                           setIsUploading(false);
//                           if (res && res[0]) setImageUrl(res[0].url);
//                         }}
//                         onUploadError={() => setIsUploading(false)}
//                       />
//                     </div>
//                   )}
//                 </div>

//                 {/* Input Fields */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">Full Name</label>
//                     <input
//                       type="text"
//                       name="name"
//                       required
//                       placeholder="Juan Dela Cruz"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">
//                       Email Address
//                     </label>
//                     <input
//                       type="email"
//                       name="email"
//                       required
//                       placeholder="worker@otsopoultry.com"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">
//                       Temporary Password
//                     </label>
//                     <input
//                       type="password"
//                       name="password"
//                       required
//                       placeholder="••••••••"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">System Role</label>
//                     <select
//                       name="role"
//                       required
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
//                     >
//                       <option value="staff">Farm Staff (Data Entry)</option>
//                       <option value="owner">Owner (Full Admin Access)</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
//                   <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="h-11 px-6 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="h-11 px-8 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
//                         Creating...
//                       </>
//                     ) : (
//                       <>
//                         <UserPlus className="w-4 h-4 mr-2 inline" /> Create User
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>,
//           document.body,
//         )}
//     </>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createUser } from "./actions";
import {
  UserPlus,
  X,
  Loader2,
  ShieldPlus,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { UploadButton } from "../../utils/uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const ROLES = [
  { value: "staff", label: "Farm Staff (Data Entry)" },
  { value: "owner", label: "Owner (Full Admin Access)" },
];

export default function AddUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Combobox State
  const [openRole, setOpenRole] = useState(false);
  const [role, setRole] = useState("staff");

  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (imageUrl) formData.append("imageUrl", imageUrl);

    // Explicitly append the role from our React state
    formData.set("role", role);

    const result = await createUser(formData);

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
      toast.success("Success!", {
        description: "User account created successfully.",
        style: {
          backgroundColor: "#3b82f6",
          color: "white",
          borderColor: "#2563eb",
        },
      });

      setImageUrl("");
      setRole("staff"); // Reset role to default
      setIsOpen(false);
      setLoading(false);

      router.push(`/settings?newUserId=${result.newUserId}`);
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground transition-all duration-300 shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      >
        <ShieldPlus className="w-5 h-5 mr-2" /> Add New User
      </button>

      {/* The Modal */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="fixed z-101 w-full max-w-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Create Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Set up credentials for a new staff member or owner.
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
                    Profile Picture (Optional)
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
                          button: "Upload Picture",
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

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Juan Dela Cruz"
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
                      placeholder="worker@otsopoultry.com"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* ---> UPGRADED SYSTEM ROLE COMBOBOX <--- */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">System Role</label>
                    <Popover open={openRole} onOpenChange={setOpenRole}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openRole}
                          className="w-full h-11 justify-between rounded-xl bg-background border-input px-3 font-normal text-sm"
                        >
                          {role
                            ? ROLES.find((r) => r.value === role)?.label
                            : "Select role..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0 z-200"
                        align="start"
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {ROLES.map((r) => (
                                <CommandItem
                                  key={r.value}
                                  value={r.value}
                                  onSelect={(currentValue) => {
                                    setRole(
                                      currentValue === role ? "" : currentValue,
                                    );
                                    setOpenRole(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <span className="font-semibold text-sm">
                                    {r.label}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      role === r.value
                                        ? "opacity-100 text-blue-600"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <input type="hidden" name="role" value={role} />
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2 inline" /> Create User
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
