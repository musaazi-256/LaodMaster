import { typography } from "./mobileDesign";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  NavigationContainer,
  useNavigation,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { OrderChat } from "./CargoDelivery";
import { OrderStart } from "./OrderStart";
import { CargoOrderWizard } from "./CargoOrderWizard";
import { Tabs } from "./Tabs";
import { Auth } from "./Auth";
import {
  Documents,
  Vehicle,
  PaymentMethods,
  SavedPlaces,
  Notifications,
  Preferences,
  Password,
  PayoutRequests,
  Rewards,
  SupportCases,
} from "./Features";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { setToolsButtonVisible } from "expo-dev-client";
import type { Role } from "../../contracts/src";
import type { RootStack } from "./navigation";
import { CelebrationHost } from "./celebrate";
import { Provider, useDemo } from "./state";
import { C, Icon } from "./ui";

import { Help, Profile, Settings, Support } from "./Account";
import { Locations } from "./Ordering";
import { Offer, OrderDetail } from "./Delivery";
import { Payment } from "./Payment";
import { RequestHistory } from "./Lists";
const Stack = createNativeStackNavigator<RootStack>();
function ConnectionBanner() {
  const { error, data, role } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  if (!error && data) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => nav.navigate("Settings")}
      style={{
        backgroundColor: error ? "#FFF0D5" : C.mint,
        paddingHorizontal: 18,
        paddingVertical: 9,
      }}
    >
      <Text
        style={{
          ...typography.caption,
          color: error ? "#865515" : C.green,
          fontWeight: "600",
        }}
      >
        {error
          ? "Service unreachable · Tap to check connection"
          : "Connecting to demo service… · Connection settings"}
      </Text>
      {error && (
        <Text style={{ ...typography.caption, color: C.muted }}>
          Start npm run demo.{" "}
          {role === "customer"
            ? "Your draft stays on this device."
            : "Existing delivery progress is preserved."}
        </Text>
      )}
    </Pressable>
  );
}
function Navigator() {
  const { data, role, token, ready } = useDemo();
  const ref = useNavigationContainerRef<RootStack>();
  const [currentRoute, setCurrentRoute] = useState("Main");
  const offer = role === "driver" ? data?.offers[0] : undefined;
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  if (!token) return <Auth />;
  return (
    <NavigationContainer
      ref={ref}
      onStateChange={() =>
        setCurrentRoute(ref.getCurrentRoute()?.name || "Main")
      }
    >
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        <ConnectionBanner />
        {offer && currentRoute !== "Offer" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (ref.isReady()) ref.navigate("Offer", { id: offer.id });
            }}
            style={{
              padding: 12,
              backgroundColor: C.green,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                color: "white",
                ...typography.caption,
              }}
            >
              New cargo request · {offer.quote.pickup.name}
            </Text>
            <Icon name="arrow-forward" color="white" size={18} />
          </Pressable>
        )}
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: C.paper },
            headerTintColor: C.ink,
            headerShadowVisible: false,
            headerTitleStyle: {
              fontSize: typography.label.fontSize,
              fontWeight: "600",
            },
            contentStyle: { backgroundColor: C.paper },
          }}
        >
          <Stack.Screen
            name="Main"
            component={Tabs}
            options={{
              headerShown: false,
              contentStyle: {
                backgroundColor: role === "customer" ? "white" : C.paper,
              },
            }}
          />
          {[
            ["Vehicle", Vehicle, "Vehicle details"],
            ["PaymentMethods", PaymentMethods, "Payment methods"],
            ["SavedPlaces", SavedPlaces, "Saved places"],
            ["Notifications", Notifications, "Updates"],
            ["Preferences", Preferences, "Settings & privacy"],
            ["Password", Password, "Change password"],
            ["PayoutRequests", PayoutRequests, "Payout requests"],
            ["Rewards", Rewards, "Referrals & rewards"],
            ["SupportCases", SupportCases, "Support history"],
            ["RequestHistory", RequestHistory, "Request history"],
          ].map(([name, component, title]) => (
            <Stack.Screen
              key={name as string}
              name={name as any}
              component={component as any}
              options={{ title: title as string }}
            />
          ))}
          <Stack.Screen
            name="OrderStart"
            component={OrderStart}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Locations"
            component={Locations}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChooseTruck"
            component={CargoOrderWizard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderChat"
            component={OrderChat}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Order"
            component={OrderDetail}
            options={({ route }) => ({
              headerShown: !data?.orders.find((o) => o.id === route.params.id)
                ?.cargoPlan,
              title: "Order details",
            })}
          />
          <Stack.Screen
            name="Offer"
            component={Offer}
            options={({ route }) => ({
              headerShown: !data?.offers.find((o) => o.id === route.params.id)
                ?.cargoPlan,
              title: "Review request",
            })}
          />
          <Stack.Screen
            name="Payment"
            component={Payment}
            options={({ route }) => ({
              headerShown: !data?.orders.find((o) => o.id === route.params.id)
                ?.cargoPlan,
              title: "Payment",
            })}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{ title: "Demo settings" }}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
            options={{ title: "Profile" }}
          />
          <Stack.Screen
            name="Support"
            component={Support}
            options={{ title: "Support" }}
          />
          <Stack.Screen
            name="Verification"
            component={Documents}
            options={{ title: "Vehicle & verification" }}
          />
          <Stack.Screen
            name="Help"
            component={Help}
            options={{ title: "Help centre" }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
function AppFrame({ role }: { role: Role }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (__DEV__ && Platform.OS !== "web") setToolsButtonVisible(false);
  }, []);
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: role === "customer" ? "white" : C.paper,
      }}
    >
      <StatusBar style="dark" />
      <CelebrationHost>
        <Provider role={role}>
          <Navigator />
        </Provider>
      </CelebrationHost>
    </View>
  );
}
export function MobileApp({ role }: { role: Role }) {
  return (
    <SafeAreaProvider>
      <AppFrame role={role} />
    </SafeAreaProvider>
  );
}
