"use client"
import { useEffect, useState } from "react"
import { getCandidateById } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"

export default function CandidateProfile() {
    const { id } = useParams()
    const router = useRouter()
    const [candidate, setCandidate] = useState(null)

    useEffect(() => {
        getCandidateById(id).then(setCandidate)
    }, [id])

    if (!candidate) return <p className="text-gray-500">Loading...</p>

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
            <button
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-blue-600 mb-6 block"
            >
                ← Back
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-1">{candidate.name}</h1>
            <p className="text-gray-500 mb-4">{candidate.email}</p>

            <div className="flex gap-3 mb-6">
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {candidate.availability}
                </span>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {candidate.location}
                </span>
                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {candidate.years_experience} years exp.
                </span>
            </div>

            <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {candidate.skills.split(", ").map((skill) => (
                        <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Resume</h2>
                <p className="text-gray-700 leading-relaxed">{candidate.resume_text}</p>
            </div>

            <div className="flex gap-4">
                {candidate.github_url && (
                    <a href={candidate.github_url} target="_blank"
                        className="text-blue-600 hover:underline text-sm">
                        GitHub →
                    </a>
                )}
                {candidate.portfolio_url && (
                    <a href={candidate.portfolio_url} target="_blank"
                        className="text-blue-600 hover:underline text-sm">
                        Portfolio →
                    </a>
                )}
            </div>
        </div>
    )
}