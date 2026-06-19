const T = {
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.22)",
    blue     : "#63b3ed",
    green    : "#68d391",
    purple   : "#b794f4",
    yellow   : "#f6e05e",
    orange   : "#fbd38d",
    red      : "#fc8181",
    font     : "'DM Sans', sans-serif",
}

const RELEVANCE = {
    "HIGH"  : { color: T.green,  bg: "rgba(104,211,145,0.1)",  border: "rgba(104,211,145,0.25)" },
    "MEDIUM": { color: T.yellow, bg: "rgba(246,224,94,0.1)",   border: "rgba(246,224,94,0.25)"  },
    "LOW"   : { color: T.textDim, bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
}

export default function GithubReportCard({ result }) {
    // Normalize field names — search page may send `scorecard`, other pages send `report`
    const normalizedResult = {
        ...result,
        report: result.report || result.scorecard,
        parsed: result.parsed ?? (typeof result.scorecard === "object"),
    }

    const report = normalizedResult.report
    const parsed = normalizedResult.parsed
    const name = normalizedResult.name
    const ghUrl = normalizedResult.github_url
    const ghUser = normalizedResult.github_username
    const error = normalizedResult.error

    // Fallback — no data or parse failed
    if (!parsed || !report || typeof report === "string") {
        return (
            <div style={{
                background: T.surface,
                border: `1px solid rgba(183,148,244,0.2)`,
                borderRadius: 14,
                overflow: "hidden",
                fontFamily: T.font,
            }}>
                <div style={{
                    background: "rgba(183,148,244,0.07)",
                    borderBottom: `1px solid ${T.border}`,
                    padding: "1rem 1.5rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <div>
                        <span style={{ color: T.text, fontWeight: 600 }}>{name}</span>
                        {ghUrl && (
                            <a href={ghUrl} target="_blank" rel="noopener noreferrer"
                                style={{ color: T.purple, fontSize: "0.8rem", textDecoration: "none", marginLeft: "0.6rem" }}>
                                @{ghUser} ↗
                            </a>
                        )}
                    </div>
                    <span style={{
                        fontSize: "0.7rem", fontWeight: 500,
                        padding: "0.22rem 0.65rem", borderRadius: 999,
                        border: "1px solid rgba(183,148,244,0.3)",
                        background: "rgba(183,148,244,0.1)",
                        color: T.purple,
                    }}>GitHub Analysis</span>
                </div>
                <div style={{ padding: "1.25rem 1.5rem" }}>
                    {error ? (
                        <p style={{ color: T.red, fontSize: "0.83rem", margin: 0 }}>{error}</p>
                    ) : (
                        <pre style={{
                            color: "rgba(255,255,255,0.65)", fontSize: "0.78rem",
                            whiteSpace: "pre-wrap", fontFamily: "monospace",
                            lineHeight: 1.7, background: "rgba(0,0,0,0.2)",
                            padding: "1rem", borderRadius: 8, margin: 0,
                        }}>{typeof report === "string" ? report : "Report unavailable"}</pre>
                    )}
                </div>
            </div>
        )
    }

    const r = report

    return (
        <div style={{
            background: T.surface,
            border: `1px solid rgba(183,148,244,0.2)`,
            borderRadius: 16,
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            fontFamily: T.font,
        }}>
            {/* ── Header ── */}
            <div style={{
                background: "rgba(183,148,244,0.07)",
                borderBottom: `1px solid ${T.border}`,
                padding: "1.25rem 1.5rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem" }}>
                        <span style={{ color: T.text, fontWeight: 700, fontSize: "1.05rem" }}>
                                {name}
                        </span>
                            {ghUrl && (
                                <a href={ghUrl} target="_blank" rel="noopener noreferrer"
                                style={{
                                    color: T.purple, fontSize: "0.8rem", textDecoration: "none",
                                    display: "flex", alignItems: "center", gap: "0.25rem",
                                }}>
                                    @{ghUser} ↗
                            </a>
                        )}
                    </div>
                    <p style={{ color: T.textMuted, fontSize: "0.78rem", margin: 0 }}>{r.role_applied}</p>
                </div>
                <span style={{
                    fontSize: "0.7rem", fontWeight: 500,
                    padding: "0.22rem 0.65rem", borderRadius: 999,
                    border: "1px solid rgba(183,148,244,0.3)",
                    background: "rgba(183,148,244,0.1)",
                    color: T.purple,
                }}>GitHub Analysis</span>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* ── Tech Stack ── */}
                {r.technical_stack?.length > 0 && (
                    <div>
                        <h4 style={{
                            color: T.textDim, fontSize: "0.7rem", fontWeight: 600,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            marginBottom: "0.6rem",
                        }}>Technical Stack</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {r.technical_stack.map((tech, i) => (
                                <span key={i} style={{
                                    fontSize: "0.75rem", fontWeight: 500,
                                    padding: "0.25rem 0.7rem", borderRadius: 8,
                                    background: "rgba(183,148,244,0.1)",
                                    border: "1px solid rgba(183,148,244,0.2)",
                                    color: T.purple,
                                }}>{tech}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Divider ── */}
                {r.technical_stack?.length > 0 && (
                    <div style={{ height: 1, background: T.border }} />
                )}

                {/* ── Recent Repos ── */}
                {r.recent_repos?.length > 0 && (
                    <div>
                        <h4 style={{
                            color: T.textDim, fontSize: "0.7rem", fontWeight: 600,
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            marginBottom: "0.75rem",
                        }}>Recent Repositories</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {r.recent_repos.map((repo, i) => {
                                const rel = RELEVANCE[repo.relevance] || RELEVANCE["LOW"]
                                return (
                                    <div key={i} style={{
                                        display: "flex", gap: "0.85rem", alignItems: "flex-start",
                                        background: "rgba(255,255,255,0.03)",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 10, padding: "0.85rem 1rem",
                                    }}>
                                        <span style={{
                                            fontSize: "0.65rem", fontWeight: 700,
                                            padding: "0.2rem 0.55rem", borderRadius: 6,
                                            border: `1px solid ${rel.border}`,
                                            background: rel.bg, color: rel.color,
                                            flexShrink: 0, marginTop: "0.1rem",
                                            letterSpacing: "0.04em",
                                        }}>{repo.relevance}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem", margin: "0 0 0.2rem" }}>
                                                {repo.name}
                                            </p>
                                            <p style={{ color: T.textMuted, fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>
                                                {repo.notes}
                                            </p>
                                            {repo.readme_quality && (
                                                <p style={{ color: T.textDim, fontSize: "0.73rem", marginTop: "0.3rem" }}>
                                                    📄 {repo.readme_quality}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Divider ── */}
                <div style={{ height: 1, background: T.border }} />

                {/* ── Strengths & Gaps ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {r.strengths?.length > 0 && (
                        <div style={{
                            background: "rgba(104,211,145,0.07)",
                            border: "1px solid rgba(104,211,145,0.2)",
                            borderRadius: 10, padding: "1rem",
                        }}>
                            <h4 style={{ color: T.green, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                                ✅ Strengths
                            </h4>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                {r.strengths.map((s, i) => (
                                    <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                                        <span style={{ color: T.green, flexShrink: 0 }}>•</span>{s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {r.gaps?.length > 0 && (
                        <div style={{
                            background: "rgba(251,211,141,0.07)",
                            border: "1px solid rgba(251,211,141,0.2)",
                            borderRadius: 10, padding: "1rem",
                        }}>
                            <h4 style={{ color: T.orange, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                                ⚠️ Gaps
                            </h4>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                {r.gaps.map((g, i) => (
                                    <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                                        <span style={{ color: T.orange, flexShrink: 0 }}>•</span>{g}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ── Activity + Overall ── */}
                {(r.code_activity || r.overall_observation) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        {r.code_activity && (
                            <div style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${T.border}`,
                                borderRadius: 10, padding: "1rem",
                            }}>
                                <h4 style={{ color: T.textDim, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                    Code Activity
                                </h4>
                                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.65, margin: 0 }}>
                                    {r.code_activity}
                                </p>
                            </div>
                        )}
                        {r.overall_observation && (
                            <div style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${T.border}`,
                                borderRadius: 10, padding: "1rem",
                            }}>
                                <h4 style={{ color: T.textDim, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                    Overall
                                </h4>
                                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.65, margin: 0 }}>
                                    {r.overall_observation}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}