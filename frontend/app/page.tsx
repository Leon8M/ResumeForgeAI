import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <main className="text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          Forge Your Future with AI
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Instantly tailor your resume and cover letter for any job description.
        </p>
        <Link href="/app" className="mt-8 inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Get Started for Free
        </Link>
      </main>
    </div>
  );
}
