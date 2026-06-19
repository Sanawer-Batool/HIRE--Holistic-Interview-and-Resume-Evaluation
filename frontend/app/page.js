"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/context/RoleContext"

export default function Home() {
    const canvasRef = useRef(null)
    const router = useRouter()
    const { selectRole } = useRole()
    const [hovering, setHovering] = useState(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener("resize", resize)

        const stars = Array.from({ length: 130 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.2,
            o: Math.random() * 0.6 + 0.15,
        }))

        let animId
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            stars.forEach(s => {
                ctx.beginPath()
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255,255,255,${s.o})`
                ctx.fill()
                s.o += (Math.random() - 0.5) * 0.015
                s.o = Math.max(0.08, Math.min(0.75, s.o))
            })
            animId = requestAnimationFrame(draw)
        }
        draw()
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", resize)
        }
    }, [])

    function handleRoleSelect(r) {
        selectRole(r)
        if (r === "recruiter") router.push("/search")
        else router.push("/candidates/new")
    }

    const roles = [
        {
            key: "recruiter",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: "I'm a Recruiter",
            desc: "Search candidates, run AI agents, view hiring reports",
            accent: "#63b3ed",
            accentBg: "rgba(99,179,237,0.1)",
            accentBorder: "rgba(99,179,237,0.35)",
        },
        {
            key: "candidate",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                </svg>
            ),
            title: "I'm a Candidate",
            desc: "Add your profile and get matched to the right role",
            accent: "#68d391",
            accentBg: "rgba(104,211,145,0.1)",
            accentBorder: "rgba(104,211,145,0.35)",
        },
    ]

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 60% 35%, #0d1f3c 0%, #070d1a 55%, #000 100%)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <canvas ref={canvasRef} style={{
                position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none"
            }} />

            {/* Glow orb top right */}
            <div style={{
                position: "absolute", right: "-8%", top: "-8%",
                width: "65vw", height: "65vw", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,179,237,0.07) 0%, rgba(49,130,206,0.03) 40%, transparent 70%)",
                pointerEvents: "none", zIndex: 0,
            }} />

            {/* Minimal top nav — just logo + switch role */}
            <nav style={{
                position: "relative", zIndex: 10,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1.5rem 3rem",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                        width: 28, height: 28,
                        background: "linear-gradient(135deg, #63b3ed, #4299e1)",
                        borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1L9.5 5.5H12.5L10 8.5L11 12.5L7 10.5L3 12.5L4 8.5L1.5 5.5H4.5L7 1Z" fill="white" />
                        </svg>
                    </div>
                    <span style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.08em" }}>HIRE</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
                    AI-Powered Hiring Platform
                </span>
            </nav>

            {/* Hero */}
            <main style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                position: "relative", zIndex: 10,
                padding: "2rem 1.5rem",
                textAlign: "center",
            }}>
                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.35rem 1rem",
                    border: "1px solid rgba(99,179,237,0.25)",
                    borderRadius: 999,
                    background: "rgba(99,179,237,0.07)",
                    marginBottom: "1.75rem",
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#63b3ed", animation: "pulse 2s infinite" }} />
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                        Hire smarter, move faster
                    </span>
                </div>

                <h1 style={{
                    fontSize: "clamp(2.8rem, 6.5vw, 5rem)",
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1.06,
                    marginBottom: "1.25rem",
                    letterSpacing: "-0.03em",
                    maxWidth: 720,
                }}>
                    Welcome to{" "}
                    <span style={{
                        background: "linear-gradient(135deg, #63b3ed 0%, #90cdf4 50%, #bee3f8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>HIRE</span>
                </h1>

                <p style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
                    maxWidth: 500,
                    lineHeight: 1.75,
                    marginBottom: "3.5rem",
                }}>
                    A holistic interview &amp; resume evaluation system that turns
                    complex hiring signals into clear, confident decisions.
                </p>

                {/* Role selector cards */}
                <p style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "1.25rem",
                }}>
                    Who are you?
                </p>

                <div style={{
                    display: "flex", gap: "1.25rem",
                    flexWrap: "wrap", justifyContent: "center",
                }}>
                    {roles.map(({ key, icon, title, desc, accent, accentBg, accentBorder }) => (
                        <button
                            key={key}
                            onClick={() => handleRoleSelect(key)}
                            onMouseEnter={() => setHovering(key)}
                            onMouseLeave={() => setHovering(null)}
                            style={{
                                width: 260,
                                padding: "1.75rem 1.5rem",
                                background: hovering === key ? accentBg : "rgba(255,255,255,0.04)",
                                border: `1px solid ${hovering === key ? accentBorder : "rgba(255,255,255,0.1)"}`,
                                borderRadius: 16,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.2s ease",
                                transform: hovering === key ? "translateY(-3px)" : "translateY(0)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            <div style={{
                                color: accent,
                                marginBottom: "1rem",
                                display: "flex",
                            }}>
                                {icon}
                            </div>
                            <div style={{
                                color: "white",
                                fontWeight: 600,
                                fontSize: "1rem",
                                marginBottom: "0.4rem",
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                {title}
                            </div>
                            <div style={{
                                color: "rgba(255,255,255,0.45)",
                                fontSize: "0.82rem",
                                lineHeight: 1.6,
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                {desc}
                            </div>
                            <div style={{
                                marginTop: "1.25rem",
                                display: "flex", alignItems: "center", gap: "0.4rem",
                                color: accent,
                                fontSize: "0.82rem",
                                fontWeight: 500,
                                opacity: hovering === key ? 1 : 0.5,
                                transition: "opacity 0.2s",
                            }}>
                                Continue
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div style={{
                    display: "flex", gap: "3rem", marginTop: "4rem",
                    flexWrap: "wrap", justifyContent: "center",
                }}>
                    {[
                        { value: "3", label: "AI Agents" },
                        { value: "30+", label: "Candidates" },
                        { value: "< 5min", label: "Per Pipeline Run" },
                    ].map(({ value, label }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{value}</div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.2rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Pipeline strip */}
            <div style={{
                position: "relative", zIndex: 10,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "1.25rem 3rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0", flexWrap: "wrap",
            }}>
                {[
                    { icon: "🔍", label: "Semantic Search" },
                    null,
                    { icon: "⚙️", label: "GitHub Agent" },
                    null,
                    { icon: "✉️", label: "Email Agent" },
                    null,
                    { icon: "📊", label: "Scorecard Agent" },
                ].map((item, i) =>
                    item ? (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.35rem 0.9rem", margin: "0.2rem",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.03)",
                        }}>
                            <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", letterSpacing: "0.02em" }}>{item.label}</span>
                        </div>
                    ) : (
                        <span key={i} style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.85rem", margin: "0 0.15rem" }}>→</span>
                    )
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    )
}