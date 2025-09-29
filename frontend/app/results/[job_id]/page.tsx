"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_ANALYSIS_JOB, GET_ME } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsPage() {
  const params = useParams();
  const jobId = params.job_id as string;

  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const isPremium = userData?.me?.isPremium || false;

  const { data, loading, error, startPolling, stopPolling } = useQuery(GET_ANALYSIS_JOB, {
    variables: { id: jobId },
    pollInterval: 2000, // Poll every 2 seconds
  });

  useEffect(() => {
    if (data?.job?.status === 'COMPLETED' || data?.job?.status === 'FAILED') {
      stopPolling();
    }
  }, [data, stopPolling]);

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Processing Your Request...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[280px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>An error occurred: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = data?.job;

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The analysis job with ID {jobId} could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Job Status: {job.status}</CardTitle>
        </CardHeader>
        <CardContent>
          {job.status === 'COMPLETED' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Analysis Result:</h2>
              <div className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md mb-4">
                {job.analysisResult}
              </div>

              {isPremium && job.generatedResume && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">Generated Resume:</h2>
                  <div className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md mb-4">
                    {job.generatedResume}
                  </div>
                </div>
              )}

              {isPremium && job.generatedCoverLetter && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">Generated Cover Letter:</h2>
                  <div className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md">
                    {job.generatedCoverLetter}
                  </div>
                </div>
              )}

              {!isPremium && (job.generatedResume || job.generatedCoverLetter) && (
                <p className="text-red-500 mt-4">Upgrade to Premium to view generated resume and cover letter.</p>
              )}
            </div>
          )}
          {(job.status === 'PENDING' || job.status === 'IN_PROGRESS') && (
            <p>Your resume analysis is currently {job.status.toLowerCase()}. Please wait...</p>
          )}
          {job.status === 'FAILED' && (
            <p className="text-red-500">The analysis job failed. Please try again.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}