"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRole } from "@/context/RoleContext"

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { role, clearRole } = useRole()

    // Don't show navbar on landing page
    if (pathname === "/") return null

    function handleSwitchRole() {
        clearRole()
        router.push("/")
    }

    const recruiterLinks = [
        { href: "/search",     label: "Find Candidates" },
        { href: "/job-runs",   label: "Job Runs"        },
        { href: "/candidates", label: "All Candidates"  },
    ]

    // After candidate saves profile, their ID is in localStorage
    // so "My Profile" links to their actual profile page
    const savedCandidateId = typeof window !== "undefined"
        ? localStorage.getItem("hire_candidate_id")
        : null

    const candidateLinks = [
        {
            href: savedCandidateId ? `/candidates/${savedCandidateId}` : "/candidates/new",
            label: savedCandidateId ? "My Profile" : "Create Profile",
        },
    ]

    const links = role === "candidate" ? candidateLinks : recruiterLinks

    return (
        <nav style={{
            background: "rgba(7, 13, 26, 0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "0 2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
            position: "sticky",
            top: 0,
            zIndex: 100,
            fontFamily: "'DM Sans', sans-serif",
        }}>
            {/* Logo */}
            <Link href="/" style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                textDecoration: "none",
            }}>
                <div style={{
                    width: 24, height: 24,
                    background: "linear-gradient(135deg, #63b3ed, #4299e1)",
                    borderRadius: 5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1L9.5 5.5H12.5L10 8.5L11 12.5L7 10.5L3 12.5L4 8.5L1.5 5.5H4.5L7 1Z" fill="white" />
                    </svg>
                </div>
                <span style={{ color: "white", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.08em" }}>
                    HIRE
                </span>
            </Link>

            {/* Center links */}
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                {links.map(({ href, label }) => {
                    const active = pathname === href || pathname.startsWith(href + "/")
                    return (
                        <Link key={href} href={href} style={{
                            color: active ? "white" : "rgba(255,255,255,0.5)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            fontWeight: active ? 500 : 400,
                            padding: "0.4rem 0.85rem",
                            borderRadius: 8,
                            background: active ? "rgba(255,255,255,0.08)" : "transparent",
                            transition: "all 0.15s",
                        }}>
                            {label}
                        </Link>
                    )
                })}
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Role badge */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.3rem 0.75rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: role === "recruiter" ? "#63b3ed" : "#68d391",
                    }} />
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", textTransform: "capitalize" }}>
                        {role || "guest"}
                    </span>
                </div>

                {/* Add candidate button — recruiter only */}
                {role === "recruiter" && (
                    <Link href="/candidates/new" style={{
                        color: "white",
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        padding: "0.4rem 0.9rem",
                        borderRadius: 8,
                        background: "rgba(99,179,237,0.15)",
                        border: "1px solid rgba(99,179,237,0.3)",
                        fontWeight: 500,
                    }}>
                        + Add Candidate
                    </Link>
                )}

                {/* Switch role */}
                <button onClick={handleSwitchRole} style={{
                    color: "rgba(255,255,255,0.35)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.5rem",
                    borderRadius: 6,
                    transition: "color 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                }}>
                    Switch role
                </button>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
            `}</style>
        </nav>
    )
}