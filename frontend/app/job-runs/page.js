"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getAllJobRuns, deleteJobRun } from "@/lib/api"

const T = {
    bg       : "#070d1a",
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.22)",
    blue     : "#63b3ed",
    green    : "#68d391",
    yellow   : "#f6e05e",
    red      : "#fc8181",
    font     : "'DM Sans', sans-serif",
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    })
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
    })
}

export default function JobRunsPage() {
    const [jobRuns, setJobRuns] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        const data = await getAllJobRuns()
        setJobRuns(data.job_runs || [])
        setLoading(false)
    }

    async function handleDelete(id, title) {
        if (!confirm(`Delete job run "${title}"? This cannot be undone.`)) return
        setDeletingId(id)
        try {
            await deleteJobRun(id)
            setJobRuns(prev => prev.filter(r => r.id !== id))
        } catch (e) {
            alert("Failed to delete job run. Please try again.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 20% 0%, #0d1f3c 0%, ${T.bg} 55%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 860, margin: "0 auto" }}>

                {/* Header */}
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
                                HISTORY
                            </span>
                        </div>
                        <h1 style={{
                            color: T.text, fontSize: "1.9rem", fontWeight: 800,
                            margin: "0 0 0.3rem", letterSpacing: "-0.02em",
                        }}>
                            Job Runs
                        </h1>
                        <p style={{ color: T.textMuted, fontSize: "0.875rem", margin: 0 }}>
                            Previous candidate searches and their agent results
                        </p>
                    </div>

                    <Link href="/search" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "linear-gradient(135deg, #4299e1, #63b3ed)",
                        color: "white",
                        padding: "0.7rem 1.5rem",
                        borderRadius: 10,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        fontFamily: T.font,
                    }}>
                        + Run New Job
                    </Link>
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
                        <p style={{ color: T.textMuted, fontSize: "0.875rem" }}>Loading job runs...</p>
                    </div>

                ) : jobRuns.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "5rem 2rem",
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 16,
                    }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
                        <p style={{ color: T.textMuted, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                            No job runs yet. Run your first candidate search to get started.
                        </p>
                        <Link href="/search" style={{
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
                            Start your first search →
                        </Link>
                    </div>

                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {jobRuns.map((run) => (
                            <div key={run.id} style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 14,
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1rem",
                                backdropFilter: "blur(8px)",
                                transition: "border-color 0.2s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,179,237,0.25)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                            >
                                {/* Left — icon + info */}
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: 0 }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                                        background: "rgba(99,179,237,0.1)",
                                        border: "1px solid rgba(99,179,237,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.1rem",
                                    }}>
                                        🔍
                                    </div>

                                    {/* Title + meta */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            color: T.text, fontWeight: 600, fontSize: "0.95rem",
                                            marginBottom: "0.3rem",
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                        }}>
                                            {run.job_title}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                            <span style={{ color: T.textDim, fontSize: "0.78rem" }}>
                                                {formatDate(run.created_at)} · {formatTime(run.created_at)}
                                            </span>
                                            <span style={{
                                                fontSize: "0.7rem", fontWeight: 500,
                                                padding: "0.18rem 0.6rem",
                                                borderRadius: 999,
                                                border: `1px solid ${run.status === "completed" ? "rgba(104,211,145,0.3)" : "rgba(246,224,94,0.3)"}`,
                                                background: run.status === "completed" ? "rgba(104,211,145,0.1)" : "rgba(246,224,94,0.1)",
                                                color: run.status === "completed" ? T.green : T.yellow,
                                            }}>
                                                {run.status === "completed" ? "✓ Completed" : "⏳ In Progress"}
                                            </span>
                                            {run.candidate_count !== undefined && (
                                                <span style={{ color: T.textDim, fontSize: "0.75rem" }}>
                                                    {run.candidate_count} candidate{run.candidate_count !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right — actions */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                                    <Link href={`/job-runs/${run.id}`} style={{
                                        color: T.blue, fontSize: "0.82rem",
                                        textDecoration: "none", fontWeight: 500,
                                        padding: "0.4rem 0.9rem",
                                        border: "1px solid rgba(99,179,237,0.25)",
                                        borderRadius: 8,
                                        background: "rgba(99,179,237,0.07)",
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                    }}>
                                        View Results →
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(run.id, run.job_title)}
                                        disabled={deletingId === run.id}
                                        style={{
                                            background: "none",
                                            border: "1px solid rgba(252,129,129,0.15)",
                                            borderRadius: 8,
                                            padding: "0.4rem 0.75rem",
                                            cursor: deletingId === run.id ? "not-allowed" : "pointer",
                                            color: "rgba(252,129,129,0.4)",
                                            fontSize: "0.78rem",
                                            fontFamily: T.font,
                                            transition: "all 0.15s",
                                            opacity: deletingId === run.id ? 0.5 : 1,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = T.red
                                            e.currentTarget.style.borderColor = "rgba(252,129,129,0.4)"
                                            e.currentTarget.style.background = "rgba(252,129,129,0.07)"
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = "rgba(252,129,129,0.4)"
                                            e.currentTarget.style.borderColor = "rgba(252,129,129,0.15)"
                                            e.currentTarget.style.background = "none"
                                        }}
                                    >
                                        {deletingId === run.id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}