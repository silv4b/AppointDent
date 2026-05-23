"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useState } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((p) => !p)} />
      <div
        className="flex flex-col transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : 260 }}
      >
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6">
          <div className="space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
