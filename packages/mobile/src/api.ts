import { Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { Snapshot } from "../../contracts/src";
export const defaultUrl =
  process.env.EXPO_PUBLIC_DEMO_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000"
    : "http://localhost:4000");
/**
 * The device this app runs on, sent as the X-Device header so operations can
 * see what each customer and driver uses. Built from React Native's platform
 * constants (no extra native module): Android reports brand and model; iOS
 * reports the OS version and whether it is an iPhone or iPad.
 */
const deviceHeader = (() => {
  try {
    const c: Record<string, any> = (Platform as any).constants || {};
    const { width, height } = Dimensions.get("screen");
    const tablet =
      Platform.OS === "ios"
        ? c.interfaceIdiom === "pad"
        : Math.min(width, height) >= 600;
    const info =
      Platform.OS === "android"
        ? {
            brand: c.Brand || c.Manufacturer,
            model: c.Model,
            osVersion: c.Release || String(Platform.Version),
          }
        : Platform.OS === "ios"
          ? {
              brand: "Apple",
              model: tablet ? "iPad" : "iPhone",
              osVersion: String(c.osVersion || Platform.Version),
            }
          : { brand: undefined, model: "Web browser", osVersion: undefined };
    return encodeURIComponent(
      JSON.stringify({
        platform: Platform.OS,
        type: Platform.OS === "web" ? "browser" : tablet ? "tablet" : "phone",
        ...info,
        name: Constants.deviceName,
        appVersion: Constants.expoConfig?.version,
      }),
    );
  } catch {
    return undefined;
  }
})();
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export class Client {
  constructor(
    public url: string,
    public account: string,
    public token?: string,
  ) {}
  async request<T>(path: string, body?: unknown, key?: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(this.url.replace(/\/$/, "") + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token || "demo-" + this.account}`,
          ...(key ? { "Idempotency-Key": key } : {}),
          ...(deviceHeader ? { "X-Device": deviceHeader } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new ApiError(
          data.error?.code || "REQUEST_FAILED",
          data.error?.message || "This action could not be completed.",
        );
      return data as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(
        "CONNECTION_ERROR",
        "Cannot reach the demo service. Check your connection and service address, then try again.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  async placeOrder(body: unknown, key: string) {
    await AsyncStorage.setItem(
      "pending-order-" + this.account,
      JSON.stringify({ body, key }),
    );
    try {
      const result = await this.request<import("../../contracts/src").Order>(
        "/orders",
        body,
        key,
      );
      await AsyncStorage.removeItem("pending-order-" + this.account);
      return result;
    } catch (e) {
      if (e instanceof ApiError && e.code !== "CONNECTION_ERROR")
        await AsyncStorage.removeItem("pending-order-" + this.account);
      throw e;
    }
  }
  async snapshot() {
    const pending = await AsyncStorage.getItem("pending-order-" + this.account);
    if (pending) {
      const { body, key } = JSON.parse(pending);
      await this.placeOrder(body, key);
    }
    return this.request<Snapshot>("/snapshot");
  }
}
export const newKey = () =>
  `request-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
