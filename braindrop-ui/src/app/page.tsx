// app/page.js
'use client';
import Link from 'next/link';
import Topbar from "@/components/custom/topbar";

export default function Home() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/background.mp4" type="video/mp4" />
        {/* Fallback gradient if video fails or loads slow */}
        Your browser does not support the video tag.
      </video>

      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      {/* Fallback background if video missing (behind video) */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 -z-10" />

      {/* Topbar - Fixed position, so placement in DOM matters less for layout but good for z-index */}
      <Topbar />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/60 dark:bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 md:p-8 w-full transition-all">
          <img
            src="/icon/braindrophq1.png"
            alt="BrainDrop HQ illustration"
            className="w-32 h-32 object-contain mx-auto dark:invert transition-all"
          />
          <p className="text-center text-slate-600 dark:text-slate-300 mb-2">
            Interactive quiz dApp where users learn, compete, and earn crypto rewards.
          </p>

          <div className="flex flex-col space-y-4">
            <Link href="/create">
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
                Host a Game
              </button>
            </Link>

            <Link href="/player">
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
                Join a Game
              </button>
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Built with Next.js & Socket.io</p>
          </div>
        </div>
      </div>
    </div>
  );
}