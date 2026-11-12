import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import type { Role, Snapshot } from "../../contracts/src";
import { ApiError, Client, defaultUrl } from "./api";
import { sessionStorage } from "./session";
import { useCelebrate, type Celebration } from "./celebrate";
interface State {
  role: Role;
  account: string;
  url: string;
  token: string | null;
  client: Client;
  data: Snapshot | null;
  error: string | null;
  refreshedAt: number | null;
  ready: boolean;
  refresh: () => Promise<void>;
  configure: (account: string, url: string) => Promise<void>;
  signIn: (
    session: { token: string; account: string },
    url?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<State | null>(null);
export function Provider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState(role + "-1");
  const [url, setUrl] = useState(defaultUrl);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const generation = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);
  const queued = useRef<Promise<void> | null>(null);
  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem("loadmaster-" + role),
      sessionStorage.get(role),
    ])
      .then(([raw, t]) => {
        if (raw) {
          const v = JSON.parse(raw);
          setAccount(v.account || role + "-1");
          setUrl(v.url || defaultUrl);
        }
        setToken(t);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [role]);
  const client = useMemo(
    () => new Client(url, account, token || undefined),
    [url, account, token],
  );
  const logout = useCallback(async () => {
    generation.current++;
    setToken(null);
    setData(null);
    await sessionStorage.remove(role);
  }, [role]);
  const epoch = generation.current;
  const refresh = useCallback(async (): Promise<void> => {
    if (epoch !== generation.current || !ready || !token) return;
    if (inflight.current) {
      // A poll that is already running may have started before the caller's
      // action, so queue one follow-up refresh instead of returning stale data.
      queued.current ??= inflight.current.then(() => {
        queued.current = null;
        return refresh();
      });
      return queued.current;
    }
    const gen = generation.current;
    const work = (async () => {
      try {
        const result = await client.snapshot();
        if (gen === generation.current) {
          setData(result);
          setError(null);
          setRefreshedAt(Date.now());
        }
      } catch (e) {
        if (gen === generation.current) {
          setError((e as Error).message);
          if (
            e instanceof ApiError &&
            ["SESSION_EXPIRED", "SESSION_REVOKED", "SESSION_INVALID"].includes(
              e.code,
            )
          )
            await logout();
        }
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = work;
    return work;
  }, [client, ready, token, logout, epoch]);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 2000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [refresh]);
  const signIn = async (
    session: { token: string; account: string },
    address = url,
  ) => {
    generation.current++;
    // Publish the session only after secure persistence succeeds.
    await AsyncStorage.setItem(
      "loadmaster-" + role,
      JSON.stringify({ account: session.account, url: address }),
    );
    await sessionStorage.set(role, session.token);
    setAccount(session.account);
    setUrl(address);
    setToken(session.token);
    setData(null);
    setError(null);
    setRefreshedAt(null);
  };
  const configure = async (a: string, u: string) =>
    signIn({ account: a, token: "demo-" + a }, u);
  return (
    <Context.Provider
      value={{
        role,
        account,
        url,
        token,
        client,
        data,
        error,
        refreshedAt,
        ready,
        refresh,
        configure,
        signIn,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const v = useContext(Context);
  if (!v) throw new Error("Provider missing");
  return v;
}
export function useAction() {
  const { refresh } = useDemo();
  const celebrate = useCelebrate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  /**
   * Runs an action, refreshes shared data, then (optionally) celebrates.
   * `success` may depend on the result, e.g. only celebrate a payment that
   * actually confirmed; return undefined to skip.
   */
  const run = async <T,>(
    fn: () => Promise<T>,
    success?: Celebration | ((result: T) => Celebration | undefined),
  ): Promise<T | undefined> => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      await refresh();
      const c = typeof success === "function" ? success(result) : success;
      if (c) celebrate(c);
      else
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      return result;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}
