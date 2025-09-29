"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CREATE_USER, TOKEN_AUTH } from '@/lib/mutations';
import { useAuthStore } from '@/lib/authStore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.login);

  const [createUserMutation, { loading: createLoading }] = useMutation(CREATE_USER);
  const [tokenAuthMutation, { loading: authLoading }] = useMutation(TOKEN_AUTH);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      try {
        const { data } = await tokenAuthMutation({
          variables: { username, password },
        });
        if ((data as any)?.tokenAuth?.token) {
          // For simplicity, we're not fetching user details here, just using username
          // In a real app, you'd decode the token or fetch user info
          loginUser((data as any).tokenAuth.token, { id: "", username, email: "" }); // Placeholder user object
          router.push('/app');
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    } else {
      try {
        const { data } = await createUserMutation({
          variables: { username, email, password },
        });
        if ((data as any)?.createUser?.user) {
          // After successful registration, automatically log in the user
          const { data: authData } = await tokenAuthMutation({
            variables: { username, password },
          });
          if ((authData as any)?.tokenAuth?.token) {
            loginUser((authData as any).tokenAuth.token, (data as any).createUser.user);
            router.push('/app');
          } else {
            setError('Registration successful, but automatic login failed.');
          }
        } else {
          setError('Registration failed. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during registration.');
      }
    }
  };

  const loading = createLoading || authLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">{isLogin ? 'Login' : 'Register'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
            </Button>
          </form>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-0 h-auto">
              {isLogin ? 'Sign up' : 'Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}