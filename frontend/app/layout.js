import { Inter } from "next/font/google"
import "./globals.css"
import { RoleProvider } from "@/context/RoleContext"
import AppShell from "@/components/AppShell"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "HIRE - Candidate Management",
    description: "AI-powered hiring platform",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 min-h-screen`}>
                <RoleProvider>
                    <AppShell>{children}</AppShell>
                </RoleProvider>
            </body>
        </html>
    )
}