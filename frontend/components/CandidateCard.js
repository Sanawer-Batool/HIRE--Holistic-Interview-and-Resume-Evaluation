import Link from "next/link"

export default function CandidateCard({ candidate, onDelete }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {candidate.name}
                    </h2>
                    <p className="text-sm text-gray-500">{candidate.email}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {candidate.availability}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {candidate.location}
                    </span>
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
                {candidate.years_experience} years experience
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {candidate.skills.split(", ").map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex gap-3">
                <Link
                    href={`/candidates/${candidate.id}`}
                    className="text-sm text-blue-600 hover:underline"
                >
                    View Profile
                </Link>
                <button
                    onClick={() => onDelete(candidate.id)}
                    className="text-sm text-red-500 hover:underline"
                >
                    Delete
                </button>
            </div>
        </div>
    )
}