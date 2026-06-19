"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createJobRun, matchCandidates, runAgentSuite, runEmailAgent, getEmailStatusBatch, runScorecardAgent } from "@/lib/api"
import GithubReportCard from "@/components/GithubReportCard"
import ScorecardCard from "@/components/ScorecardCard"

// ── Design tokens (matching landing page dark theme) ─────────────────────────
const T = {
    bg          : "#070d1a",
    surface     : "rgba(255,255,255,0.04)",
    surfaceHover: "rgba(255,255,255,0.07)",
    border      : "rgba(255,255,255,0.09)",
    borderAccent: "rgba(99,179,237,0.3)",
    text        : "white",
    textMuted   : "rgba(255,255,255,0.45)",
    textDim     : "rgba(255,255,255,0.25)",
    blue        : "#63b3ed",
    blueDark    : "#4299e1",
    green       : "#68d391",
    purple      : "#b794f4",
    yellow      : "#f6e05e",
    red         : "#fc8181",
    font        : "'DM Sans', sans-serif",
}

function Tag({ children, color = T.blue }) {
    return (
        <span style={{
            fontSize: "0.7rem", fontWeight: 500,
            padding: "0.2rem 0.6rem",
            borderRadius: 999,
            border: `1px solid ${color}40`,
            background: `${color}15`,
            color: color,
            fontFamily: T.font,
        }}>{children}</span>
    )
}

function ScoreBadge({ score }) {
    const pct = Math.round(score * 100)
    const color = pct >= 80 ? T.green : pct >= 60 ? T.blue : T.yellow
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.2rem",
        }}>
            <div style={{
                fontSize: "1.4rem", fontWeight: 800, color,
                fontFamily: T.font, letterSpacing: "-0.02em",
                lineHeight: 1,
            }}>{pct}<span style={{ fontSize: "0.85rem", fontWeight: 500 }}>%</span></div>
            <div style={{ fontSize: "0.62rem", color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>Match</div>
        </div>
    )
}

function SectionHeader({ icon, title, subtitle, accent = T.blue }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                <h2 style={{ color: T.text, fontWeight: 700, fontSize: "1.1rem", fontFamily: T.font, margin: 0 }}>{title}</h2>
                <div style={{ flex: 1, height: 1, background: T.border, marginLeft: "0.5rem" }} />
            </div>
            {subtitle && <p style={{ color: T.textMuted, fontSize: "0.82rem", fontFamily: T.font, margin: 0, paddingLeft: "1.7rem" }}>{subtitle}</p>}
        </div>
    )
}

function Card({ children, accent = T.border, style = {} }) {
    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${accent}`,
            borderRadius: 14,
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            ...style,
        }}>
            {children}
        </div>
    )
}

function CardHeader({ children, accent = "rgba(99,179,237,0.08)" }) {
    return (
        <div style={{
            background: accent,
            borderBottom: `1px solid ${T.border}`,
            padding: "1rem 1.5rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
            {children}
        </div>
    )
}

function CardBody({ children }) {
    return <div style={{ padding: "1.25rem 1.5rem" }}>{children}</div>
}

function Spinner({ color = T.blue, label }) {
    return (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{
                width: 48, height: 48, margin: "0 auto 1.5rem",
                border: `3px solid ${T.border}`,
                borderTop: `3px solid ${color}`,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color, fontWeight: 600, fontSize: "1rem", fontFamily: T.font, margin: 0 }}>{label}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function SearchPage() {
    const [jobDescription, setJobDescription]   = useState("")
    const [availability, setAvailability]       = useState("")
    const [location, setLocation]               = useState("")
    const [experience, setExperience]           = useState("")
    const [results, setResults]                 = useState([])
    const [loading, setLoading]                 = useState(false)
    const [searched, setSearched]               = useState(false)
    const [error, setError]                     = useState("")
    const [agentResults, setAgentResults]       = useState([])
    const [agentLoading, setAgentLoading]       = useState(false)
    const [agentError, setAgentError]           = useState("")
    const [emailResults, setEmailResults]       = useState([])
    const [emailLoading, setEmailLoading]       = useState(false)
    const [emailError, setEmailError]           = useState("")
    const [emailStatuses, setEmailStatuses]     = useState([])
    const [pollingActive, setPollingActive]     = useState(false)
    const [scorecardResults, setScorecardResults] = useState([])
    const [scorecardLoading, setScorecardLoading] = useState(false)
    const [scorecardError, setScorecardError]   = useState("")
    const [jobRunId, setJobRunId]               = useState(null)
    const [selectedForEmail, setSelectedForEmail] = useState(new Set())
    const [jdFocused, setJdFocused]             = useState(false)
    const roleApplied = ""

    useEffect(() => {
        if (!pollingActive || emailResults.length === 0) return
        const sentIds = emailResults.filter(r => r.status === "sent").map(r => r.candidate_id)
        if (!sentIds.length) return
        const poll = async () => {
            const data = await getEmailStatusBatch(sentIds)
            setEmailStatuses(data.results || [])
            if ((data.results || []).every(r => r.responded)) setPollingActive(false)
        }
        poll()
        const iv = setInterval(poll, 30000)
        return () => clearInterval(iv)
    }, [pollingActive, emailResults])

    async function handleSearch() {
        if (!jobDescription.trim()) { setError("Please enter a job description."); return }
        setError(""); setLoading(true); setSearched(false); setJobRunId(null)
        setExperience("")
        setScorecardResults([]); setAgentResults([]); setEmailResults([])
        setEmailStatuses([]); setPollingActive(false)
        try {
            const data = await matchCandidates(jobDescription, availability, location, 3, experience)
            const matched = data.results || []
            setResults(matched)
            setSelectedForEmail(new Set(matched.map(c => c.id)))
            const mlScores = {}
            matched.forEach(c => { mlScores[String(c.id)] = c.match_score })
            if (matched.length > 0) {
                const jr = await createJobRun(jobDescription.slice(0, 50), jobDescription, roleApplied, availability, location, matched.map(c => c.id), mlScores)
                setJobRunId(jr.job_run_id)
            }
        } catch { setError("Something went wrong. Please try again.") }
        finally { setLoading(false); setSearched(true) }
    }

    async function handleAgentSuite() {
        setAgentLoading(true); setAgentError(""); setAgentResults([])
        try {
            const data = await runAgentSuite(results.map(c => c.id), jobDescription, roleApplied, jobRunId)
            setAgentResults(data.results || [])
        } catch { setAgentError("Agent suite failed. Please try again.") }
        finally { setAgentLoading(false) }
    }

    async function handleEmailAgent() {
        setEmailLoading(true); setEmailError(""); setEmailResults([]); setEmailStatuses([]); setPollingActive(false)
        try {
            const data = await runEmailAgent(Array.from(selectedForEmail), jobDescription, roleApplied, jobRunId)
            setEmailResults(data.results || [])
            setPollingActive(true)
        } catch { setEmailError("Email agent failed. Please try again.") }
        finally { setEmailLoading(false) }
    }

    async function handleScorecard() {
        setScorecardLoading(true); setScorecardError(""); setScorecardResults([])
        try {
            const data = await runScorecardAgent(results.map(c => c.id), jobDescription, roleApplied, jobRunId)
            setScorecardResults(data.results || [])
        } catch { setScorecardError("Scorecard agent failed. Please try again.") }
        finally { setScorecardLoading(false) }
    }

    function toggleEmail(id) {
        setSelectedForEmail(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })
    }

    const selectStyle = {
        width: "100%",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "0.65rem 1rem",
        fontSize: "0.875rem",
        color: T.text,
        fontFamily: T.font,
        outline: "none",
        cursor: "pointer",
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 70% 0%, #0d1f3c 0%, ${T.bg} 50%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 860, margin: "0 auto" }}>

                {/* ── Page Header ── */}
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.3rem 0.85rem",
                        border: `1px solid ${T.borderAccent}`,
                        borderRadius: 999,
                        background: "rgba(99,179,237,0.07)",
                        marginBottom: "1rem",
                    }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue }} />
                        <span style={{ color: T.textMuted, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                            SEMANTIC SEARCH
                        </span>
                    </div>
                    <h1 style={{ color: T.text, fontSize: "2rem", fontWeight: 800, margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
                        Find Candidates
                    </h1>
                    <p style={{ color: T.textMuted, fontSize: "0.9rem", margin: 0 }}>
                        Describe the role and the AI matching engine will surface the most relevant candidates.
                    </p>
                </div>

                {/* ── Search Panel ── */}
                <Card style={{ marginBottom: "2rem" }}>
                    <CardBody>
                        {/* JD textarea */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ display: "block", color: T.textMuted, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                                Job Description
                            </label>
                            <textarea
                                rows={5}
                                placeholder="e.g. Looking for a Python developer with experience in machine learning, NLP, and building REST APIs..."
                                value={jobDescription}
                                onChange={e => setJobDescription(e.target.value)}
                                onFocus={() => setJdFocused(true)}
                                onBlur={() => setJdFocused(false)}
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    background: "rgba(255,255,255,0.03)",
                                    border: `1px solid ${jdFocused ? T.blue : T.border}`,
                                    borderRadius: 10,
                                    padding: "0.85rem 1rem",
                                    fontSize: "0.875rem",
                                    color: T.text,
                                    fontFamily: T.font,
                                    resize: "none",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    lineHeight: 1.65,
                                }}
                            />
                        </div>

                        {/* Filters */}
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", color: T.textMuted, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Availability</label>
                                <select value={availability} onChange={e => setAvailability(e.target.value)} style={selectStyle}>
                                    <option value="">Any Availability</option>
                                    <option value="full-time">Full-time</option>
                                    <option value="freelance">Freelance</option>
                                    <option value="project-based">Project-based</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", color: T.textMuted, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Location</label>
                                <select value={location} onChange={e => setLocation(e.target.value)} style={selectStyle}>
                                    <option value="">Any Location</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="on-site">On-site</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", color: T.textMuted, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Experience</label>
                                <select value={experience} onChange={e => setExperience(e.target.value)} style={selectStyle}>
                                    <option value="">Any Experience</option>
                                    <option value="fresh">Fresh / Entry Level</option>
                                    <option value="1-2">1 – 2 years</option>
                                    <option value="2-4">2 – 4 years</option>
                                    <option value="4-6">4 – 6 years</option>
                                    <option value="6-10">6 – 10 years</option>
                                    <option value="10+">10+ years</option>
                                </select>
                            </div>
                        </div>

                        {error && <p style={{ color: T.red, fontSize: "0.83rem", marginBottom: "1rem" }}>{error}</p>}

                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            style={{
                                width: "100%",
                                background: loading ? "rgba(99,179,237,0.3)" : "linear-gradient(135deg, #4299e1, #63b3ed)",
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                padding: "0.85rem",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: T.font,
                                transition: "opacity 0.2s",
                                letterSpacing: "0.01em",
                            }}
                        >
                            {loading ? "Matching candidates..." : "Find Matching Candidates →"}
                        </button>
                    </CardBody>
                </Card>

                {/* ── Results ── */}
                {searched && (
                    <div>
                        {results.length === 0 ? (
                            <Card>
                                <CardBody>
                                    <p style={{ color: T.textMuted, textAlign: "center", padding: "2rem 0", fontSize: "0.9rem" }}>
                                        No candidates matched your filters. Try adjusting availability or location.
                                    </p>
                                </CardBody>
                            </Card>
                        ) : (
                            <>
                                <SectionHeader
                                    icon="✦"
                                    title={`${results.length} Candidates Found`}
                                    subtitle="Ranked by semantic relevance to your job description"
                                />

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                                    {results.map((c, i) => (
                                        <Card key={c.id} accent={T.border}>
                                            <CardBody>
                                                <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                                                    {/* Rank */}
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 10,
                                                        background: "rgba(99,179,237,0.1)",
                                                        border: `1px solid rgba(99,179,237,0.2)`,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        color: T.blue, fontWeight: 700, fontSize: "0.9rem",
                                                        flexShrink: 0,
                                                    }}>#{i + 1}</div>

                                                    {/* Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem", gap: "1rem" }}>
                                                            <div>
                                                                <div style={{ color: T.text, fontWeight: 600, fontSize: "1rem", marginBottom: "0.15rem" }}>{c.name}</div>
                                                                <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>{c.email}</div>
                                                            </div>
                                                            <ScoreBadge score={c.match_score} />
                                                        </div>

                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                                                            <Tag color={T.blue}>{c.availability}</Tag>
                                                            <Tag color={T.textMuted}>{c.location}</Tag>
                                                            <Tag color={T.green}>{c.years_experience} yrs exp</Tag>
                                                            {(Array.isArray(c.skills) ? c.skills : c.skills?.split(", ") || []).slice(0, 5).map(s => (
                                                                <Tag key={s} color={T.textDim}>{s}</Tag>
                                                            ))}
                                                        </div>

                                                        <p style={{ color: T.textMuted, fontSize: "0.82rem", lineHeight: 1.6, margin: "0 0 0.6rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                            {c.resume_text}
                                                        </p>

                                                        <Link href={`/candidates/${c.id}`} style={{ color: T.blue, fontSize: "0.8rem", textDecoration: "none" }}>
                                                            View profile →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>

                                {/* ── GitHub Agent Button ── */}
                                {!agentLoading && agentResults.length === 0 && (
                                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                                        {agentError && <p style={{ color: T.red, fontSize: "0.83rem", marginBottom: "0.75rem" }}>{agentError}</p>}
                                        <button onClick={handleAgentSuite} style={{
                                            background: "linear-gradient(135deg, rgba(183,148,244,0.2), rgba(183,148,244,0.1))",
                                            border: `1px solid rgba(183,148,244,0.35)`,
                                            color: T.purple, borderRadius: 12,
                                            padding: "0.85rem 2.5rem",
                                            fontSize: "0.9rem", fontWeight: 600,
                                            cursor: "pointer", fontFamily: T.font,
                                            transition: "all 0.2s",
                                        }}>
                                            ⚙️ Invoke Agent Suite — Analyze GitHub Profiles
                                        </button>
                                        <p style={{ color: T.textDim, fontSize: "0.75rem", marginTop: "0.5rem" }}>
                                            Crawls and analyzes GitHub profiles for all {results.length} candidates
                                        </p>
                                    </div>
                                )}

                                {/* GitHub Loading */}
                                {agentLoading && <Spinner color={T.purple} label="Agents are analyzing GitHub profiles..." />}

                                {/* GitHub Results */}
                                {agentResults.length > 0 && (
                                    <div style={{ marginBottom: "2rem" }}>
                                        <SectionHeader
                                            icon="⚙️"
                                            title="GitHub Analysis Reports"
                                            subtitle="AI agents crawled each candidate's GitHub profile"
                                            accent={T.purple}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {agentResults.map(r => (
                                                <GithubReportCard key={r.candidate_id} result={r} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Email Agent Section ── */}
                                {agentResults.length > 0 && !emailLoading && emailResults.length === 0 && (
                                    <div style={{ marginBottom: "2rem" }}>
                                        <SectionHeader icon="✉️" title="Send HR Screening Emails" subtitle="Select which candidates you want to contact" accent={T.green} />
                                        <Card accent="rgba(104,211,145,0.15)" style={{ marginBottom: "1rem" }}>
                                            <CardBody>
                                                {results.map(c => (
                                                    <label key={c.id} style={{
                                                        display: "flex", alignItems: "center", gap: "0.85rem",
                                                        padding: "0.65rem 0.5rem", cursor: "pointer",
                                                        borderBottom: `1px solid ${T.border}`,
                                                    }}>
                                                        <input type="checkbox"
                                                            checked={selectedForEmail.has(c.id)}
                                                            onChange={() => toggleEmail(c.id)}
                                                            style={{ accentColor: T.green, width: 15, height: 15, cursor: "pointer" }}
                                                        />
                                                        <span style={{ color: T.text, fontWeight: 500, fontSize: "0.875rem", flex: 1 }}>{c.name}</span>
                                                        <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>{c.email}</span>
                                                        <Tag color={T.blue}>{Math.round(c.match_score * 100)}% match</Tag>
                                                    </label>
                                                ))}
                                            </CardBody>
                                        </Card>

                                        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                                            <button onClick={() => setSelectedForEmail(new Set(results.map(c => c.id)))}
                                                style={{ color: T.blue, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, padding: 0 }}>
                                                Select all
                                            </button>
                                            <button onClick={() => setSelectedForEmail(new Set())}
                                                style={{ color: T.textDim, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, padding: 0 }}>
                                                Deselect all
                                            </button>
                                        </div>

                                        {emailError && <p style={{ color: T.red, fontSize: "0.83rem", marginBottom: "0.75rem" }}>{emailError}</p>}

                                        <button onClick={handleEmailAgent}
                                            disabled={selectedForEmail.size === 0}
                                            style={{
                                                background: selectedForEmail.size === 0 ? "rgba(104,211,145,0.1)" : "linear-gradient(135deg, rgba(104,211,145,0.25), rgba(104,211,145,0.15))",
                                                border: `1px solid rgba(104,211,145,${selectedForEmail.size === 0 ? "0.1" : "0.4"})`,
                                                color: selectedForEmail.size === 0 ? T.textDim : T.green,
                                                borderRadius: 12, padding: "0.85rem 2rem",
                                                fontSize: "0.9rem", fontWeight: 600,
                                                cursor: selectedForEmail.size === 0 ? "not-allowed" : "pointer",
                                                fontFamily: T.font, transition: "all 0.2s",
                                            }}>
                                            ✉️ Send to {selectedForEmail.size} Candidate{selectedForEmail.size !== 1 ? "s" : ""}
                                        </button>
                                    </div>
                                )}

                                {emailLoading && <Spinner color={T.green} label="Sending personalized screening emails..." />}

                                {/* Email Results */}
                                {emailResults.length > 0 && (
                                    <div style={{ marginBottom: "2rem" }}>
                                        <SectionHeader icon="✉️" title="HR Email Status" subtitle="Personalized screening emails sent to shortlisted candidates" accent={T.green} />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {emailResults.map(r => (
                                                <Card key={r.candidate_id} accent="rgba(104,211,145,0.15)">
                                                    <CardHeader accent="rgba(104,211,145,0.06)">
                                                        <div>
                                                            <span style={{ color: T.text, fontWeight: 600 }}>{r.name}</span>
                                                            <span style={{ color: T.textMuted, fontSize: "0.8rem", marginLeft: "0.6rem" }}>{r.email}</span>
                                                        </div>
                                                        <Tag color={r.status === "sent" ? T.green : r.status === "skipped" ? T.yellow : T.red}>
                                                            {r.status === "sent" ? "✅ Sent" : r.status === "skipped" ? "⚠️ Skipped" : "❌ Failed"}
                                                        </Tag>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <pre style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7, background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: 8, margin: 0 }}>
                                                            {r.message}
                                                        </pre>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Response Statuses */}
                                {emailStatuses.length > 0 && (
                                    <div style={{ marginBottom: "2rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                            <SectionHeader icon="📬" title="Candidate Responses" subtitle="" accent={T.blue} />
                                            {pollingActive && (
                                                <span style={{ color: T.textDim, fontSize: "0.75rem", animation: "pulse 2s infinite" }}>
                                                    ● Checking for replies every 30s...
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {emailStatuses.map(c => (
                                                <Card key={c.candidate_id} accent={c.responded ? "rgba(104,211,145,0.2)" : T.border}>
                                                    <CardHeader accent={c.responded ? "rgba(104,211,145,0.06)" : T.surface}>
                                                        <div>
                                                            <span style={{ color: T.text, fontWeight: 600 }}>{c.name}</span>
                                                            <span style={{ color: T.textMuted, fontSize: "0.8rem", marginLeft: "0.6rem" }}>{c.email}</span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                            {c.responded_at && (
                                                                <span style={{ color: T.textDim, fontSize: "0.75rem" }}>
                                                                    {new Date(c.responded_at).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <Tag color={c.responded ? T.green : T.yellow}>
                                                                {c.responded ? "✅ Responded" : "⏳ Pending"}
                                                            </Tag>
                                                        </div>
                                                    </CardHeader>
                                                    {c.responded && c.response && (
                                                        <CardBody>
                                                            <p style={{ color: T.textDim, fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Candidate Reply</p>
                                                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.83rem", lineHeight: 1.7, background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: 8, margin: 0, whiteSpace: "pre-wrap" }}>
                                                                {c.response}
                                                            </p>
                                                        </CardBody>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Scorecard Button ── */}
                                {agentResults.length > 0 && !scorecardLoading && scorecardResults.length === 0 && (
                                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                                        {scorecardError && <p style={{ color: T.red, fontSize: "0.83rem", marginBottom: "0.75rem" }}>{scorecardError}</p>}
                                        <button onClick={handleScorecard} style={{
                                            background: "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(99,179,237,0.1))",
                                            border: `1px solid rgba(99,179,237,0.35)`,
                                            color: T.blue, borderRadius: 12,
                                            padding: "0.85rem 2.5rem",
                                            fontSize: "0.9rem", fontWeight: 600,
                                            cursor: "pointer", fontFamily: T.font,
                                        }}>
                                            📊 Generate Final Hiring Reports
                                        </button>
                                        <p style={{ color: T.textDim, fontSize: "0.75rem", marginTop: "0.5rem" }}>
                                            Synthesizes ML score + GitHub analysis into a complete hiring decision
                                        </p>
                                    </div>
                                )}

                                {scorecardLoading && <Spinner color={T.blue} label="Generating hiring reports..." />}

                                {/* Scorecard Results */}
                                {scorecardResults.length > 0 && (
                                    <div style={{ marginBottom: "2rem" }}>
                                        <SectionHeader icon="📊" title="Final Hiring Reports" subtitle="AI-generated hiring decisions based on all available signals" accent={T.blue} />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {scorecardResults.map(r => (
                                                <ScorecardCard key={r.candidate_id} result={r} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                    select option { background: #0d1f3c; color: white; }
                `}</style>
            </div>
        </div>
    )
}