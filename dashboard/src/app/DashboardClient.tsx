"use client";

import { useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function DashboardClient({ transactions }: { transactions: any[] }) {
  const router = useRouter();

  // Auto-refresh the Server Component data every 3 seconds to keep it live!
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);
  const totalCalls = transactions.length;
  
  const popularTools = transactions.reduce((acc: any, t) => {
    acc[t.action_type] = (acc[t.action_type] || 0) + 1;
    return acc;
  }, {});

  const topTool = popularTools && Object.keys(popularTools).length > 0 
    ? Object.keys(popularTools).reduce((a, b) => popularTools[a] > popularTools[b] ? a : b)
    : "None yet";

  const activeDays = new Set(transactions.map(t => new Date(t.timestamp).toDateString())).size;

  // Chart 1: Activity over time (Intra-day grouping)
  const activityData = useMemo(() => {
    const chrono = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const grouped = chrono.reduce((acc, tx) => {
      const time = format(new Date(tx.timestamp), 'h a'); // e.g. "3 PM"
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([time, count]) => ({ time, count }));
  }, [transactions]);

  // Chart 2: Top Actions
  const actionData = useMemo(() => {
    return Object.entries(popularTools)
      .map(([name, count]) => ({ name: (name as string).replace(/_/g, " "), count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [popularTools]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  /** Build a ZIP with transactions.json + transactions.csv and trigger download */
  const downloadZip = useCallback(async () => {
    const zip = new JSZip();

    // JSON export
    zip.file('transactions.json', JSON.stringify(transactions, null, 2));

    // CSV export
    const headers = ['id', 'timestamp', 'action_type', 'user_prompt', 'prompt_payload'];
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx =>
        headers.map(h => {
          const val = h === 'prompt_payload' ? JSON.stringify(tx[h]) : (tx[h] ?? '');
          // Wrap in quotes and escape inner quotes
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ];
    zip.file('transactions.csv', csvRows.join('\n'));

    const blob = await zip.generateAsync({ type: 'blob' });
    const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
    saveAs(blob, `liquid-analytics_${dateStr}.zip`);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Liquid Analytics</h1>
            <p className="text-slate-500 mt-1 font-medium">Live AI Interaction & Usage Tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={downloadZip}
              disabled={transactions.length === 0}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
              </svg>
              <span>Export ZIP</span>
            </button>
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Live Data via Server</span>
            </div>
          </div>
        </header>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Total Invocations</h3>
            <p className="text-4xl font-extrabold mt-2 text-indigo-600">{totalCalls}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Prompts Logged</h3>
            <p className="text-4xl font-extrabold mt-2 text-violet-600">{transactions.filter(t => t.user_prompt).length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Active Days</h3>
            <p className="text-4xl font-extrabold mt-2 text-slate-800">{activeDays}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Most Executed</h3>
            <p className="text-2xl font-bold mt-3 text-slate-800 capitalize truncate">{topTool.replace(/_/g, " ")}</p>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500 rounded-full blur-xl opacity-50"></div>
            <h3 className="text-indigo-200 font-semibold text-sm uppercase tracking-wider mb-2 z-10">Usage Insights</h3>
            <p className="text-sm font-medium leading-relaxed z-10">
              {totalCalls > 0 
                ? `Users are highly active; "${topTool.replace(/_/g, " ")}" dominates the workflow.` 
                : "Awaiting first prompt..."}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Activity Trend</h2>
            <div className="h-64 w-full">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Top AI Operations</h2>
            <div className="h-64 w-full">
              {actionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actionData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                      {actionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
              )}
            </div>
          </div>

        </div>

        {/* Recent Prompts Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Recent API Invocations</h2>
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              Showing last 500
            </span>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                <p className="text-slate-500 font-medium">No prompts tracked yet.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-indigo-200 shadow-sm">
                        {tx.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-400 text-sm font-semibold">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* User Prompt Bubble */}
                  {tx.user_prompt && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1.5">User Prompt</p>
                      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-900 italic">
                        &ldquo;{tx.user_prompt}&rdquo;
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-bold text-slate-600 mb-2">Payload Details:</p>
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-indigo-300 overflow-x-auto shadow-inner">
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
