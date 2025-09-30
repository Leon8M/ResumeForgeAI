'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useQuery } from '@apollo/client/react';
import { GET_ME } from '@/lib/queries';

function AuthHandler() {
    const { setUser, setInitializing, accessToken } = useAuthStore();
    // This query will run if accessToken exists, and will be skipped otherwise.
    const { data, loading, error } = useQuery(GET_ME, {
        skip: !accessToken,
    });

    useEffect(() => {
        if (!loading) {
            if ((data as any) && (data as any).me) {
                // We have a token and we successfully fetched the user
                setUser((data as any).me, accessToken);
            } else {
                // We either have no token, or the token is invalid (query failed)
                // In both cases, we ensure the user is logged out.
                setUser(null, null);
            }
            // In all cases, initialization is done.
            setInitializing(false);
        }
    }, [data, loading, error, setUser, accessToken, setInitializing]);

    return null; // This component does not render anything itself
}


export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isInitializing, setInitializing, setAccessToken, accessToken } = useAuthStore();

  useEffect(() => {
    // This effect runs only once on initial load
    const initializeAuth = async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error('No valid refresh token');
        }
        // We have a new access token. Set it in the store.
        // The AuthHandler component will then use it to fetch the user.
        setAccessToken(data.token);
      } catch (error) {
        console.log("No active session found.");
        // If refresh fails, we still need to signal that initialization is over.
        setInitializing(false);
      }
    };

    if (isInitializing && !accessToken) {
      initializeAuth();
    }
  }, [isInitializing, setInitializing, setAccessToken, accessToken]);

  // If we have an access token, AuthHandler will take care of setting the user
  // and finishing initialization. If we don't, initialization is finished by the catch block.
  // So we only need to show a loading screen while isInitializing is true AND we haven't failed.
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p> 
      </div>
    );
  }

  return (
    <>
        <AuthHandler />
        {children}
    </>
  );
}
