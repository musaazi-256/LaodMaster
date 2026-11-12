import { typography } from "./mobileDesign";
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDemo } from "./state";
import { C, Icon, type IconName } from "./ui";
import { Home } from "./Home";
import { Orders, Earnings, Payments } from "./Lists";
import { Account } from "./Account";
const Tab = createBottomTabNavigator();
export function Tabs() {
  const { role } = useDemo();
  const insets = useSafeAreaInsets();
  const driver = role === "driver";
  const icons: Record<string, IconName> = {
    Home: "home-outline",
    Orders: "cube-outline",
    Deliveries: "car-outline",
    Payments: "card-outline",
    Earnings: "wallet-outline",
    Account: "person-outline",
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: C.line,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { ...typography.caption, fontWeight: "600" },
        tabBarIcon: ({ color, focused }) => (
          <View
            style={{
              backgroundColor: focused ? C.mint : "transparent",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Icon name={icons[route.name]} size={21} color={color} />
          </View>
        ),
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
