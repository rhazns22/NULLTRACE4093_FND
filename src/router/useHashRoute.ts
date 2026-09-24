import { useEffect, useState } from "react";

export type AppRoute = "console" | "receipt";

const routeByHash: Record<string, AppRoute> = {
  "": "console",
  "#/": "console",
  "#/receipt": "receipt",
};

export function useHashRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

export function navigateTo(route: AppRoute): void {
  window.location.hash = route === "receipt" ? "/receipt" : "/";
}

function getRouteFromHash(hash: string): AppRoute {
  return routeByHash[hash] ?? "console";
}
