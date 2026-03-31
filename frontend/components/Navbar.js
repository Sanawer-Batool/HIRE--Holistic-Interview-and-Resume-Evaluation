import Link from "next/link"

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
                HIRE
            </Link>
            <div className="flex gap-6">
                <Link href="/candidates" className="text-gray-600 hover:text-blue-600">
                    Candidates
                </Link>
                <Link href="/candidates/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Candidate
                </Link>
            </div>
        </nav>
    )
}