import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080b12' }}>

      {/* ── Animated mesh background ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Large blobs */}
        <div
          className="absolute animate-blob"
          style={{
            width: '600px', height: '600px',
            top: '-200px', left: '-100px',
            background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
            animationDuration: '12s',
          }}
        />
        <div
          className="absolute animate-blob"
          style={{
            width: '700px', height: '700px',
            top: '-100px', right: '-200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
            animationDuration: '16s',
            animationDelay: '-5s',
          }}
        />
        <div
          className="absolute animate-blob"
          style={{
            width: '500px', height: '500px',
            bottom: '10%', left: '20%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
            animationDuration: '20s',
            animationDelay: '-10s',
          }}
        />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
          }}
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, #080b12 100%)',
          }}
        />
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1">
        <PublicHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
