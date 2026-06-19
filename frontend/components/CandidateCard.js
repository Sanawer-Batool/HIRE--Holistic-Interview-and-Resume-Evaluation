import Link from "next/link"

const T = {
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.22)",
    blue     : "#63b3ed",
    green    : "#68d391",
    red      : "#fc8181",
    font     : "'DM Sans', sans-serif",
}

export default function CandidateCard({ candidate, onDelete }) {
    const skills = Array.isArray(candidate.skills)
        ? candidate.skills
        : candidate.skills?.split(", ").filter(Boolean) || []

    const initials = candidate.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "1.5rem",
            fontFamily: T.font,
            transition: "border-color 0.2s, transform 0.2s",
            cursor: "default",
            backdropFilter: "blur(8px)",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(99,179,237,0.3)"
                e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border
                e.currentTarget.style.transform = "translateY(0)"
            }}
        >
            {/* Top row — avatar + name + tags */}
            <div style={{ display: "flex", gap: "0.85rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                {/* Avatar */}
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(99,179,237,0.25), rgba(183,148,244,0.2))",
                    border: "1px solid rgba(99,179,237,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.blue, fontSize: "0.85rem", fontWeight: 700,
                }}>
                    {initials}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.text, fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {candidate.name}
                    </div>
                    <div style={{ color: T.textMuted, fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {candidate.email}
                    </div>
                </div>

                {/* Tags stacked */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexShrink: 0 }}>
                    <span style={{
                        fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem",
                        borderRadius: 999, border: "1px solid rgba(99,179,237,0.3)",
                        background: "rgba(99,179,237,0.1)", color: T.blue,
                    }}>{candidate.availability}</span>
                    <span style={{
                        fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem",
                        borderRadius: 999, border: `1px solid rgba(255,255,255,0.1)`,
                        background: "rgba(255,255,255,0.05)", color: T.textMuted,
                    }}>{candidate.location}</span>
                </div>
            </div>

            {/* Experience */}
            <div style={{ color: T.textDim, fontSize: "0.76rem", marginBottom: "0.85rem", letterSpacing: "0.02em" }}>
                {candidate.years_experience} years experience
            </div>

            {/* Skills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                {skills.slice(0, 5).map(skill => (
                    <span key={skill} style={{
                        fontSize: "0.7rem", padding: "0.2rem 0.6rem",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid rgba(255,255,255,0.08)`,
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: T.font,
                    }}>{skill}</span>
                ))}
                {skills.length > 5 && (
                    <span style={{
                        fontSize: "0.7rem", padding: "0.2rem 0.6rem",
                        borderRadius: 6,
                        color: T.textDim,
                        fontFamily: T.font,
                    }}>+{skills.length - 5} more</span>
                )}
            </div>

            {candidate.applying_for && (
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.45rem",
                    padding: "0.65rem 0.8rem",
                    marginBottom: "1rem",
                    borderRadius: 10,
                    border: "1px solid rgba(99,179,237,0.14)",
                    background: "rgba(99,179,237,0.06)",
                    color: T.textMuted,
                    fontSize: "0.78rem",
                    lineHeight: 1.5,
                }}>
                    <span>🎯</span>
                    <span>
                        <strong style={{ color: T.text, fontWeight: 600 }}>Looking for:</strong> {candidate.applying_for}
                    </span>
                </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href={`/candidates/${candidate.id}`} style={{
                    color: T.blue, fontSize: "0.8rem", textDecoration: "none",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    fontWeight: 500,
                }}>
                    View Profile →
                </Link>
                <button onClick={() => onDelete(candidate.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(252,129,129,0.5)", fontSize: "0.78rem",
                    fontFamily: T.font, padding: 0,
                    transition: "color 0.15s",
                }}
                    onMouseEnter={e => e.currentTarget.style.color = T.red}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(252,129,129,0.5)"}
                >
                    Delete
                </button>
            </div>
        </div>
    )
}