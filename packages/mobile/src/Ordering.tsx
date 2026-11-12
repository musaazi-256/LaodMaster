import { MobileModal } from "./MobileModal";
import { typography, metrics } from "./mobileDesign";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  methodLabels,
  availablePaymentMethods,
  money,
  type Method,
  type Place,
  type Quote,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { newKey } from "./api";
import {
  Badge,
  Body,
  Button,
  C,
  Card,
  ErrorBox,
  Field,
  Icon,
  Label,
  Row,
  Screen,
  Section,
  Title,
  s,
} from "./ui";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FigmaIcon } from "./figmaAssets";
import { OrderLocationCanvas } from "./OrderLocationCanvas";
import { TruckArt } from "./MapCanvas";
export function Locations({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "Locations">) {
  const { data, account, client } = useDemo();
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<"pickup" | "destination" | null>(
    null,
  );
  const repeated = data?.orders.find((o) => o.id === route.params?.repeatId);
  const [pickup, setPickup] = useState<Place | undefined>(
    repeated?.quote.pickup,
  );
  const [destination, setDestination] = useState<Place | undefined>(
    repeated?.quote.destination,
  );
  const [target, setTarget] = useState<"pickup" | "destination">("pickup");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date(Date.now() + 3600000));
  const [picker, setPicker] = useState<"date" | "time" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scheduled = route.params?.scheduled;
  useEffect(() => {
    if (!repeated)
      AsyncStorage.getItem("route-draft-" + account)
        .then((raw) => {
          if (raw) {
            const d = JSON.parse(raw);
            if (d.pickup && d.destination && d.pickup.id !== d.destination.id) {
              setPickup(d.pickup);
              setDestination(d.destination);
              return;
            }
          }
          const defaultPick =
            data?.places.find((p) => p.name.toLowerCase().includes("ntinda")) ||
            data?.places[0];
          const defaultDest =
            data?.places.find(
              (p) =>
                p.id !== defaultPick?.id &&
                (p.name.toLowerCase().includes("nakawa") ||
                  p.name.toLowerCase().includes("kampala")),
            ) ||
            data?.places.find((p) => p.id !== defaultPick?.id) ||
            data?.places[1];
          setPickup(defaultPick);
          setDestination(defaultDest);
        })
        .catch(() => {});
  }, [account, repeated, data?.places]);
  const select = (p: Place, kind = target) => {
    const nextPickup = kind === "pickup" ? p : pickup;
    const nextDestination = kind === "destination" ? p : destination;
    setSearchOpen(false);
    setPickup(nextPickup);
    setDestination(nextDestination);
    setSearch("");
    if (kind === "pickup") setTarget("destination");
    setError(null);
    void AsyncStorage.setItem(
      "route-draft-" + account,
      JSON.stringify({ pickup: nextPickup, destination: nextDestination }),
    ).catch(() => {});
  };
  const findLocation = async (current: boolean, kind = target) => {
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Location access is disabled. You can still choose a place manually from the list.",
        );
      let point: { latitude: number; longitude: number };
      if (current) {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        point = position.coords;
      } else {
        if (search.trim().length < 3)
          throw new Error("Enter a place name to search.");
        const results = await Location.geocodeAsync(search);
        if (!results.length)
          throw new Error(
            "This place could not be found. Try another name or choose a demo location.",
          );
        point = results[0];
      }
      const place = await client.request<Place>("/account/location", {
        name: current ? "Selected current location" : search,
        ...point,
      });
      select(place, kind);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const next = () => {
    let p = pickup;
    let d = destination;
    const places = data?.places || [];
    if (!p) {
      p =
        places.find((x) => x.name.toLowerCase().includes("ntinda")) ||
        places[0];
    }
    if (!d || (p && d.id === p.id)) {
      d =
        places.find(
          (x) =>
            x.id !== p?.id &&
            (x.name.toLowerCase().includes("nakawa") ||
              x.name.toLowerCase().includes("kampala")),
        ) ||
        places.find((x) => x.id !== p?.id) ||
        places[1];
    }
    if (p) setPickup(p);
    if (d) setDestination(d);
    if (!p || !d || p.id === d.id) {
      setError("Choose different pickup and destination locations.");
      return;
    }
    if (scheduled && date.getTime() < Date.now() + 60000) {
      setError("Choose a pickup time at least one minute ahead.");
      return;
    }
    navigation.navigate("ChooseTruck", {
      repeatId: route.params?.repeatId,
      truckId: route.params?.truckId,
      pairCode: route.params?.pairCode,
      pickupId: p.id,
      destinationId: d.id,
      scheduledAt: scheduled ? date.toISOString() : undefined,
    });
  };
  const openSearch = (kind: "pickup" | "destination") => {
    setTarget(kind);
    setSearch("");
    setSearchOpen(true);
  };
  const recentPlaces = Array.from(
    new Map(
      (data?.orders || [])
        .slice()
        .reverse()
        .map((o) => [o.quote.destination.id, o.quote.destination]),
    ).values(),
  );
  const suggestions = recentPlaces.length
    ? recentPlaces
    : (data?.places || []).filter((p) => p.id !== pickup?.id).slice(0, 4);
  return (
    <SafeAreaView edges={["left", "right"]} style={locationStyles.page}>
      <View style={locationStyles.mapArea}>
        <OrderLocationCanvas
          pickup={pickup}
          destination={destination}
          onSelect={
            mapTarget
              ? (point) => {
                  void client
                    .request<Place>("/account/location", {
                      ...point,
                      name: "Selected map location",
                    })
                    .then((p) => {
                      select(p, mapTarget);
                      setMapTarget(null);
                    })
                    .catch((e) => setError(e.message));
                }
              : undefined
          }
        />
        <View style={locationStyles.mapControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            hitSlop={6}
            style={locationStyles.mapButton}
          >
            <FigmaIcon name="order-lucide-icons-arrow-left" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            onPress={() => void findLocation(true, "pickup")}
            hitSlop={6}
            style={locationStyles.mapButton}
          >
            <FigmaIcon name="order-lucide-icons-navigation" />
          </Pressable>
        </View>
      </View>
      <View
        style={[
          locationStyles.sheet,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={locationStyles.handle} />
        <ScrollView
          style={{ flexGrow: 0 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8 }}
        >
          <View style={{ paddingBottom: 8, gap: 2 }}>
            <Text accessibilityRole="header" style={locationStyles.title}>
              {scheduled
                ? "Schedule your pickup."
                : route.params?.estimateOnly
                  ? "Estimate your move."
                  : "Move anything, anywhere."}
            </Text>
            <Text style={locationStyles.subtitle}>
              Order a truck for your cargo. Fast, reliable and affordable.
            </Text>
          </View>
          <View style={locationStyles.fieldsRow}>
            <View style={locationStyles.routeLine}>
              <FigmaIcon name="order-radio-base" />
              <View style={{ width: 1, height: 46 }}>
                <View
                  style={{
                    position: "absolute",
                    top: 22.5,
                    left: -22.5,
                    transform: [{ rotate: "90deg" }],
                  }}
                >
                  <FigmaIcon name="order-line" />
                </View>
              </View>
              <FigmaIcon name="order-lucide-icons-circle-check-big" />
            </View>
            <View style={{ flex: 1, gap: 16 }}>
              {(["pickup", "destination"] as const).map((kind) => (
                <View key={kind} style={locationStyles.field}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      kind === "pickup"
                        ? "Choose pickup location"
                        : "Choose destination"
                    }
                    onPress={() => openSearch(kind)}
                    style={locationStyles.fieldMain}
                  >
                    <FigmaIcon name="order-icon-leading" />
                    <View style={{ flex: 1 }}>
                      <Text style={locationStyles.fieldLabel}>
                        {kind === "pickup"
                          ? "Where is the cargo?"
                          : "Where is it going?"}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          locationStyles.fieldValue,
                          !(kind === "pickup" ? pickup : destination) && {
                            color: "#64748B",
                          },
                        ]}
                      >
                        {(kind === "pickup" ? pickup : destination)?.name ||
                          (kind === "pickup"
                            ? "Choose pickup"
                            : "Enter destination")}
                      </Text>
                    </View>
                  </Pressable>
                  {kind === "pickup" && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Locate cargo pickup"
                      onPress={() => void findLocation(true, "pickup")}
                      hitSlop={8}
                      style={locationStyles.locate}
                    >
                      <FigmaIcon name="order-lucide-icons-locate-fixed" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
          {scheduled && (
            <View style={{ gap: 8, paddingVertical: 8 }}>
              <Text style={locationStyles.recentTitle}>Pickup date & time</Text>
              <Text style={locationStyles.subtitle}>
                {date.toLocaleString()}
              </Text>
              <Row>
                <Button
                  title="Change date"
                  secondary
                  onPress={() => setPicker("date")}
                />
                <Button
                  title="Change time"
                  secondary
                  onPress={() => setPicker("time")}
                />
              </Row>
              {picker && (
                <>
                  <DateTimePicker
                    value={date}
                    mode={picker}
                    minimumDate={picker === "date" ? new Date() : undefined}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_event, value) => {
                      if (Platform.OS !== "ios") setPicker(null);
                      if (value) setDate(value);
                    }}
                  />
                  {Platform.OS === "ios" && (
                    <Button
                      title="Done"
                      secondary
                      onPress={() => setPicker(null)}
                    />
                  )}
                </>
              )}
            </View>
          )}
          <Text style={locationStyles.recentTitle}>
            {recentPlaces.length
              ? "Recent destinations"
              : "Suggested destinations"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            {suggestions.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Set destination to ${p.name}`}
                onPress={() => select(p, "destination")}
                hitSlop={{ top: 10, bottom: 10 }}
                style={locationStyles.chip}
              >
                <Text style={locationStyles.chipText}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ErrorBox message={error} />
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to truck selection"
          onPress={next}
          style={locationStyles.continue}
        >
          <Text style={locationStyles.continueText}>Continue</Text>
        </Pressable>
      </View>
      <MobileModal
        visible={searchOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={locationStyles.searchHeader}>
              <Text
                style={{
                  ...typography.section,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Choose {target}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close location search"
                onPress={() => setSearchOpen(false)}
                style={{ padding: 12 }}
              >
                <Icon name="close" />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, gap: 12 }}
            >
              <TextInput
                accessibilityLabel={`Search ${target}`}
                placeholder="Search a place or area"
                value={search}
                onChangeText={setSearch}
                autoFocus
                style={locationStyles.searchInput}
              />
              <ErrorBox message={error} />
              <Button
                title="Choose on map"
                secondary
                onPress={() => {
                  setMapTarget(target);
                  setSearchOpen(false);
                }}
              />
              <Button
                title="Use my current location"
                secondary
                icon="locate-outline"
                onPress={() => void findLocation(true)}
              />
              {data?.savedPlaces?.map((saved) => {
                const place = data.places.find((p) => p.id === saved.placeId);
                return place ? (
                  <Pressable
                    key={saved.id}
                    accessibilityRole="button"
                    onPress={() => select(place)}
                    style={locationStyles.searchResult}
                  >
                    <Icon name="bookmark-outline" color={C.green} />
                    <Text style={locationStyles.resultName}>{saved.label}</Text>
                  </Pressable>
                ) : null;
              })}
              {data?.places
                .filter((p) =>
                  `${p.name} ${p.detail}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${p.name}`}
                    onPress={() => select(p)}
                    style={locationStyles.searchResult}
                  >
                    <FigmaIcon name="order-icon-leading" />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={locationStyles.resultName}>{p.name}</Text>
                      <Text style={locationStyles.subtitle}>{p.detail}</Text>
                    </View>
                  </Pressable>
                ))}
              {search.trim().length >= 3 && (
                <Button
                  title="Search this place on device"
                  secondary
                  onPress={() => void findLocation(false)}
                />
              )}
              <Text style={locationStyles.subtitle}>
                Choose the cargo location. Device search and location access
                depend on permission and the demo service area.
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </MobileModal>
    </SafeAreaView>
  );
}
const locationStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  mapArea: { flex: 1, minHeight: 180 },
  mapControls: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mapButton: {
    height: metrics.touch,
    width: metrics.touch,
    borderRadius: 21,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sheet: {
    paddingTop: 12,
    paddingHorizontal: 22,
    gap: 14,
    borderTopWidth: 1,
    borderColor: "#EAECEF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "white",
    maxHeight: "65%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    height: 5,
    width: 48,
    borderRadius: 100,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
  },
  title: {
    ...typography.headline,

    letterSpacing: -0.5,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: { ...typography.subhead, color: "#6B7280" },
  fieldsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 6,
  },
  routeLine: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  fieldMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
  },
  fieldLabel: { ...typography.caption, color: "#6B7280" },
  fieldValue: {
    ...typography.subhead,

    fontWeight: "600",
    color: "#111827",
  },
  locate: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#EEF7F2",
    minHeight: 30,
    minWidth: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  recentTitle: {
    ...typography.subhead,

    fontWeight: "700",
    color: "#111827",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 999,
    minHeight: 28,
    justifyContent: "center",
  },
  chipText: {
    ...typography.caption,

    fontWeight: "600",
    color: "#374151",
  },
  continue: {
    backgroundColor: "#087443",
    minHeight: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  continueText: {
    ...typography.subhead,

    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    minHeight: 52,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    ...typography.body,
    color: "#111827",
    backgroundColor: "#FAFBFA",
  },
  searchResult: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },
  resultName: { ...typography.subhead, color: "#111827", fontWeight: "500" },
});

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{ ...typography.subhead, fontWeight: "600", color: C.ink }}
        >
          {label}
        </Text>
        <Text style={s.small}>
          {value
            ? `${value} helper${value > 1 ? "s" : ""}`
            : "I’ll arrange handling"}
        </Text>
      </View>
      <Row>
        {[-1, 1].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n < 0 ? "Remove" : "Add"} ${label.toLowerCase()}`}
            disabled={value + n < 0 || value + n > 2}
            onPress={() => onChange(value + n)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.line,
              alignItems: "center",
              justifyContent: "center",
              opacity: value + n < 0 || value + n > 2 ? 0.3 : 1,
            }}
          >
            <Icon name={n < 0 ? "remove" : "add"} size={20} />
          </Pressable>
        ))}
      </Row>
    </Row>
  );
}
export function ChooseTruck({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "ChooseTruck">) {
  const { data, client, account } = useDemo();
  const repeated = data?.orders.find((o) => o.id === route.params.repeatId);
  const [truckId, setTruckId] = useState(repeated?.quote.truckId || "small");
  const [loading, setLoading] = useState(repeated?.quote.loading || 0);
  const [offloading, setOffloading] = useState(repeated?.quote.offloading || 0);
  const [method, setMethod] = useState<Method>(
    data?.profile.paymentMethods?.find((m) => m.isDefault)?.kind || "mtn",
  );
  const [optional, setOptional] = useState(false);
  const [cargo, setCargo] = useState(repeated?.cargo || "");
  const [recipient, setRecipient] = useState(repeated?.recipient || "");
  const [phone, setPhone] = useState(repeated?.recipientPhone || "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pricing, setPricing] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [refreshPrice, setRefreshPrice] = useState(0);
  const [requestKey] = useState(newKey);
  const action = useAction();
  const seq = useRef(0);
  useEffect(() => {
    const n = ++seq.current;
    setPricing(true);
    setPriceError(null);
    setQuote(null);
    client
      .request<Quote>("/quotes", {
        ...route.params,
        truckId,
        loading,
        offloading,
      })
      .then((q) => {
        if (n === seq.current) setQuote(q);
      })
      .catch((e) => {
        if (n === seq.current) setPriceError(e.message);
      })
      .finally(() => {
        if (n === seq.current) setPricing(false);
      });
    return () => {
      seq.current++;
    };
  }, [client, route.params, truckId, loading, offloading, refreshPrice]);
  const place = async () => {
    if (!quote || action.busy) return;
    const order = await action.run(() =>
      client.placeOrder(
        {
          quoteId: quote.id,
          method,
          cargo,
          recipient,
          recipientPhone: phone,
          scheduledAt: route.params.scheduledAt,
        },
        requestKey,
      ),
    );
    if (order) {
      await AsyncStorage.removeItem("route-draft-" + account);
      navigation.replace("Order", { id: order.id });
    }
  };
  return (
    <Screen
      footer={
        <>
          <ErrorBox message={action.error} />
          <Row style={{ justifyContent: "space-between" }}>
            <View>
              <Label>AGREED DEMO TOTAL</Label>
              <Text
                style={{
                  ...typography.headline,
                  fontWeight: "700",
                  color: C.ink,
                }}
              >
                {quote
                  ? money(quote.total)
                  : pricing
                    ? "Getting price…"
                    : "Price unavailable"}
              </Text>
            </View>
            <Badge tone="neutral">
              {route.params.scheduledAt ? "Scheduled" : "Order now"}
            </Badge>
          </Row>
          <Button
            title="Order a truck"
            busy={action.busy}
            disabled={!quote || pricing}
            onPress={() => void place()}
          />
        </>
      }
    >
      <Label>THE RIGHT TRUCK FOR YOUR LOAD</Label>
      <Title>Choose your move.</Title>
      <Card>
        <Row>
          <Icon name="navigate-outline" color={C.green} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ ...typography.subhead, color: C.ink }}>
              {data?.places.find((p) => p.id === route.params.pickupId)?.name}
            </Text>
            <Text style={{ ...typography.subhead, color: C.muted }}>
              to{" "}
              {
                data?.places.find((p) => p.id === route.params.destinationId)
                  ?.name
              }
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit route"
            onPress={() => navigation.goBack()}
            style={{ padding: 10 }}
          >
            <Icon name="pencil-outline" size={18} />
          </Pressable>
        </Row>
      </Card>
      {data?.trucks.map((t) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: truckId === t.id }}
          key={t.id}
          disabled={action.busy}
          onPress={() => setTruckId(t.id)}
        >
          <Card
            style={{
              borderColor: truckId === t.id ? C.green : C.line,
              backgroundColor: truckId === t.id ? "#F0F7EA" : "white",
              borderWidth: truckId === t.id ? 2 : 1,
            }}
          >
            <Row>
              <TruckArt
                size={74}
                color={truckId === t.id ? C.green : "#73887D"}
              />
              <View style={{ flex: 1, gap: 5 }}>
                <Title small>{t.name}</Title>
                <Text
                  style={{
                    fontWeight: "600",
                    color: C.green,
                    ...typography.caption,
                  }}
                >
                  {t.capacity}
                </Text>
                <Text style={s.small}>{t.body}</Text>
              </View>
              <Icon
                name={truckId === t.id ? "radio-button-on" : "radio-button-off"}
                color={truckId === t.id ? C.green : C.muted}
              />
            </Row>
          </Card>
        </Pressable>
      ))}
      <Section title="Loading & offloading" />
      <Card>
        <Counter label="At pickup" value={loading} onChange={setLoading} />
        <View style={s.divider} />
        <Counter
          label="At destination"
          value={offloading}
          onChange={setOffloading}
        />
        <Text style={s.small}>
          Demo: {money(data?.helperRate || 12000)} per helper, per location.
          Standard accessible loads only. Driver assistance is not included
          unless selected.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Support", {})}
        >
          <Text style={s.link}>
            Heavy items, stairs or equipment? Ask for help →
          </Text>
        </Pressable>
      </Card>
      <Section title="Pay in the app" />
      <Body muted>
        Choose now. Payment is requested after delivery. No real money is
        charged.
      </Body>
      <Card>
        {availablePaymentMethods(data)
          .filter((m) => ["mtn", "airtel", "card"].includes(m))
          .map((m, i) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: method === m }}
              key={m}
              onPress={() => setMethod(m)}
            >
              <Row style={{ paddingVertical: 10 }}>
                <View
                  style={[
                    s.iconCircle,
                    {
                      backgroundColor:
                        m === "mtn"
                          ? "#FFF4BE"
                          : m === "airtel"
                            ? "#FDE8E8"
                            : C.mint,
                    },
                  ]}
                >
                  <Icon
                    name={
                      m === "card" ? "card-outline" : "phone-portrait-outline"
                    }
                    color={m === "airtel" ? "#AA3038" : C.ink}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontWeight: "600",
                      ...typography.subhead,
                      color: C.ink,
                    }}
                  >
                    {methodLabels[m]}
                  </Text>
                  <Text style={s.small}>
                    {m === "card"
                      ? "Demo card ending 4242"
                      : "Demo account ending 0111"}
                  </Text>
                </View>
                <Icon
                  name={method === m ? "radio-button-on" : "radio-button-off"}
                  color={method === m ? C.green : C.muted}
                />
              </Row>
              {i < 2 && <View style={s.divider} />}
            </Pressable>
          ))}
      </Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: optional }}
        onPress={() => setOptional(!optional)}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Title small>
            Cargo & recipient <Text style={s.small}>(optional)</Text>
          </Title>
          <Icon name={optional ? "chevron-up" : "chevron-down"} size={20} />
        </Row>
      </Pressable>
      {optional && (
        <Card>
          <Field
            label="What are you moving? (optional)"
            value={cargo}
            onChangeText={setCargo}
            placeholder="e.g. 12 boxes of shop stock"
            multiline
          />
          <Field
            label="Recipient name (optional)"
            value={recipient}
            onChangeText={setRecipient}
          />
          <Field
            label="Recipient phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Card>
      )}
      <Card>
        <Label>YOUR PRICE BREAKDOWN</Label>
        <ErrorBox
          message={priceError}
          onRetry={() => setRefreshPrice((n) => n + 1)}
        />
        {quote && (
          <>
            {[
              ["Transport", quote.transport],
              ["Loading help", quote.loadingFee],
              ["Offloading help", quote.offloadingFee],
            ].map(([label, amount]) => (
              <Row
                key={String(label)}
                style={{ justifyContent: "space-between" }}
              >
                <Text style={s.body}>{label}</Text>
                <Text style={s.body}>{money(Number(amount))}</Text>
              </Row>
            ))}
            <View style={s.divider} />
            <Row style={{ justifyContent: "space-between" }}>
              <Title small>Total</Title>
              <Title small>{money(quote.total)}</Title>
            </Row>
            <Text style={s.small}>
              Approx. {quote.distance} km from demo coordinates. This total
              includes the selected handling services. All rates are provisional
              demo inputs.
            </Text>
          </>
        )}
        <Button
          secondary
          title={pricing ? "Refreshing price…" : "Refresh price"}
          disabled={pricing || action.busy}
          onPress={() => setRefreshPrice((n) => n + 1)}
        />
      </Card>
      <Body muted>
        By ordering, you confirm the route, truck and services above. The quote
        is fixed for this demo; any service changes need your agreement.
      </Body>
    </Screen>
  );
}
