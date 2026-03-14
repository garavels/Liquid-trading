import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export const revalidate = 0; // Disable static caching so the dashboard updates live

export default async function DashboardPage() {
  // Fetch recent transactions
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Fetch error:", error);
    return (
      <div className="p-8 text-red-500">
        Error loading transactions: {error.message}
      </div>
    );
  }

  // Calculate metrics
  const totalCalls = transactions?.length || 0;
  
  // Group by tool
  const popularTools = transactions?.reduce((acc: any, t) => {
    acc[t.action_type] = (acc[t.action_type] || 0) + 1;
    return acc;
  }, {});

  const topTool = popularTools && Object.keys(popularTools).length > 0 
    ? Object.keys(popularTools).reduce((a, b) => popularTools[a] > popularTools[b] ? a : b)
    : "None yet";

  // Group by day for simple "active days" metric
  const activeDays = new Set(transactions?.map(t => new Date(t.timestamp).toDateString())).size;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Liquid Intelligence</h1>
            <p className="text-neutral-400 mt-1">Live AI Interaction & Usage Tracking</p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Data</span>
          </div>
        </header>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-neutral-400 font-medium text-sm">Total Tool Invocations</h3>
            <p className="text-4xl font-semibold mt-2 text-white">{totalCalls}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-neutral-400 font-medium text-sm">Unique Days Active</h3>
            <p className="text-4xl font-semibold mt-2 text-white">{activeDays}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-neutral-400 font-medium text-sm">Most Executed Tool</h3>
            <p className="text-3xl font-semibold mt-3 text-blue-400 capitalize">{topTool.replace("_", " ")}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <h3 className="text-blue-300 font-medium text-sm mb-2">Usage Pattern</h3>
            <p className="text-sm font-medium text-blue-100 leading-tight">
              {totalCalls > 0 
                ? `Users are mostly asking data questions (tools invoked ${totalCalls} times).` 
                : "Awaiting first prompt..."}
            </p>
          </div>
        </div>

        {/* Recent Prompts Feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent AI Interactions</h2>
          </div>
          
          <div className="divide-y divide-neutral-800/50">
            {!transactions || transactions.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center">
                  <span className="text-neutral-500 text-2xl">💤</span>
                </div>
                <p className="text-neutral-500">No prompts tracked yet. Try chatting with the MCP server!</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-6 hover:bg-neutral-800/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border border-blue-500/20">
                        TOOL EXECUTION
                      </span>
                      <span className="text-neutral-300 font-medium border-l border-neutral-700 pl-3">
                        {tx.action_type}
                      </span>
                      <span className="text-neutral-500 text-sm font-medium border-l border-neutral-700 pl-3">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-neutral-400 mb-1.5">Parameters Extracted by LLM:</p>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-neutral-300 border border-neutral-800/50 overflow-x-auto">
                      <pre>
                        {JSON.stringify(tx.prompt_payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
