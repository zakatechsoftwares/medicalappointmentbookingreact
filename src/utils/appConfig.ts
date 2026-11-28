import { useEffect, useState } from "react";
import { api } from "../api";

export interface AppConfig {
  /** True when the server has a Daily.co key, so video visits can be offered */
  video: boolean;
}

let cached: Promise<AppConfig> | null = null;

/** Server features, fetched once per page load. Defaults to "off" until known. */
export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>({ video: false });
  useEffect(() => {
    if (!cached) {
      cached = api<AppConfig>("/api/config").catch(() => {
        cached = null;
        return { video: false };
      });
    }
    let alive = true;
    cached.then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
