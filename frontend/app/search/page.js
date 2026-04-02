"use client"
import { useState } from "react"
import { matchCandidates } from "@/lib/api"
import Link from "next/link"

export default function SearchPage() {
    const [jobDescription, setJobDescription] = useState("")
    const [availability, setAvailability] = useState("")
    const [location, setLocation] = useState("")
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [error, setError] = useState("")

    async function handleSearch() {
        // Basic validation
        if (!jobDescription.trim()) {
            setError("Please enter a job description.")
            return
        }

        setError("")
        setLoading(true)
        setSearched(false)

        try {
            const data = await matchCandidates(
                jobDescription,
                availability,
                location,
                3
            )
            setResults(data.results || [])
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
            setSearched(true)
        }
    }

    // Convert 0.85 → 85%
    function scoreToPercent(score) {
        return Math.round(score * 100)
    }

    // Color based on match score
    function scoreColor(score) {
        const pct = scoreToPercent(score)
        if (pct >= 70) return "text-green-600 bg-green-50"
        if (pct >= 45) return "text-yellow-600 bg-yellow-50"
        return "text-red-500 bg-red-50"
    }

    return (
        <div className="max-w-4xl mx-auto">

            {/* ── Page Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                    Find Candidates
                </h1>
                <p className="text-gray-500">
                    Describe the role and we'll rank the best matching candidates for you.
                </p>
            </div>

            {/* ── Search Panel ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">

                {/* Component 1 — Job Description */}
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Job Description
                    </label>
                    <textarea
                        rows={5}
                        placeholder="e.g. Looking for a Python developer with experience in machine learning, NLP, and building REST APIs..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Component 2 & 3 — Dropdowns side by side */}
                <div className="flex gap-4 mb-6">

                    {/* Availability Dropdown */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Availability
                        </label>
                        <select
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Any Availability</option>
                            <option value="full-time">Full-time</option>
                            <option value="freelance">Freelance / Contract-based</option>
                            <option value="project-based">Project Based</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>

                    {/* Location Dropdown */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Location
                        </label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Any Location</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="on-site">On-site</option>
                        </select>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                )}

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? "Matching candidates..." : "Find Matching Candidates"}
                </button>
            </div>

            {/* ── Results Section ── */}
            {searched && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {results.length > 0
                            ? `${results.length} Matching Candidates Found`
                            : "No candidates matched your filters"}
                    </h2>

                    <div className="flex flex-col gap-4">
                        {results.map((candidate, index) => (
                            <div
                                key={candidate.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 flex gap-6 items-start"
                            >
                                {/* Rank number */}
                                <div className="text-3xl font-bold text-gray-200 w-8 shrink-0">
                                    {index + 1}
                                </div>

                                {/* Candidate Info */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {candidate.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">{candidate.email}</p>
                                        </div>

                                        {/* Match Score Badge */}
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreColor(candidate.match_score)}`}>
                                            {scoreToPercent(candidate.match_score)}% match
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {candidate.availability}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            {candidate.location}
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {candidate.years_experience} yrs exp
                                        </span>
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {candidate.skills.split(", ").map((skill) => (
                                            <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Resume snippet */}
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {candidate.resume_text}
                                    </p>

                                    {/* View Profile link */}
                                    <Link
                                        href={`/candidates/${candidate.id}`}
                                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                    >
                                        View Full Profile →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}