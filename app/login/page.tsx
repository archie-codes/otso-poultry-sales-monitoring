// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Eye, EyeOff, Moon, Sun, AlertCircle } from "lucide-react";
// import { useTheme } from "next-themes";
// import { signIn } from "next-auth/react";

// export default function LoginPage() {
//   const router = useRouter();
//   const { theme, setTheme } = useTheme();
//   const [showPassword, setShowPassword] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const result = await signIn("credentials", {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         setError("Invalid email or password");
//         setLoading(false);
//       } else {
//         router.push("/");
//         router.refresh();
//       }
//     } catch (err) {
//       setError("An unexpected error occurred");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-gray-950 relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300">
//       {/* 1. The Premium Dot Pattern Overlay */}
//       <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none" />

//       {/* 2. The Animated Light Orbs */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none flex justify-center items-center">
//         {/* Farm Morning Sun (Amber) */}
//         <div className="absolute top-[-10%] left-[-10%] w-120 h-120 bg-amber-400/30 dark:bg-amber-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse" />

//         {/* Nature/Growth (Emerald) */}
//         <div
//           className="absolute top-[20%] right-[-10%] w-100 h-100 bg-emerald-400/30 dark:bg-emerald-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse"
//           style={{ animationDelay: "2s" }}
//         />

//         {/* Tech/Sky (Blue) */}
//         <div
//           className="absolute bottom-[-10%] left-[10%] w-140 h-140 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse"
//           style={{ animationDelay: "4s" }}
//         />
//       </div>

//       <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_20px_50px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 z-10 overflow-hidden relative transition-colors duration-300">
//         <div className="h-2 w-full bg-linear-to-r from-blue-500 to-green-500 absolute top-0 left-0" />

//         <div className="p-8 sm:p-10">
//           <div className="mb-4 flex justify-end">
//             <button
//               type="button"
//               onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//               className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-900"
//             >
//               {mounted && theme === "dark" ? (
//                 <Sun className="h-5 w-5" />
//               ) : (
//                 <Moon className="h-5 w-5" />
//               )}
//             </button>
//           </div>

//           <div className="flex flex-col items-center mb-8">
//             <div className="h-20 w-20 sm:h-24 sm:w-24 relative mb-6 drop-shadow-md hover:scale-105 transition-transform duration-300">
//               <Image
//                 src="/logo.png"
//                 alt="Otso Poultry Farm Logo"
//                 fill
//                 className="object-contain"
//                 priority
//               />
//             </div>
//             <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white mb-2 transition-colors duration-300">
//               Otso Poultry Farm
//             </h1>
//             <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium text-center transition-colors duration-300">
//               Sales Monitoring System
//             </p>
//           </div>

//           <form onSubmit={handleLogin} className="space-y-6">
//             {error && (
//               <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 transition-colors">
//                 <AlertCircle className="h-4 w-4" />
//                 {error}
//               </div>
//             )}
//             {/* Input for Emails */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
//                   Email Address
//                 </label>
//               </div>
//               <div className="relative">
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="admin@otsopoultry.com"
//                   className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-sm text-gray-900 dark:text-white transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
//                   required
//                   disabled={loading}
//                 />
//               </div>
//             </div>
//             {/* Input for Password */}
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
//                   Password
//                 </label>
//               </div>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="🥚🥚🥚🥚🥚🥚🥚🥚"
//                   className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 pr-12 text-sm text-gray-900 dark:text-white transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/50 [&::-ms-reveal]:hidden disabled:opacity-50 disabled:cursor-not-allowed"
//                   required
//                   disabled={loading}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   disabled={loading}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full h-12 inline-flex items-center justify-center rounded-xl text-sm font-bold text-white transition-all duration-300 bg-linear-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-70 disabled:hover:translate-y-0"
//             >
//               {loading ? "Authenticating..." : "Sign In to Dashboard"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Moon, Sun, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    // Changed min-h-screen to min-h-[100dvh] to better handle mobile/laptop browser bars
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-gray-950 relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* 1. The Premium Dot Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none" />

      {/* 2. The Animated Light Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none flex justify-center items-center">
        <div className="absolute top-[-10%] left-[-10%] w-120 h-120 bg-amber-400/30 dark:bg-amber-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse" />
        <div
          className="absolute top-[20%] right-[-10%] w-100 h-100 bg-emerald-400/30 dark:bg-emerald-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-[-10%] left-[10%] w-140 h-140 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_20px_50px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 z-10 overflow-hidden relative transition-colors duration-300">
        <div className="h-2 w-full bg-linear-to-r from-blue-500 to-green-500 absolute top-0 left-0" />

        {/* ---> THE FIX: Reduced massive p-10 to dynamic p-6 sm:p-8 <--- */}
        <div className="p-6 sm:p-8">
          <div className="mb-2 sm:mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>

          {/* ---> THE FIX: Tighter margins and smaller logo on small screens <--- */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="h-16 w-16 sm:h-20 sm:w-20 relative mb-4 sm:mb-5 drop-shadow-md hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="Otso Poultry Farm Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white mb-1 transition-colors duration-300">
              Otso Poultry Farm
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium text-center transition-colors duration-300">
              Sales Monitoring System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 transition-colors">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Input for Emails */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Email Address
                </label>
              </div>
              <div className="relative">
                {/* ---> THE FIX: Dynamic height h-11 to h-12 <--- */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@otsopoultry.com"
                  className="flex h-11 sm:h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-sm text-gray-900 dark:text-white transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input for Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Password
                </label>
              </div>
              <div className="relative">
                {/* ---> THE FIX: Dynamic height h-11 to h-12 <--- */}
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="🥚🥚🥚🥚🥚🥚🥚🥚"
                  className="flex h-11 sm:h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 pr-12 text-sm text-gray-900 dark:text-white transition-all duration-200 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/50 [&::-ms-reveal]:hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Eye size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* ---> THE FIX: Dynamic height h-11 to h-12 <--- */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 sm:h-12 inline-flex items-center justify-center rounded-xl text-sm font-bold text-white transition-all duration-300 bg-linear-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
