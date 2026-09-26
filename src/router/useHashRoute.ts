import { useEffect, useState } from "react";

export type AppRoute = "console" | "receipt" | "trace02";

const routeByHash: Record<string, AppRoute> = {
  "": "console",
  "#/": "console",
  "#/receipt": "receipt",
  "#/trace/02": "trace02",
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
  if (route === "receipt") {
    window.location.hash = "/receipt";
    return;
  }

  if (route === "trace02") {
    window.location.hash = "/trace/02";
    return;
  }

  window.location.hash = "/";
}

function getRouteFromHash(hash: string): AppRoute {
  return routeByHash[hash] ?? "console";
}
