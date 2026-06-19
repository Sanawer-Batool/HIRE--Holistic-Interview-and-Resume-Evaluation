"use client"
import { useState } from "react"
import { createCandidate, parseResume } from "@/lib/api"
import { useRouter } from "next/navigation"

const T = {
    bg          : "#070d1a",
    surface     : "rgba(255,255,255,0.04)",
    surfaceHover: "rgba(255,255,255,0.07)",
    border      : "rgba(255,255,255,0.09)",
    text        : "white",
    textMuted   : "rgba(255,255,255,0.45)",
    textDim     : "rgba(255,255,255,0.25)",
    blue        : "#63b3ed",
    green       : "#68d391",
    red         : "#fc8181",
    font        : "'DM Sans', sans-serif",
}

const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "0.7rem 1rem",
    fontSize: "0.875rem",
    color: T.text,
    fontFamily: T.font,
    outline: "none",
    transition: "border-color 0.2s",
}

const labelStyle = {
    display: "block",
    color: T.textMuted,
    fontSize: "0.75rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
    fontFamily: T.font,
}

export default function NewCandidate() {
    const router = useRouter()

    const [form, setForm] = useState({
        name: "", email: "", skills: "", resume_text: "",
        github_url: "", portfolio_url: "",
        availability: "full-time", location: "remote",
        years_experience: "", applying_for: ""
    })

    const [uploading, setUploading]     = useState(false)
    const [uploadError, setUploadError] = useState("")
    const [parsed, setParsed]           = useState(false)
    const [submitting, setSubmitting]   = useState(false)
    const [focusedField, setFocusedField] = useState(null)

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleResumeUpload(e) {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true); setUploadError(""); setParsed(false)
        try {
            const data = await parseResume(file)
            setForm({
                name:             data.name || "",
                email:            data.email || "",
                skills:           Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "",
                resume_text:      data.resume_text || "",
                github_url:       data.github_url || "",
                portfolio_url:    data.portfolio_url || "",
                availability:     data.availability || "full-time",
                location:         data.location || "remote",
                years_experience: data.years_experience || "",
                applying_for:     data.applying_for || ""
            })
            setParsed(true)
        } catch (err) {
            setUploadError(err.message || "Could not parse resume. Please fill the form manually.")
        } finally { setUploading(false) }
    }

    async function handleSubmit(e) {
        e.preventDefault(); setSubmitting(true)
        try {
            const created = await createCandidate({
                ...form,
                skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
                years_experience: parseInt(form.years_experience) || 0
            })
            // Store candidate's own ID so Navbar "My Profile" link works
            if (created?.id) {
                localStorage.setItem("hire_candidate_id", created.id)
            }
            // Candidate should only see their own profile, not all candidates
            router.push(`/candidates/${created.id}`)
        } catch (err) { console.error(err) }
        finally { setSubmitting(false) }
    }

    const fields = [
        { name: "name",             label: "Full Name",              type: "text",   required: true  },
        { name: "email",            label: "Email Address",          type: "email",  required: true  },
        { name: "skills",           label: "Skills (comma separated)", type: "text", required: true  },
        { name: "github_url",       label: "GitHub URL",             type: "text",   required: false },
        { name: "portfolio_url",    label: "Portfolio URL",          type: "text",   required: false },
        { name: "years_experience", label: "Years of Experience",    type: "number", required: true  },
    ]

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 30% 20%, #0d1f3c 0%, ${T.bg} 55%)`,
            fontFamily: T.font,
            padding: "2.5rem 1.5rem",
        }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>

                {/* Header */}
                <button onClick={() => router.back()} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: T.textMuted, fontSize: "0.83rem", fontFamily: T.font,
                    padding: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem",
                    transition: "color 0.15s",
                }}>
                    ← Back
                </button>

                <div style={{ marginBottom: "2rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.3rem 0.85rem",
                        border: "1px solid rgba(104,211,145,0.25)",
                        borderRadius: 999,
                        background: "rgba(104,211,145,0.07)",
                        marginBottom: "1rem",
                    }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />
                        <span style={{ color: T.textMuted, fontSize: "0.75rem", letterSpacing: "0.06em" }}>CANDIDATE REGISTRATION</span>
                    </div>
                    <h1 style={{ color: T.text, fontSize: "1.9rem", fontWeight: 800, margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
                        Add Your Profile
                    </h1>
                    <p style={{ color: T.textMuted, fontSize: "0.875rem", margin: 0 }}>
                        Upload your resume to auto-fill, or fill in manually.
                    </p>
                </div>

                {/* Upload Zone */}
                <div style={{
                    border: `2px dashed ${parsed ? "rgba(104,211,145,0.4)" : uploading ? "rgba(99,179,237,0.4)" : T.border}`,
                    borderRadius: 14,
                    padding: "2rem",
                    textAlign: "center",
                    background: parsed ? "rgba(104,211,145,0.05)" : uploading ? "rgba(99,179,237,0.04)" : T.surface,
                    marginBottom: "1.75rem",
                    transition: "all 0.3s",
                }}>
                    {!uploading && !parsed && (
                        <>
                            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📄</div>
                            <p style={{ color: T.textMuted, fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                                Upload a PDF resume and we'll extract your information automatically
                            </p>
                            <label style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                cursor: "pointer",
                                background: "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(99,179,237,0.1))",
                                border: "1px solid rgba(99,179,237,0.35)",
                                color: T.blue,
                                padding: "0.65rem 1.5rem",
                                borderRadius: 10,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                fontFamily: T.font,
                                transition: "all 0.2s",
                            }}>
                                📄 Upload Resume PDF
                                <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: "none" }} />
                            </label>
                        </>
                    )}

                    {uploading && (
                        <div>
                            <div style={{
                                width: 36, height: 36, margin: "0 auto 1rem",
                                border: `3px solid rgba(99,179,237,0.2)`,
                                borderTop: `3px solid ${T.blue}`,
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }} />
                            <p style={{ color: T.blue, fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>Extracting from resume...</p>
                            <p style={{ color: T.textDim, fontSize: "0.78rem", marginTop: "0.3rem" }}>AI is reading your document</p>
                        </div>
                    )}

                    {parsed && !uploading && (
                        <div>
                            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>✅</div>
                            <p style={{ color: T.green, fontWeight: 600, margin: "0 0 0.3rem", fontSize: "0.9rem" }}>Resume parsed successfully</p>
                            <p style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                                Form pre-filled — review and edit before submitting
                            </p>
                            <label style={{ cursor: "pointer", color: T.blue, fontSize: "0.78rem", fontFamily: T.font }}>
                                Upload a different resume
                                <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: "none" }} />
                            </label>
                        </div>
                    )}

                    {uploadError && (
                        <p style={{ color: T.red, fontSize: "0.83rem", marginTop: "0.75rem" }}>{uploadError}</p>
                    )}
                </div>

                {/* Form */}
                <div style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: "2rem",
                    backdropFilter: "blur(8px)",
                }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        {fields.map(({ name, label, type, required }) => (
                            <div key={name}>
                                <label style={labelStyle}>{label}</label>
                                <input
                                    type={type} name={name} value={form[name]}
                                    onChange={handleChange}
                                    required={required}
                                    onFocus={() => setFocusedField(name)}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        ...inputStyle,
                                        borderColor: focusedField === name ? T.blue : T.border,
                                    }}
                                />
                            </div>
                        ))}

                        {/* Applying For */}
                        <div>
                            <label style={labelStyle}>
                                Roles You're Interested In
                                <span style={{ marginLeft: "0.5rem", color: T.textDim, fontSize: "0.7rem", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                                    optional
                                </span>
                            </label>
                            <textarea
                                name="applying_for"
                                value={form.applying_for}
                                onChange={handleChange}
                                rows={4}
                                onFocus={() => setFocusedField("applying_for")}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. ML Engineer, AI Engineer, Backend Python roles"
                                style={{
                                    ...inputStyle,
                                    resize: "vertical",
                                    minHeight: 110,
                                    borderColor: focusedField === "applying_for" ? T.blue : T.border,
                                }}
                            />
                            <p style={{ color: T.textDim, fontSize: "0.72rem", marginTop: "0.4rem", fontFamily: T.font }}>
                                Helps recruiters understand your interests and improves how you appear in searches
                            </p>
                        </div>

                        {/* Resume Text */}
                        <div>
                            <label style={labelStyle}>
                                Professional Summary
                                {parsed && (
                                    <span style={{ marginLeft: "0.5rem", color: T.green, fontSize: "0.7rem", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                                        ✨ AI generated — optimized for job matching
                                    </span>
                                )}
                            </label>
                            <textarea
                                name="resume_text" value={form.resume_text}
                                onChange={handleChange} rows={5} required
                                onFocus={() => setFocusedField("resume_text")}
                                onBlur={() => setFocusedField(null)}
                                placeholder="A summary of your technical skills, experience, and domain expertise..."
                                style={{
                                    ...inputStyle,
                                    resize: "none", lineHeight: 1.65,
                                    borderColor: focusedField === "resume_text" ? T.blue : T.border,
                                }}
                            />
                            <p style={{ color: T.textDim, fontSize: "0.72rem", marginTop: "0.4rem", fontFamily: T.font }}>
                                Used for AI-powered job matching — be specific about your skills and experience
                            </p>
                        </div>

                        {/* Dropdowns */}
                        <div style={{ display: "flex", gap: "1rem" }}>
                            {[
                                {
                                    name: "availability", label: "Availability",
                                    options: [
                                        { value: "full-time", label: "Full-time" },
                                        { value: "freelance", label: "Freelance" },
                                        { value: "project-based", label: "Project-based" },
                                        { value: "Internship", label: "Internship" },
                                    ]
                                },
                                {
                                    name: "location", label: "Location",
                                    options: [
                                        { value: "remote", label: "Remote" },
                                        { value: "hybrid", label: "Hybrid" },
                                        { value: "on-site", label: "On-site" },
                                    ]
                                },
                            ].map(({ name, label, options }) => (
                                <div key={name} style={{ flex: 1 }}>
                                    <label style={labelStyle}>{label}</label>
                                    <select
                                        name={name} value={form[name]} onChange={handleChange}
                                        style={{ ...inputStyle, cursor: "pointer" }}
                                    >
                                        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit" disabled={submitting}
                            style={{
                                background: submitting ? "rgba(104,211,145,0.2)" : "linear-gradient(135deg, rgba(104,211,145,0.3), rgba(104,211,145,0.15))",
                                border: "1px solid rgba(104,211,145,0.4)",
                                color: T.green,
                                borderRadius: 10,
                                padding: "0.85rem",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                cursor: submitting ? "not-allowed" : "pointer",
                                fontFamily: T.font,
                                marginTop: "0.5rem",
                                transition: "all 0.2s",
                            }}
                        >
                            {submitting ? "Saving profile..." : "Save Profile →"}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                select option { background: #0d1f3c; color: white; }
            `}</style>
        </div>
    )
}