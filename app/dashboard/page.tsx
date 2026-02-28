// import CardSummary from "@/components/CardSummary";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import LineChart from "@/components/LineChart";
// import { ArrowUpRight, ArrowDownRight, Wallet, DollarSign } from "lucide-react";

// export default function Dashboard() {
//   return (
//     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">
//           Dashboard Overview
//         </h1>
//         <p className="text-muted-foreground mt-1">
//           Welcome back. Here&apos;s what&apos;s happening at Otso Poultry Farm today.
//         </p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <CardSummary
//           title="Total Sales Today"
//           amount="₱120,000"
//           icon={<ArrowUpRight className="w-5 h-5" />}
//           trend="+12.5%"
//           gradient="from-blue-500 to-cyan-400"
//         />
//         <CardSummary
//           title="Total Expenses Today"
//           amount="₱75,000"
//           icon={<ArrowDownRight className="w-5 h-5" />}
//           trend="-2.4%"
//           gradient="from-rose-500 to-orange-400"
//         />
//         <CardSummary
//           title="Net Income Today"
//           amount="₱45,000"
//           icon={<Wallet className="w-5 h-5" />}
//           trend="+8.2%"
//           gradient="from-emerald-500 to-teal-400"
//         />
//         <CardSummary
//           title="Monthly Net Income"
//           amount="₱850,000"
//           icon={<DollarSign className="w-5 h-5" />}
//           trend="+18.1%"
//           gradient="from-purple-500 to-indigo-400"
//         />
//       </div>

//       <div className="grid grid-cols-1 gap-6">
//         <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-xl">
//           <CardHeader>
//             <CardTitle>Monthly Sales vs Expenses</CardTitle>
//             <p className="text-sm text-muted-foreground">
//               Financial performance over the last 6 months (Mock Data).
//             </p>
//           </CardHeader>
//           <CardContent>
//             <LineChart />
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
// Change these imports at the top
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Make sure this matches your alias setup, or use "../../lib/auth"
import { redirect } from "next/navigation";
import CardSummary from "@/components/CardSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LineChart from "@/components/LineChart";
import { ArrowUpRight, ArrowDownRight, Wallet, DollarSign } from "lucide-react";

export default async function Dashboard() {
  // 1. Fetch the user session securely using NextAuth v4 syntax
  const session = await getServerSession(authOptions);

  // 2. If the user is staff, redirect them to Daily Monitoring
  if ((session?.user as any)?.role === "staff") {
    redirect("/production/monitoring");
  }

  // 3. Otherwise, render the Owner Dashboard
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s what&apos;s happening at Otso Poultry Farm
          today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSummary
          title="Total Sales Today"
          amount="₱120,000"
          icon={<ArrowUpRight className="w-5 h-5" />}
          trend="+12.5%"
          gradient="from-blue-500 to-cyan-400"
        />
        <CardSummary
          title="Total Expenses Today"
          amount="₱75,000"
          icon={<ArrowDownRight className="w-5 h-5" />}
          trend="-2.4%"
          gradient="from-rose-500 to-orange-400"
        />
        <CardSummary
          title="Net Income Today"
          amount="₱45,000"
          icon={<Wallet className="w-5 h-5" />}
          trend="+8.2%"
          gradient="from-emerald-500 to-teal-400"
        />
        <CardSummary
          title="Monthly Net Income"
          amount="₱850,000"
          icon={<DollarSign className="w-5 h-5" />}
          trend="+18.1%"
          gradient="from-purple-500 to-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1 border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Monthly Sales vs Expenses</CardTitle>
            <p className="text-sm text-muted-foreground">
              Financial performance over the last 6 months (Mock Data).
            </p>
          </CardHeader>
          <CardContent>
            <LineChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
