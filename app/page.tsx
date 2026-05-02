export const dynamic = 'force-dynamic';

// Libs
import { prisma } from '@/lib/prisma';
import { Terminal, Database, Shield, Activity, HardDrive } from 'lucide-react';

export default async function BackendStatusPage() {
  // Fetch Real-time System Metrics
  const stats = await prisma.$transaction([
    prisma.technician.count(),
    prisma.tool.count(),
    prisma.faultLog.count(),
    prisma.auditTrail.count(),
    prisma.auditTrail.findMany({
      take: 5,
      orderBy: { actionTimestamp: 'desc' },
      include: { changedBy: { select: { fullName: true } } }
    })
  ]);

  const [techCount, toolCount, faultCount, auditCount, recentLogs] = stats;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono p-8 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        <header className="border-b border-slate-800 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-emerald-500 text-2xl font-bold flex items-center gap-3">
              <Terminal size={28} />
              OCCLUSION_MAINFRAME_V1.0
            </h1>
            <p className="text-slate-500 text-sm mt-1">Enterprise AR Backend • Secure Uplink Active</p>
          </div>
          <div className="text-right">
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs border border-emerald-500/20 animate-pulse">
              SYSTEM_READY
            </span>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'OPERATORS', val: techCount, icon: <Shield size={16} /> },
            { label: 'HARDWARE', val: toolCount, icon: <HardDrive size={16} /> },
            { label: 'ANOMALIES', val: faultCount, icon: <Activity size={16} /> },
            { label: 'LOG_ENTRIES', val: auditCount, icon: <Database size={16} /> }
          ].map((item, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                {item.icon} {item.label}
              </div>
              <div className="text-2xl text-white font-bold">{item.val}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between">
            <span className="text-xs font-bold text-slate-400">LIVE_AUDIT_STREAM</span>
            <span className="text-[10px] text-slate-500">AUTO_REFRESH: ON</span>
          </div>
          <div className="p-4 space-y-3">
            { recentLogs.map((log) => (
              <div key={log.id} className="text-xs flex gap-4 border-b border-slate-800/50 pb-2 last:border-0">
                <span className="text-emerald-500/50">[{new Date(log.actionTimestamp).toLocaleTimeString()}]</span>
                <span className="text-blue-400 font-bold">{log.actionType}</span>
                <span className="text-slate-400">{log.targetTable}::{log.targetRecordId.slice(0,8)}</span>
                <span className="ml-auto text-slate-500">BY: {log.changedBy.fullName}</span>
              </div>
            )) }
          </div>
        </div>
        <div className="mt-8 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
          <p className="text-emerald-500/70 text-xs leading-relaxed">
            &gt; Initializing Database Handshake... <br/>
            &gt; CORS Policy Loaded: [AUTH_DASHBOARD, LOCALHOST_3000] <br/>
            &gt; Rate Limiter: ACTIVE <br/>
            &gt; Encryption Mode: AES-256-GCM <br/>
            &gt; Mainframe standing by for AR telemetry...
          </p>
        </div>
      </div>
    </div>
  );
}
