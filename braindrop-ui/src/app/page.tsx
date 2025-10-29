// app/page.js
'use client';
import Link from 'next/link';
import Topbar from "@/components/custom/topbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <Topbar />
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-8 max-w-md w-full">
        <img
          src="/icon/braindrophq1.png"
          alt="BrainDrop HQ illustration"
          className="w-32 h-32 object-contain mx-auto"
        />
        <p className="text-center text-gray-600 mb-2">
          Interactive quiz dApp where users learn, compete, and earn crypto rewards.
        </p>
        
        <div className="flex flex-col space-y-4">
          <Link href="/host">
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
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with Next.js & Socket.io</p>
        </div>
      </div>
    </div>
  );
}