import Link from "next/link"

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
                Welcome to <span className="text-blue-600">HIRE</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-xl">
                AI-powered candidate management and resume matching platform
            </p>
            <Link
                href="/candidates"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700"
            >
                View Candidates
            </Link>
        </div>
    )
}