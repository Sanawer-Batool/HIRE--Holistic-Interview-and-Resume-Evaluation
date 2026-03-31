import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "HIRE - Candidate Management",
    description: "AI-powered hiring platform",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 min-h-screen`}>
                <Navbar />
                <main className="max-w-6xl mx-auto px-8 py-8">
                    {children}
                </main>
            </body>
        </html>
    )
}