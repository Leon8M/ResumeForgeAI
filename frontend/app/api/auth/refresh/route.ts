import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// The name of the refresh token cookie set by the Django backend
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'; 

// The GraphQL endpoint from your apollo.ts
const GRAPHQL_ENDPOINT = "https://resumeforgeai-zawv.onrender.com/graphql";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const refreshTokenCookie = (await cookieStore).get(REFRESH_TOKEN_COOKIE_NAME);

  if (!refreshTokenCookie) {
    return NextResponse.json({ error: 'Refresh token cookie not found' }, { status: 401 });
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the refresh token cookie to the backend
        'Cookie': `${refreshTokenCookie.name}=${refreshTokenCookie.value}`
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              token
              payload
            }
          }
        `,
        variables: {
            // The actual refresh token string is passed as a variable
            refreshToken: refreshTokenCookie.value
        }
      }),
    });

    const result = await response.json();

    if (result.data?.refreshToken?.token) {
      // Successfully refreshed the token
      return NextResponse.json({ token: result.data.refreshToken.token });
    } else {
      // Log the error for debugging
      console.error("Token refresh failed:", result.errors || "No token in response");
      // Important: When refresh fails, the client should log out.
      // We clear the cookie here to help prevent refresh loops.
      const response = NextResponse.json(
        { error: 'Failed to refresh token', details: result.errors },
        { status: 401 }
      );
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return response;
    }
  } catch (error) {
    console.error("Error during token refresh request:", error);
    return NextResponse.json({ error: 'An unexpected error occurred during token refresh.' }, { status: 500 });
  }
}
