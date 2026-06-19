"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getAllCandidates, searchCandidates, deleteCandidate } from "@/lib/api"
import CandidateCard from "@/components/CandidateCard"

const T = {
    bg       : "#070d1a",
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.22)",
    blue     : "#63b3ed",
    green    : "#68d391",
    font     : "'DM Sans', sans-serif",
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState([])
    const [search, setSearch]         = useState("")
    const [loading, setLoading]       = useState(true)
    const [searchFocused, setSearchFocused] = useState(false)

    useEffect(() => { loadCandidates() }, [])

    async function loadCandidates() {
        setLoading(true)
        const data = await getAllCandidates()
        setCandidates(data)
        setLoading(false)
    }

    async function handleSearch(e) {
        const value = e.target.value
        setSearch(value)
        if (value.trim() === "") {
            loadCandidates()
        } else {
            const results = await searchCandidates(value)
            setCandidates(results)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Delete this candidate?")) return
        await deleteCandidate(id)
        loadCandidates()
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 80% 0%, #0d1f3c 0%, ${T.bg} 50%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

                {/* Header row */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: "2.5rem",
                    flexWrap: "wrap", gap: "1rem",
                }}>
                    <div>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.3rem 0.85rem",
                            border: "1px solid rgba(99,179,237,0.25)",
                            borderRadius: 999,
                            background: "rgba(99,179,237,0.07)",
                            marginBottom: "0.85rem",
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue }} />
                            <span style={{ color: T.textMuted, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                                TALENT POOL
                            </span>
                        </div>
                        <h1 style={{
                            color: T.text, fontSize: "1.9rem", fontWeight: 800,
                            margin: 0, letterSpacing: "-0.02em",
                        }}>
                            All Candidates
                            {!loading && (
                                <span style={{
                                    marginLeft: "0.75rem",
                                    fontSize: "1rem", fontWeight: 500,
                                    color: T.textMuted,
                                }}>
                                    ({candidates.length})
                                </span>
                            )}
                        </h1>
                    </div>

                    {/* Right side — search + add button */}
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        {/* Search input */}
                        <div style={{ position: "relative" }}>
                            <svg style={{
                                position: "absolute", left: "0.75rem", top: "50%",
                                transform: "translateY(-50%)",
                                color: T.textDim, pointerEvents: "none",
                            }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by skill..."
                                value={search}
                                onChange={handleSearch}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                style={{
                                    background: T.surface,
                                    border: `1px solid ${searchFocused ? T.blue : T.border}`,
                                    borderRadius: 10,
                                    padding: "0.6rem 1rem 0.6rem 2.25rem",
                                    fontSize: "0.85rem",
                                    color: T.text,
                                    fontFamily: T.font,
                                    outline: "none",
                                    width: 220,
                                    transition: "border-color 0.2s",
                                }}
                            />
                        </div>

                        {/* Add candidate */}
                        <Link href="/candidates/new" style={{
                            display: "inline-flex", alignItems: "center", gap: "0.4rem",
                            background: "linear-gradient(135deg, rgba(104,211,145,0.2), rgba(104,211,145,0.1))",
                            border: "1px solid rgba(104,211,145,0.35)",
                            color: T.green,
                            padding: "0.6rem 1.1rem",
                            borderRadius: 10,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            fontFamily: T.font,
                            whiteSpace: "nowrap",
                        }}>
                            + Add Candidate
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "5rem 0" }}>
                        <div style={{
                            width: 40, height: 40, margin: "0 auto 1rem",
                            border: `3px solid rgba(99,179,237,0.15)`,
                            borderTop: `3px solid ${T.blue}`,
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }} />
                        <p style={{ color: T.textMuted, fontSize: "0.875rem" }}>Loading candidates...</p>
                    </div>
                ) : candidates.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "5rem 2rem",
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 16,
                    }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👤</div>
                        <p style={{ color: T.textMuted, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                            {search ? "No candidates match your search." : "No candidates in the pool yet."}
                        </p>
                        {!search && (
                            <Link href="/candidates/new" style={{
                                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                                background: "rgba(99,179,237,0.1)",
                                border: "1px solid rgba(99,179,237,0.25)",
                                color: T.blue,
                                padding: "0.65rem 1.5rem",
                                borderRadius: 10,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                fontFamily: T.font,
                            }}>
                                + Add the first candidate
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "1rem",
                    }}>
                        {candidates.map(c => (
                            <CandidateCard key={c.id} candidate={c} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                ::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}