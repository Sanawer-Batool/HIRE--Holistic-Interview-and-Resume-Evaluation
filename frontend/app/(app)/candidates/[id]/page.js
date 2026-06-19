"use client"
import { useEffect, useState } from "react"
import { getCandidateById } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"

const T = {
    bg       : "#070d1a",
    surface  : "rgba(255,255,255,0.04)",
    border   : "rgba(255,255,255,0.09)",
    text     : "white",
    textMuted: "rgba(255,255,255,0.45)",
    textDim  : "rgba(255,255,255,0.25)",
    blue     : "#63b3ed",
    green    : "#68d391",
    purple   : "#b794f4",
    yellow   : "#f6e05e",
    font     : "'DM Sans', sans-serif",
}

function Tag({ children, color = T.blue }) {
    return (
        <span style={{
            fontSize: "0.72rem", fontWeight: 500,
            padding: "0.25rem 0.7rem",
            borderRadius: 999,
            border: `1px solid ${color}40`,
            background: `${color}15`,
            color,
            fontFamily: T.font,
        }}>{children}</span>
    )
}

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <span style={{
                    color: T.textDim, fontSize: "0.7rem",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: T.font, fontWeight: 600,
                }}>{title}</span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            {children}
        </div>
    )
}

export default function CandidateProfile() {
    const { id } = useParams()
    const router = useRouter()
    const [candidate, setCandidate] = useState(null)

    // Check if this candidate is viewing their own profile
    const ownCandidateId = typeof window !== "undefined"
        ? localStorage.getItem("hire_candidate_id")
        : null
    const isOwnProfile = String(ownCandidateId) === String(id)

    useEffect(() => {
        getCandidateById(id).then(setCandidate)
    }, [id])

    if (!candidate) return (
        <div style={{
            minHeight: "100vh",
            background: T.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.font,
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: 40, height: 40, margin: "0 auto 1rem",
                    border: `3px solid rgba(99,179,237,0.2)`,
                    borderTop: `3px solid ${T.blue}`,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: T.textMuted, fontSize: "0.875rem" }}>Loading profile...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )

    const skills = Array.isArray(candidate.skills)
        ? candidate.skills
        : candidate.skills?.split(", ").filter(Boolean) || []

    // Initials avatar
    const initials = candidate.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 40% 10%, #0d1f3c 0%, ${T.bg} 55%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>

                {/* Back / navigation */}
                {isOwnProfile ? (
                    <div style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        marginBottom: "2rem",
                    }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.3rem 0.85rem",
                            border: "1px solid rgba(104,211,145,0.25)",
                            borderRadius: 999,
                            background: "rgba(104,211,145,0.07)",
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />
                            <span style={{ color: T.textMuted, fontSize: "0.75rem", letterSpacing: "0.06em" }}>YOUR PROFILE</span>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => router.back()} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: T.textMuted, fontSize: "0.83rem",
                        fontFamily: T.font, padding: 0,
                        marginBottom: "2rem",
                        display: "flex", alignItems: "center", gap: "0.4rem",
                    }}>
                        ← Back
                    </button>
                )}

                {/* Profile Hero Card */}
                <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: "2rem",
                    marginBottom: "1.5rem",
                    backdropFilter: "blur(8px)",
                }}>
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                        {/* Avatar */}
                        <div style={{
                            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                            background: "linear-gradient(135deg, rgba(99,179,237,0.3), rgba(183,148,244,0.3))",
                            border: `1px solid rgba(99,179,237,0.2)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: T.blue, fontSize: "1.3rem", fontWeight: 700,
                        }}>
                            {initials}
                        </div>

                        {/* Name + email + tags */}
                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                color: T.text, fontSize: "1.6rem", fontWeight: 800,
                                margin: "0 0 0.25rem", letterSpacing: "-0.02em",
                            }}>
                                {candidate.name}
                            </h1>
                            <p style={{ color: T.textMuted, fontSize: "0.875rem", margin: "0 0 1rem" }}>
                                {candidate.email}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                <Tag color={T.blue}>{candidate.availability}</Tag>
                                <Tag color={T.textMuted}>{candidate.location}</Tag>
                                <Tag color={T.green}>{candidate.years_experience} yrs exp</Tag>
                            </div>
                        </div>

                        {/* External links */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                            {candidate.github_url && (
                                <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: "flex", alignItems: "center", gap: "0.4rem",
                                        color: T.blue, fontSize: "0.8rem", textDecoration: "none",
                                        padding: "0.35rem 0.75rem",
                                        border: `1px solid rgba(99,179,237,0.25)`,
                                        borderRadius: 8,
                                        background: "rgba(99,179,237,0.07)",
                                        transition: "all 0.15s",
                                    }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    GitHub
                                </a>
                            )}
                            {candidate.portfolio_url && (
                                <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: "flex", alignItems: "center", gap: "0.4rem",
                                        color: T.purple, fontSize: "0.8rem", textDecoration: "none",
                                        padding: "0.35rem 0.75rem",
                                        border: `1px solid rgba(183,148,244,0.25)`,
                                        borderRadius: 8,
                                        background: "rgba(183,148,244,0.07)",
                                    }}>
                                    🔗 Portfolio
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: "1.75rem 2rem",
                    marginBottom: "1.5rem",
                }}>
                    <Section title="Skills">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {skills.map(skill => (
                                <span key={skill} style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: `1px solid ${T.border}`,
                                    color: "rgba(255,255,255,0.7)",
                                    padding: "0.3rem 0.85rem",
                                    borderRadius: 8,
                                    fontSize: "0.82rem",
                                    fontFamily: T.font,
                                }}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </Section>
                </div>

                {candidate.applying_for && (
                    <div style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 16,
                        padding: "1.75rem 2rem",
                        marginBottom: "1.5rem",
                    }}>
                        <Section title="Roles You're Interested In">
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.95rem 1rem",
                                borderRadius: 12,
                                border: "1px solid rgba(246,224,94,0.18)",
                                background: "rgba(246,224,94,0.06)",
                            }}>
                                <span style={{ fontSize: "1rem" }}>🎯</span>
                                <span style={{ color: T.text, fontSize: "0.9rem", lineHeight: 1.6 }}>
                                    {candidate.applying_for}
                                </span>
                            </div>
                        </Section>
                    </div>
                )}

                {/* Professional Summary */}
                <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: "1.75rem 2rem",
                }}>
                    <Section title="Professional Summary">
                        <p style={{
                            color: "rgba(255,255,255,0.65)",
                            fontSize: "0.875rem",
                            lineHeight: 1.8,
                            margin: 0,
                        }}>
                            {candidate.resume_text}
                        </p>
                    </Section>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}