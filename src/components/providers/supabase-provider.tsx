"use client"

import { createClient } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

type SupabaseContext = {
  user: User | null
  isLoading: boolean
}

const Context = createContext<SupabaseContext>({ user: null, isLoading: true })

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      setUser(data.user)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase, pathname, router])

  return <Context.Provider value={{ user, isLoading }}>{children}</Context.Provider>
}

export const useSupabase = () => useContext(Context)
