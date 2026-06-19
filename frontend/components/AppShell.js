"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function AppShell({ children }) {
    const pathname = usePathname()
    const isLandingPage = pathname === "/"

    if (isLandingPage) {
        return children
    }

    return (
        <>
            <Navbar />
            <main className="max-w-6xl mx-auto px-8 py-8">
                {children}
            </main>
        </>
    )
}