"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getJobRun, setDisposition, closeJobRun } from "@/lib/api"
import ScorecardCard from "@/components/ScorecardCard"
import GithubReportCard from "@/components/GithubReportCard"

function parseHiringReport(raw) {
    if (!raw) return { parsed: false, data: null }
    if (typeof raw === "object") return { parsed: true, data: raw }
    try {
        let text = raw.trim()
        if (text.startsWith("```") ) {
            text = text.split("```")[1]
            if (text.startsWith("json")) text = text.slice(4)
        }
        return { parsed: true, data: JSON.parse(text.trim()) }
    } catch {
        return { parsed: false, data: raw }
    }
}

function parseGithubReport(raw) {
    if (!raw) return { parsed: false, data: null }
    if (typeof raw === "object") return { parsed: true, data: raw }
    try {
        let text = raw.trim()
        if (text.startsWith("```") ) {
            text = text.split("```")[1]
            if (text.startsWith("json")) text = text.slice(4)
        }
        return { parsed: true, data: JSON.parse(text.trim()) }
    } catch {
        return { parsed: false, data: raw }
    }
}

const T = {
    bg       : "#070d1a",
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.22)",
    blue     : "#63b3ed",
    green    : "#68d391",
    purple   : "#b794f4",
    yellow   : "#f6e05e",
    indigo   : "#90cdf4",
    red      : "#fc8181",
    orange   : "#fbd38d",
    font     : "'DM Sans', sans-serif",
}

function Tag({ children, color = T.blue }) {
    return (
        <span style={{
            fontSize: "0.7rem", fontWeight: 500,
            padding: "0.22rem 0.65rem", borderRadius: 999,
            border: `1px solid ${color}40`, background: `${color}15`,
            color, fontFamily: T.font,
        }}>{children}</span>
    )
}

function ExpandSection({ label, color, isOpen, onToggle, children }) {
    return (
        <div>
            <button onClick={onToggle} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "none", border: "none", cursor: "pointer",
                color, fontSize: "0.82rem", fontWeight: 600,
                fontFamily: T.font, padding: 0,
            }}>
                <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 18, height: 18, borderRadius: 5,
                    border: `1px solid ${color}40`, background: `${color}15`,
                    fontSize: "0.6rem", transition: "transform 0.2s",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}>▶</span>
                {label}
            </button>
            {isOpen && <div style={{ marginTop: "0.75rem" }}>{children}</div>}
        </div>
    )
}

const DISPOSITION_CONFIG = {
    hired: { label: "Hired", color: T.green, bg: "rgba(104,211,145,0.15)", border: "rgba(104,211,145,0.4)" },
    consider_later: { label: "Consider Later", color: T.yellow, bg: "rgba(246,224,94,0.15)", border: "rgba(246,224,94,0.4)" },
    not_a_fit: { label: "Not a Fit", color: T.red, bg: "rgba(252,129,129,0.15)", border: "rgba(252,129,129,0.4)" },
}

export default function JobRunDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [data, setData] = useState(null)
    const [expanded, setExpanded] = useState({})
    const [dispositions, setDispositions] = useState({})
    const [saving, setSaving] = useState({})
    const [closing, setClosing] = useState(false)
    const [closed, setClosed] = useState(false)
    const [closeError, setCloseError] = useState("")

    useEffect(() => {
        if (!id) return
        getJobRun(id).then(d => {
            setData(d)
            const saved = {}
            ;(d.candidates || []).forEach(c => {
                if (c.disposition) saved[c.candidate_id] = c.disposition
            })
            setDispositions(saved)
            if (d.job_run?.status === "completed") setClosed(true)
        })
    }, [id])

    function toggle(candidateId, section) {
        const key = `${candidateId}-${section}`
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function isOpen(candidateId, section) {
        return !!expanded[`${candidateId}-${section}`]
    }

    async function handleDisposition(candidateId, disposition) {
        if (closed) return
        setSaving(prev => ({ ...prev, [candidateId]: true }))
        try {
            await setDisposition(id, candidateId, disposition)
            setDispositions(prev => ({ ...prev, [candidateId]: disposition }))
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(prev => ({ ...prev, [candidateId]: false }))
        }
    }

    async function handleCloseJobRun() {
        if (closing || closed || !allDisposed) return
        setClosing(true)
        setCloseError("")
        try {
            const dispositionList = Object.entries(dispositions).map(([candidateId, disposition]) => ({
                candidate_id: parseInt(candidateId),
                disposition,
            }))
            await closeJobRun(id, dispositionList)
            setClosed(true)
            const d = await getJobRun(id)
            setData(d)
        } catch (e) {
            setCloseError("Failed to close job run. Please try again.")
        } finally {
            setClosing(false)
        }
    }

    if (!data) return (
        <div style={{
            minHeight: "100vh", background: T.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.font,
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: 40, height: 40, margin: "0 auto 1rem",
                    border: `3px solid rgba(99,179,237,0.15)`,
                    borderTop: `3px solid ${T.blue}`,
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: T.textMuted, fontSize: "0.875rem" }}>Loading job run...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )

    const { job_run, candidates } = data
    const hiredCount = Object.values(dispositions).filter(d => d === "hired").length
    const allDisposed = candidates.length > 0 && candidates.every(c => dispositions[c.candidate_id])

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 50% 0%, #0d1f3c 0%, ${T.bg} 55%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 860, margin: "0 auto" }}>

                <button onClick={() => router.back()} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: T.textMuted, fontSize: "0.83rem",
                    fontFamily: T.font, padding: 0, marginBottom: "2rem",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                }}>
                    ← Back to Job Runs
                </button>

                <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16, padding: "1.75rem 2rem",
                    marginBottom: "2rem", backdropFilter: "blur(8px)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <h1 style={{ color: T.text, fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
                                {job_run.job_title}
                            </h1>
                            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>{job_run.role_applied}</span>
                                <span style={{ color: T.textDim, fontSize: "0.8rem" }}>·</span>
                                <span style={{ color: T.textDim, fontSize: "0.8rem" }}>{new Date(job_run.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                        <Tag color={closed || job_run.status === "completed" ? T.green : T.yellow}>
                            {closed || job_run.status === "completed" ? "✓ Completed" : "⏳ In Progress"}
                        </Tag>
                    </div>
                    <div style={{ height: 1, background: T.border, margin: "1rem 0" }} />
                    <p style={{ color: T.textMuted, fontSize: "0.85rem", lineHeight: 1.75, margin: 0 }}>
                        {job_run.job_description}
                    </p>
                    {(job_run.availability || job_run.location) && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                            {job_run.availability && <Tag color={T.blue}>{job_run.availability}</Tag>}
                            {job_run.location && <Tag color={T.textMuted}>{job_run.location}</Tag>}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                    <span style={{ color: T.textDim, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                        Shortlisted Candidates
                    </span>
                    <span style={{
                        fontSize: "0.72rem", padding: "0.15rem 0.55rem",
                        borderRadius: 999, background: "rgba(99,179,237,0.1)",
                        border: "1px solid rgba(99,179,237,0.2)", color: T.blue,
                    }}>{candidates.length}</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                    {candidates.map((c, index) => {
                        const currentDisposition = dispositions[c.candidate_id]
                        const isSaving = saving[c.candidate_id]

                        return (
                            <div key={c.candidate_id} style={{
                                background: T.surface,
                                border: `1px solid ${currentDisposition === "hired" ? "rgba(104,211,145,0.3)" : T.border}`,
                                borderRadius: 14, overflow: "hidden",
                                backdropFilter: "blur(8px)",
                                transition: "border-color 0.3s",
                            }}>
                                <div style={{
                                    padding: "1rem 1.5rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderBottom: `1px solid ${T.border}`,
                                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{
                                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                            background: "rgba(99,179,237,0.1)",
                                            border: "1px solid rgba(99,179,237,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: T.blue, fontSize: "0.75rem", fontWeight: 700,
                                        }}>#{index + 1}</span>
                                        <div>
                                            <span style={{ color: T.text, fontWeight: 600, fontSize: "0.95rem" }}>{c.candidate_name}</span>
                                            <span style={{ color: T.textMuted, fontSize: "0.8rem", marginLeft: "0.6rem" }}>{c.candidate_email}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                        <Tag color={!c.email_sent ? T.textDim : c.email_response ? T.green : T.yellow}>
                                            {!c.email_sent ? "Email Not Sent" : c.email_response ? "Responded" : "Pending"}
                                        </Tag>
                                        <Tag color={Math.round(c.ml_score * 100) >= 80 ? T.green : Math.round(c.ml_score * 100) >= 60 ? T.blue : T.yellow}>
                                            {Math.round(c.ml_score * 100)}% match
                                        </Tag>
                                    </div>
                                </div>

                                <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <ExpandSection
                                        label="GitHub Analysis"
                                        color={T.purple}
                                        isOpen={isOpen(c.candidate_id, "github")}
                                        onToggle={() => toggle(c.candidate_id, "github")}
                                    >
                                        {(() => {
                                            if (!c.github_report) return (
                                                <p style={{ color: T.textDim, fontSize: "0.82rem" }}>GitHub analysis not yet run.</p>
                                            )
                                            const parsed = parseGithubReport(c.github_report)
                                            return <GithubReportCard result={{
                                                parsed: parsed.parsed,
                                                report: parsed.data,
                                                name: c.candidate_name,
                                                github_url: null,
                                                github_username: null,
                                            }} />
                                        })()}
                                    </ExpandSection>

                                    <div style={{ height: 1, background: T.border }} />

                                    {c.email_response ? (
                                        <ExpandSection
                                            label="Candidate Reply"
                                            color={T.green}
                                            isOpen={isOpen(c.candidate_id, "email")}
                                            onToggle={() => toggle(c.candidate_id, "email")}
                                        >
                                            {c.responded_at && (
                                                <p style={{ color: T.textDim, fontSize: "0.72rem", marginBottom: "0.5rem" }}>
                                                    Responded {new Date(c.responded_at).toLocaleString()}
                                                </p>
                                            )}
                                            <p style={{
                                                color: "rgba(255,255,255,0.7)", fontSize: "0.83rem",
                                                lineHeight: 1.75, background: "rgba(0,0,0,0.25)",
                                                padding: "1rem", borderRadius: 8, margin: 0,
                                                border: "1px solid rgba(104,211,145,0.15)", whiteSpace: "pre-wrap",
                                            }}>{c.email_response}</p>
                                        </ExpandSection>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span style={{ color: T.textDim, fontSize: "0.8rem" }}>Candidate Reply:</span>
                                            <Tag color={c.email_sent ? T.yellow : T.textDim}>
                                                {c.email_sent ? "Awaiting response" : "Email not sent yet"}
                                            </Tag>
                                        </div>
                                    )}

                                    <div style={{ height: 1, background: T.border }} />

                                    <ExpandSection
                                        label="Final Hiring Report"
                                        color={T.indigo}
                                        isOpen={isOpen(c.candidate_id, "report")}
                                        onToggle={() => toggle(c.candidate_id, "report")}
                                    >
                                        {(() => {
                                            if (!c.hiring_report) return (
                                                <p style={{ color: T.textDim, fontSize: "0.82rem" }}>
                                                    Hiring report not yet generated.
                                                </p>
                                            )
                                            const parsed = parseHiringReport(c.hiring_report)
                                            return <ScorecardCard result={{
                                                parsed: parsed.parsed,
                                                report: parsed.data,
                                                name: c.candidate_name,
                                                ml_score: Math.round(c.ml_score * 100),
                                            }} />
                                        })()}
                                    </ExpandSection>

                                    <div style={{ height: 1, background: T.border }} />

                                    <div>
                                        <p style={{
                                            color: T.textDim, fontSize: "0.72rem",
                                            letterSpacing: "0.08em", textTransform: "uppercase",
                                            marginBottom: "0.75rem", fontWeight: 600,
                                        }}>
                                            {closed ? "Decision" : "Recruiter Decision"}
                                        </p>
                                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                            {Object.entries(DISPOSITION_CONFIG).map(([key, config]) => {
                                                const isSelected = currentDisposition === key
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleDisposition(c.candidate_id, key)}
                                                        disabled={closed || isSaving}
                                                        style={{
                                                            padding: "0.5rem 1.1rem",
                                                            borderRadius: 10,
                                                            fontSize: "0.82rem",
                                                            fontWeight: isSelected ? 600 : 400,
                                                            fontFamily: T.font,
                                                            cursor: closed ? "default" : "pointer",
                                                            transition: "all 0.2s",
                                                            border: `1px solid ${isSelected ? config.border : "rgba(255,255,255,0.1)"}`,
                                                            background: isSelected ? config.bg : "rgba(255,255,255,0.03)",
                                                            color: isSelected ? config.color : T.textMuted,
                                                            opacity: closed && !isSelected ? 0.3 : 1,
                                                        }}
                                                    >
                                                        {isSaving && isSelected ? "Saving..." : config.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {!closed ? (
                    <div style={{
                        background: "rgba(99,179,237,0.05)",
                        border: "1px solid rgba(99,179,237,0.2)",
                        borderRadius: 14, padding: "1.5rem 2rem",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", gap: "1rem", flexWrap: "wrap",
                    }}>
                        <div>
                            <p style={{ color: T.text, fontWeight: 600, fontSize: "0.95rem", margin: "0 0 0.3rem" }}>
                                Ready to close this job run?
                            </p>
                            <p style={{ color: T.textMuted, fontSize: "0.82rem", margin: 0 }}>
                                {hiredCount > 0
                                    ? `${hiredCount} candidate${hiredCount > 1 ? "s" : ""} marked as hired - they'll be excluded from future searches.`
                                    : "Select a decision for each candidate before closing."}
                            </p>
                            {!allDisposed && (
                                <p style={{ color: T.yellow, fontSize: "0.8rem", marginTop: "0.5rem" }}>
                                    Complete a disposition for every candidate before closing.
                                </p>
                            )}
                            {closeError && <p style={{ color: T.red, fontSize: "0.8rem", marginTop: "0.5rem" }}>{closeError}</p>}
                        </div>
                        <button
                            onClick={handleCloseJobRun}
                            disabled={closing || !allDisposed}
                            style={{
                                background: closing || !allDisposed ? "rgba(99,179,237,0.1)" : "linear-gradient(135deg, #4299e1, #63b3ed)",
                                border: "none",
                                color: "white",
                                padding: "0.75rem 1.75rem",
                                borderRadius: 10,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                cursor: closing || !allDisposed ? "not-allowed" : "pointer",
                                fontFamily: T.font,
                                transition: "all 0.2s",
                                flexShrink: 0,
                            }}
                        >
                            {closing ? "Closing..." : allDisposed ? "Close Job Run" : "Select All Decisions"}
                        </button>
                    </div>
                ) : (
                    <div style={{
                        background: "rgba(104,211,145,0.07)",
                        border: "1px solid rgba(104,211,145,0.25)",
                        borderRadius: 14, padding: "1.5rem 2rem",
                        display: "flex", alignItems: "center", gap: "1rem",
                    }}>
                        <span style={{ fontSize: "1.5rem" }}>✅</span>
                        <div>
                            <p style={{ color: T.green, fontWeight: 600, fontSize: "0.95rem", margin: "0 0 0.2rem" }}>
                                Job Run Closed
                            </p>
                            <p style={{ color: T.textMuted, fontSize: "0.82rem", margin: 0 }}>
                                {hiredCount > 0
                                    ? `${hiredCount} candidate${hiredCount > 1 ? "s" : ""} hired and removed from the active talent pool.`
                                    : "This job run has been completed. All decisions are saved."}
                            </p>
                        </div>
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
