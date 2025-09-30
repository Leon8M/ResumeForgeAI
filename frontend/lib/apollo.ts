import { ApolloClient, InMemoryCache, createHttpLink, from, Observable, FetchResult } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "./authStore";

const httpLink = createHttpLink({
  uri: "https://resumeforgeai-zawv.onrender.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  const { accessToken } = useAuthStore.getState();
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `JWT ${accessToken}` : "",
    },
  };
});

const refreshToken = async (): Promise<string> => {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    const { token } = await res.json();
    if (!token) {
      throw new Error("No token returned from refresh");
    }
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch (error) {
    console.error("Failed to refresh token", error);
    useAuthStore.getState().logout();
    throw error;
  }
};

// Use inline typing instead of ErrorResponse
const errorLink = onError(
  ({ graphQLErrors, operation, forward }: { 
    graphQLErrors?: readonly any[]; 
    operation: any; 
    forward: any; 
  }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (
          err.extensions?.code === "invalid-jwt" ||
          err.message.includes("Signature has expired")
        ) {
          return new Observable<FetchResult>((observer) => {
            refreshToken()
              .then((newAccessToken: string) => {
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `JWT ${newAccessToken}`,
                  },
                });

                forward(operation).subscribe({
                  next: observer.next.bind(observer),
                  error: observer.error.bind(observer),
                  complete: observer.complete.bind(observer),
                });
              })
              .catch((error) => {
                observer.error(error);
              });
          });
        }
      }
    }
  }
);

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
