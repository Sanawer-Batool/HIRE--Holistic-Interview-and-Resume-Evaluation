"use client"
import { useState } from "react"
import { createCandidate } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function NewCandidate() {
    const router = useRouter()
    const [form, setForm] = useState({
        name: "", email: "", skills: "", resume_text: "",
        github_url: "", portfolio_url: "",
        availability: "freelance", location: "remote", years_experience: ""
    })

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        await createCandidate({
            ...form,
            skills: form.skills.split(",").map(s => s.trim()),
            years_experience: parseInt(form.years_experience)
        })
        router.push("/candidates")
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Candidate</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {[
                    { name: "name", label: "Full Name", type: "text" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "skills", label: "Skills (comma separated)", type: "text" },
                    { name: "github_url", label: "GitHub URL", type: "text" },
                    { name: "portfolio_url", label: "Portfolio URL", type: "text" },
                    { name: "years_experience", label: "Years of Experience", type: "number" },
                ].map(({ name, label, type }) => (
                    <div key={name}>
                        <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                        <input
                            type={type} name={name} value={form[name]}
                            onChange={handleChange} required={["name","email","skills","years_experience"].includes(name)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}

                <div>
                    <label className="text-sm text-gray-600 mb-1 block">Resume Text</label>
                    <textarea
                        name="resume_text" value={form.resume_text}
                        onChange={handleChange} rows={4} required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm text-gray-600 mb-1 block">Availability</label>
                        <select name="availability" value={form.availability} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option value="freelance">Freelance</option>
                            <option value="full-time">Full-time</option>
                            <option value="project-based">Project-based</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm text-gray-600 mb-1 block">Location</label>
                        <select name="location" value={form.location} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="on-site">On-site</option>
                        </select>
                    </div>
                </div>

                <button type="submit"
                    className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium mt-2">
                    Add Candidate
                </button>
            </form>
        </div>
    )
}