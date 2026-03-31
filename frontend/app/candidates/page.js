"use client"
import { useEffect, useState } from "react"
import { getAllCandidates, searchCandidates, deleteCandidate } from "@/lib/api"
import CandidateCard from "@/components/CandidateCard"

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCandidates()
    }, [])

    async function loadCandidates() {
        setLoading(true)
        const data = await getAllCandidates()
        setCandidates(data)
        setLoading(false)
    }

    async function handleSearch(e) {
        const value = e.target.value
        setSearch(value)
        if (value.trim() === "") {
            loadCandidates()
        } else {
            const results = await searchCandidates(value)
            setCandidates(results)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Delete this candidate?")) return
        await deleteCandidate(id)
        loadCandidates()  // refresh list
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    All Candidates ({candidates.length})
                </h1>
                <input
                    type="text"
                    placeholder="Search by skill..."
                    value={search}
                    onChange={handleSearch}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : candidates.length === 0 ? (
                <p className="text-gray-500">No candidates found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((c) => (
                        <CandidateCard key={c.id} candidate={c} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}