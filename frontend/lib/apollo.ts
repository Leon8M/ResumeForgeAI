import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { useAuthStore } from './authStore';

console.log("GraphQL endpoint:", process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://resumeforgeai-zawv.onrender.com/graphql");

const httpLink = createHttpLink({
  uri: "https://resumeforgeai-zawv.onrender.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const accessToken = useAuthStore.getState().accessToken;
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `JWT ${accessToken}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;