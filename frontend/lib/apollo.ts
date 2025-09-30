import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from './authStore';

const httpLink = createHttpLink({
  uri: "https://resumeforgeai-zawv.onrender.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  const { accessToken } = useAuthStore.getState();
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `JWT ${accessToken}` : "",
    }
  }
});

// Function to get a new token from the refresh endpoint
const refreshToken = async () => {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const { token } = await res.json();
    if (!token) {
      throw new Error('No token returned from refresh');
    }
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch (error) {
    console.error('Failed to refresh token', error);
    // If refresh fails, log the user out
    useAuthStore.getState().logout();
    throw error;
  }
};

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      // Check for a specific error code or message that indicates an expired token
      if (err.extensions?.code === 'invalid-jwt' || err.message.includes("Signature has expired")) {
        // Token is expired, try to refresh it
        return new Promise(resolve => {
          refreshToken().then(newAccessToken => {
            // Retry the original request with the new token
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `JWT ${newAccessToken}`,
              },
            });
            resolve(forward(operation));
          }).catch(() => {
            // Refresh failed, do not retry the request
            resolve(undefined);
          });
        });
      }
    }
  }
});


const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
