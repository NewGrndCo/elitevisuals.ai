import { QueryClient } from "@tanstack/react-query";
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
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Allow Router's preload cache to serve fresh data for 30s instead of
    // re-querying on every hover/preload.
    defaultPreloadStaleTime: 30_000,
    defaultPreload: "intent",
  });

  return router;
};
