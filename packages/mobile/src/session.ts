import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const sessionStorage = {
  get: (role: string) =>
    Platform.OS === "web"
      ? AsyncStorage.getItem("session-" + role)
      : SecureStore.getItemAsync("loadmaster-" + role),
  set: (role: string, token: string) =>
    Platform.OS === "web"
      ? AsyncStorage.setItem("session-" + role, token)
      : SecureStore.setItemAsync("loadmaster-" + role, token),
  remove: (role: string) =>
    Platform.OS === "web"
      ? AsyncStorage.removeItem("session-" + role)
      : SecureStore.deleteItemAsync("loadmaster-" + role),
};
