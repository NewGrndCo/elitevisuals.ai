import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Treat data as fresh for 60s — stops the constant background refetches
        // that were making sections disappear and reappear during navigation.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
      dehydrate: {
        // Include in-flight queries so loader prefetches that haven't resolved
        // yet still serialize to the client.
        shouldDehydrateQuery: (q) =>
          q.state.status === "success" || q.state.status === "pending",
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // With TanStack Query owning cache freshness, let Query decide instead of
    // the router serving stale preload data.
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    // Serialize React Query cache from server to client so SSR'd content stays
    // intact through hydration — prevents the flash of fallback/default copy
    // before client-side queries resolve.
    dehydrate: (): any => ({ queryClient: dehydrate(queryClient) }),
    hydrate: (d: any) => {
      hydrate(queryClient, d.queryClient);
    },
  });

  return router;
};
