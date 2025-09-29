"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { UPGRADE_TO_PREMIUM } from '@/lib/mutations';
import { useAuthStore } from '@/lib/authStore';

export default function PricingPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const [upgradeToPremium, { loading }] = useMutation(UPGRADE_TO_PREMIUM, {
    onCompleted: (data) => {
      if ((data as any).upgradeToPremium.success) {
        setMessage((data as any).upgradeToPremium.message);
        setIsError(false);
        // Optionally refetch user data to update premium status in UI
        // client.refetchQueries({ include: [GET_ME] });
        router.push('/app'); // Redirect to app page after successful upgrade
      } else {
        setMessage((data as any).upgradeToPremium.message || "Failed to upgrade to Premium.");
        setIsError(true);
      }
    },
    onError: (error) => {
      setMessage(error.message || "An error occurred during upgrade.");
      setIsError(true);
    },
  });

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    await upgradeToPremium();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[380px]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Premium Plan</CardTitle>
          <CardDescription>Unlock all features for a monthly fee.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-bold">$9.99</span>
            <span className="text-xl text-muted-foreground">/month</span>
          </div>
          <ul className="grid gap-2 text-left">
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> Full Resume Generation
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> Personalized Cover Letter
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> Professional Templates
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> PDF Download
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
            {loading ? 'Upgrading...' : 'Subscribe to Premium'}
          </Button>
          {message && (
            <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}