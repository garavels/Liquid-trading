import { supabase } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

// Disable static caching so it fetches fresh data on reload
export const dynamic = "force-dynamic";

export default async function Page() {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl max-w-lg border border-red-200">
          <h2 className="font-bold text-lg mb-2">Error Fetching Analytics</h2>
          <p className="font-mono text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return <DashboardClient transactions={transactions || []} />;
}
