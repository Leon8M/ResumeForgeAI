"use client";

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CREATE_ANALYSIS_JOB } from '@/lib/mutations';
import { GET_ME } from '@/lib/queries';

export default function AppPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [generateFullResume, setGenerateFullResume] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const router = useRouter();

  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const isPremium = (userData as any)?.me?.isPremium || false;

  const [createAnalysisJob, { loading: mutationLoading, error: mutationError }] = useMutation(CREATE_ANALYSIS_JOB);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createAnalysisJob({
        variables: {
          jobDescription,
          resumeText,
          generateFullResume: isPremium && generateFullResume,
          generateCoverLetter: isPremium && generateCoverLetter,
        },
      });
      if (result.data) {
        const jobId = (result.data as any)?.createAnalysisJob.job.id;
        router.push(`/results/${jobId}`);
      }
    } catch (err: any) {
      console.error('Error creating analysis job:', err);
    }
  };

  const loading = userLoading || mutationLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-slate-900">ResumeForge AI</h1>
      <p className="text-center text-slate-600 mt-2">Paste the job description and your resume below to get started.</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
        <div className="grid w-full gap-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px]"
              required
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="resume-text">Your Resume</Label>
            <Textarea
              id="resume-text"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[300px]"
              required
            />
          </div>

          <div className="grid w-full gap-2 mt-4 p-4 border rounded-md bg-gray-50">
            <p className="text-lg font-semibold">Premium Features</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-full-resume"
                checked={generateFullResume}
                onCheckedChange={setGenerateFullResume}
                disabled={!isPremium}
              />
              <Label htmlFor="generate-full-resume">
                Generate Full Tailored Resume (Premium)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-cover-letter"
                checked={generateCoverLetter}
                onCheckedChange={setGenerateCoverLetter}
                disabled={!isPremium}
              />
              <Label htmlFor="generate-cover-letter">
                Generate Personalized Cover Letter (Premium)
              </Label>
            </div>
            {!isPremium && (
              <p className="text-sm text-red-500 mt-2">
                Upgrade to Premium to unlock these features.
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Forge My Resume'}
          </Button>
          {mutationError && <p className="text-red-500 text-center mt-4">Error: {mutationError.message}</p>}
        </div>
      </form>
    </div>
  );
}
