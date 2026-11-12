import React, { useEffect, useState } from "react";
import { Platform, type ImageSourcePropType } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabIcon,
} from "@react-navigation/bottom-tabs/unstable";
import { useDemo } from "./state";
import { C, type IconName } from "./ui";
import { Home } from "./Home";
import { Orders, Earnings, Payments } from "./Lists";
import { Account } from "./Account";
const Tab = createNativeBottomTabNavigator();
const icons: Record<string, IconName> = {
  Home: "home-outline",
  Orders: "cube-outline",
  Deliveries: "car-outline",
  Payments: "card-outline",
  Earnings: "wallet-outline",
  Account: "person-outline",
};
const symbols: Record<string, string> = {
  Home: "house",
  Orders: "shippingbox",
  Deliveries: "truck.box",
  Payments: "creditcard",
  Earnings: "dollarsign.circle",
  Account: "person.crop.circle",
};
export function Tabs() {
  const { role } = useDemo();
  const [images, setImages] = useState<Record<string, ImageSourcePropType>>({});
  useEffect(() => {
    if (Platform.OS === "android")
      void Promise.all(
        Object.entries(icons).map(
          async ([name, icon]) =>
            [name, await Ionicons.getImageSource(icon, 24, C.ink)] as const,
        ),
      )
        .then((items) =>
          setImages(
            Object.fromEntries(items.filter(([, source]) => source)) as Record<
              string,
              ImageSourcePropType
            >,
          ),
        )
        .catch(() => {});
  }, []);
  const driver = role === "driver";
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.muted,
        tabBarIcon:
          Platform.OS === "ios"
            ? ({
                type: "sfSymbol",
                name: symbols[route.name],
              } as NativeBottomTabIcon)
            : images[route.name]
              ? { type: "image", source: images[route.name] }
              : undefined,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name={driver ? "Deliveries" : "Orders"} component={Orders} />
      <Tab.Screen
        name={driver ? "Earnings" : "Payments"}
        component={driver ? Earnings : Payments}
      />
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}
