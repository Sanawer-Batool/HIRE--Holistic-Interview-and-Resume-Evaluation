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
    red      : "#fc8181",
    font     : "'DM Sans', sans-serif",
}

const VERDICT_CONFIG = {
    "STRONG HIRE": { color: T.green,  icon: "🟢", border: "rgba(104,211,145,0.3)",  bg: "rgba(104,211,145,0.08)"  },
    "HIRE"       : { color: T.blue,   icon: "🔵", border: "rgba(99,179,237,0.3)",   bg: "rgba(99,179,237,0.08)"   },
    "HOLD"       : { color: T.yellow, icon: "🟡", border: "rgba(246,224,94,0.3)",   bg: "rgba(246,224,94,0.08)"   },
    "REJECT"     : { color: T.red,    icon: "🔴", border: "rgba(252,129,129,0.3)",  bg: "rgba(252,129,129,0.08)"  },
}

function ScoreBar({ label, score, color }) {
    return (
        <div style={{ marginBottom: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: T.textMuted, fontSize: "0.8rem", fontFamily: T.font }}>{label}</span>
                <span style={{ color: T.text, fontSize: "0.82rem", fontWeight: 600, fontFamily: T.font }}>
                    {score}%
                </span>
            </div>
            <div style={{
                width: "100%", height: 6, borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
            }}>
                <div style={{
                    height: "100%", borderRadius: 999,
                    width: `${Math.min(Math.max(score, 0), 100)}%`,
                    background: color,
                    transition: "width 0.6s ease",
                    boxShadow: `0 0 8px ${color}60`,
                }} />
            </div>
        </div>
    )
}

export default function ScorecardCard({ result }) {

    // Fallback — if JSON parsing failed show raw text in dark style
    if (!result.parsed || !result.report) {
        return (
            <div style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "1.5rem",
                fontFamily: T.font,
            }}>
                <h3 style={{ color: T.text, fontWeight: 600, marginBottom: "0.75rem" }}>{result.name}</h3>
                <pre style={{
                    color: T.textMuted, fontSize: "0.78rem",
                    whiteSpace: "pre-wrap", fontFamily: "monospace",
                    lineHeight: 1.7, background: "rgba(0,0,0,0.2)",
                    padding: "1rem", borderRadius: 8, margin: 0,
                }}>
                    {result.error || String(result.report)}
                </pre>
            </div>
        )
    }

    const r = result.report
    const verdict = VERDICT_CONFIG[r.verdict] || VERDICT_CONFIG["HOLD"]

    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            fontFamily: T.font,
        }}>
            {/* ── Header ── */}
            <div style={{
                padding: "1.25rem 1.5rem",
                borderBottom: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: `${verdict.bg}`,
            }}>
                <div>
                    <h3 style={{ color: T.text, fontWeight: 700, fontSize: "1.05rem", margin: "0 0 0.2rem" }}>
                        {r.candidate_name}
                    </h3>
                    <p style={{ color: T.textMuted, fontSize: "0.8rem", margin: 0 }}>{r.role_applied}</p>
                </div>
                <span style={{
                    fontSize: "0.82rem", fontWeight: 700,
                    padding: "0.4rem 1rem", borderRadius: 999,
                    border: `1px solid ${verdict.border}`,
                    background: verdict.bg,
                    color: verdict.color,
                    letterSpacing: "0.03em",
                }}>
                    {verdict.icon} {r.verdict}
                </span>
            </div>

            <div style={{ padding: "1.5rem" }}>

                {/* ── Score Bars ── */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <ScoreBar label="ML Match Score"    score={r.ml_score}     color={T.blue}   />
                    <ScoreBar label="GitHub Relevance"  score={r.github_score} color={T.purple} />
                    <div style={{ height: 1, background: T.border, margin: "1rem 0" }} />
                    <ScoreBar
                        label="Final Score"
                        score={r.final_score}
                        color={
                            r.final_score >= 70 ? T.green :
                            r.final_score >= 45 ? T.yellow :
                            T.red
                        }
                    />
                </div>

                {/* ── Strengths & Concerns ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                    {/* Strengths */}
                    <div style={{
                        background: "rgba(104,211,145,0.07)",
                        border: "1px solid rgba(104,211,145,0.2)",
                        borderRadius: 10, padding: "1rem",
                    }}>
                        <h4 style={{ color: T.green, fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.6rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            ✅ Strengths
                        </h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {(r.strengths || []).map((s, i) => (
                                <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                                    <span style={{ color: T.green, flexShrink: 0 }}>•</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Concerns */}
                    <div style={{
                        background: "rgba(252,129,129,0.07)",
                        border: "1px solid rgba(252,129,129,0.2)",
                        borderRadius: 10, padding: "1rem",
                    }}>
                        <h4 style={{ color: T.red, fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.6rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            ⚠️ Concerns
                        </h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {(r.concerns || []).map((c, i) => (
                                <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                                    <span style={{ color: T.red, flexShrink: 0 }}>•</span>
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Reasoning ── */}
                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "1rem",
                    marginBottom: "1rem",
                }}>
                    <h4 style={{ color: T.textDim, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                        Reasoning
                    </h4>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.83rem", lineHeight: 1.75, margin: 0 }}>
                        {r.summary}
                    </p>
                </div>

                {/* ── Next Step ── */}
                <div style={{
                    background: "rgba(99,179,237,0.07)",
                    border: "1px solid rgba(99,179,237,0.2)",
                    borderRadius: 10, padding: "1rem",
                    display: "flex", gap: "0.75rem", alignItems: "flex-start",
                }}>
                    <span style={{ color: T.blue, fontSize: "1rem", flexShrink: 0 }}>→</span>
                    <div>
                        <span style={{ color: T.blue, fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Suggested Next Step:{" "}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.83rem" }}>{r.next_step}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}