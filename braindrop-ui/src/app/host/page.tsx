'use client';

import Topbar from "@/components/custom/topbar";
import { NewquizCard } from "@/components/custom/newquizcard"
import { InputquizCard } from "@/components/custom/inputquizcard"
import { ViewhalamanquizCard } from "@/components/custom/viewhalamanquizcard"

export default function HostPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 pt-14">
      <Topbar />
      <div className="flex items-start gap-12">
        {/* Sidebar: sticky di bawah Topbar, tetap berada di kiri */}
        <div className="self-start sticky top-15">
          <ViewhalamanquizCard />
        </div>

        {/* Konten utama: isi di samping sidebar */}
        <div className="mt-6">
          <div className="max-w-3xl">
            <InputquizCard />
          </div>
        </div>
      </div>
    </div>
  );
}