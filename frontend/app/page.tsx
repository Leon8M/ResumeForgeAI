"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen flex-col gap-4 bg-slate-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          Welcome to ResumeForge AI
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Instantly tailor your resume and cover letter for any job description.
        </p>
      </div>
      <div className="flex gap-4 mt-4">
        <Button asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/register">Register</Link>
        </Button>
      </div>
    </main>
  );
}