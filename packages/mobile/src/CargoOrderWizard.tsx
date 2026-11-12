import { MobileModal } from "./MobileModal";
import { typography } from "./mobileDesign";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  money,
  methodLabels,
  availablePaymentMethods,
  type CargoContact,
  type CargoItem,
  type CargoStop,
  type Method,
  type Quote,
  type Order,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useDemo, useAction } from "./state";
import { success } from "./successes";
import { newKey } from "./api";
import { ErrorBox, Field, Icon } from "./ui";
import {
  CargoScreen,
  CargoCard,
  CargoButton,
  DidYouKnowBox,
  cs,
} from "./CargoUI";
import { TruckOption } from "./TruckOption";
import { customerTheme as T } from "./customerTheme";
export function CargoOrderWizard(
  props: NativeStackScreenProps<RootStack, "ChooseTruck">,
) {
  const { data } = useDemo();
  return data ? (
    <CargoOrderWizardContent {...props} />
  ) : (
    <CargoScreen
      title="Loading your order"
      back={() => props.navigation.goBack()}
    >
      <Text style={cs.body}>Connecting to your demo account…</Text>
    </CargoScreen>
  );
}
const ensureValidContact = (
  c: Partial<CargoContact> | undefined | null,
  fallbackName: string,
  fallbackPhone: string,
): CargoContact => ({
  name: c?.name && c.name.trim().length >= 2 ? c.name.trim() : fallbackName,
  phone:
    c?.phone && /^\+?[0-9 ()-]{9,18}$/.test(c.phone.trim())
      ? c.phone.trim()
      : fallbackPhone,
});

function CargoOrderWizardContent({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "ChooseTruck">) {
  const { data, client, account } = useDemo();
  const action = useAction();
  const defaultSenderName =
    data?.profile.name && data.profile.name.trim().length >= 2
      ? data.profile.name.trim()
      : "Alex Kamau";
  const defaultSenderPhone =
    data?.profile.phone &&
    /^\+?[0-9 ()-]{9,18}$/.test(data.profile.phone.trim())
      ? data.profile.phone.trim()
      : "+256 700 000 111";

  const me: CargoContact = {
    name: defaultSenderName,
    phone: defaultSenderPhone,
  };
  const makeStop = (id: string, placeId: string): CargoStop => ({
    id,
    place: data!.places.find((p) => p.id === placeId)!,
    helpers: 0,
    recipient: {
      name: "Recipient",
      phone: "+256 700 000 333",
    },
    instructions: "",
    pinRequired: false,
    status: "pending",
  });
  const [stops, setStops] = useState<CargoStop[]>(() => [
    makeStop("stop-1", route.params.destinationId),
  ]);
  const [truckId, setTruckId] = useState(route.params.truckId || "small");
  const [loading, setLoading] = useState(0);
  const [items, setItems] = useState<CargoItem[]>([
    {
      id: "item-1",
      description: "General cargo boxes",
      quantity: 1,
      weightKg: 20,
      dimensions: "",
      fragile: false,
      stopId: "stop-1",
    },
  ]);
  const [sender, setSender] = useState<CargoContact>(me);
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [step, setStep] = useState(0);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState(false);
  const [method, setMethod] = useState<Method>("mtn");
  const [payer, setPayer] = useState<"customer" | "recipient">("customer");
  const [provider, setProvider] = useState("");
  const [pairCode, setPairCode] = useState(route.params.pairCode || "");
  const [paired, setPaired] = useState<{
    name: string;
    vehicle: string;
    plate: string;
  } | null>(null);
  const [terms, setTerms] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<CargoStop[] | null>(null);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = useRef(newKey());
  const draftKey = `cargo-draft-${account}-${route.params.pickupId}-${route.params.destinationId}${route.params.truckId ? `-${route.params.truckId}-${route.params.pairCode || "auto"}` : ""}`;
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(draftKey)
      .then((raw) => {
        const repeated = data?.orders.find(
          (o) => o.id === route.params.repeatId,
        );
        if (repeated?.cargoPlan) {
          setStops(
            repeated.cargoPlan.stops.map((s, i) => ({
              ...s,
              place:
                i === repeated.cargoPlan!.stops.length - 1
                  ? data!.places.find(
                      (p) => p.id === route.params.destinationId,
                    )!
                  : s.place,
              status: "pending",
              reason: undefined,
              deliveredAt: undefined,
            })),
          );
          setItems(repeated.cargoPlan.items);
          setSender(repeated.cargoPlan.sender);
          setTruckId(repeated.quote.truckId);
          setLoading(repeated.quote.loading);
          setPickupInstructions(repeated.cargoPlan.pickupInstructions);
          setMethod(repeated.method);
          return;
        }
        if (repeated) {
          setTruckId(repeated.quote.truckId);
          setLoading(repeated.quote.loading);
          setItems((prev) =>
            prev.map((i) => ({
              ...i,
              description: repeated.cargo || "General cargo boxes",
            })),
          );
          setStops((prev) =>
            prev.map((s, idx) => ({
              ...s,
              helpers: repeated.quote.offloading,
              recipient: ensureValidContact(
                {
                  name: repeated.recipient || "",
                  phone: repeated.recipientPhone || "",
                },
                `Recipient ${idx + 1}`,
                `+256 700 000 ${333 + idx}`,
              ),
            })),
          );
          return;
        }
        if (raw && alive) {
          const d = JSON.parse(raw);
          if (
            d.stops?.every((s: CargoStop) =>
              data?.places.some((p) => p.id === s.place.id),
            )
          ) {
            setStops(
              d.stops.map((s: CargoStop, idx: number) => ({
                ...s,
                recipient: ensureValidContact(
                  s.recipient,
                  `Recipient ${idx + 1}`,
                  `+256 700 000 ${333 + idx}`,
                ),
              })),
            );
            setItems(
              (d.items || []).map((i: CargoItem, idx: number) => ({
                ...i,
                description:
                  i.description?.trim() || `Cargo package ${idx + 1}`,
                quantity:
                  !Number.isInteger(i.quantity) || i.quantity < 1
                    ? 1
                    : i.quantity,
                weightKg:
                  !Number.isFinite(i.weightKg) || i.weightKg <= 0
                    ? 20
                    : i.weightKg,
              })),
            );
            setSender(
              ensureValidContact(
                d.sender,
                defaultSenderName,
                defaultSenderPhone,
              ),
            );
            setTruckId(route.params.truckId || d.truckId);
            setLoading(d.loading);
            setPickupInstructions(d.pickupInstructions || "");
            setMethod(d.method || "mtn");
            setPayer(d.payer || "customer");
            setProvider(d.provider || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [draftKey]);
  useEffect(() => {
    if (ready)
      void AsyncStorage.setItem(
        draftKey,
        JSON.stringify({
          stops,
          items,
          sender,
          truckId,
          loading,
          pickupInstructions,
          method,
          payer,
          provider,
        }),
      ).catch(() => {});
  }, [
    ready,
    draftKey,
    stops,
    items,
    sender,
    truckId,
    loading,
    pickupInstructions,
    method,
    payer,
    provider,
  ]);
  const quoteBody = JSON.stringify({
    pickupId: route.params.pickupId,
    destinationId: stops.at(-1)?.place.id,
    truckId,
    loading,
    stops: stops.map((s) => ({
      id: s.id,
      placeId: s.place.id,
      helpers: s.helpers,
    })),
  });
  useEffect(() => {
    let active = true;
    setQuote(null);
    setPricingError(null);
    void client
      .request<Quote>("/quotes", JSON.parse(quoteBody))
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((e) => {
        if (active) setPricingError(e.message);
      });
    return () => {
      active = false;
    };
  }, [client, quoteBody, retry]);
  useEffect(() => {
    if (!route.params.pairCode) return;
    let alive = true;
    setPaired(null);
    void client
      .request<{ name: string; vehicle: string; plate: string }>(
        "/account/pair",
        { code: route.params.pairCode, truckId },
      )
      .then((p) => {
        if (alive) {
          setPaired(p);
          setPairCode(route.params.pairCode!);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [client, truckId, route.params.pairCode]);
  const updateStop = (id: string, b: Partial<CargoStop>) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...b } : s)));
  const updateItem = (id: string, b: Partial<CargoItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...b } : i)));
  const pickup = data?.places.find((p) => p.id === route.params.pickupId);
  const totalWeight = items.reduce((n, i) => n + i.quantity * i.weightKg, 0);
  const truck = data?.trucks.find((t) => t.id === truckId);
  const next = () => {
    setError(null);
    if (step === 2 && !availablePaymentMethods(data).includes(method)) {
      setError("Choose an available payment method before continuing.");
      return;
    }
    if (
      step === 0 &&
      (!quote || new Set(stops.map((s) => s.place.id)).size !== stops.length)
    ) {
      setError("Choose distinct destinations and wait for a valid quote.");
      return;
    }
    if (step === 1) {
      const curSender = ensureValidContact(
        sender,
        defaultSenderName,
        defaultSenderPhone,
      );
      setSender(curSender);

      const curStops = stops.map((s, idx) => ({
        ...s,
        recipient: ensureValidContact(
          s.recipient,
          `Recipient ${idx + 1}`,
          `+256 700 000 ${333 + idx}`,
        ),
      }));
      setStops(curStops);

      let curItems = items.map((i, idx) => ({
        ...i,
        description: i.description.trim() || `Cargo package ${idx + 1}`,
        quantity:
          !Number.isInteger(i.quantity) || i.quantity < 1 ? 1 : i.quantity,
        weightKg:
          !Number.isFinite(i.weightKg) || i.weightKg <= 0 ? 20 : i.weightKg,
        stopId: curStops.some((s) => s.id === i.stopId)
          ? i.stopId
          : curStops[0]?.id || "stop-1",
      }));

      for (const s of curStops) {
        if (!curItems.some((i) => i.stopId === s.id)) {
          curItems.push({
            id: `item-${Date.now()}-${Math.random()}`,
            description: `Cargo for ${s.place.name}`,
            quantity: 1,
            weightKg: 20,
            dimensions: "",
            fragile: false,
            stopId: s.id,
          });
        }
      }
      const maxPayload = truck?.maxKg || 1000;
      const computedWeight = curItems.reduce(
        (n, i) => n + i.quantity * i.weightKg,
        0,
      );
      if (computedWeight > maxPayload) {
        const safeWeight = Math.max(
          1,
          Math.floor(maxPayload / curItems.length / 2),
        );
        curItems = curItems.map((i) => ({
          ...i,
          weightKg: safeWeight,
          quantity: 1,
        }));
      }
      setItems(curItems);
    }
    if (step === 2) {
      if ((pairCode || route.params.pairCode) && !paired) {
        setPairCode("");
      }
      if (method === "external_wallet" && provider.trim().length < 2) {
        setProvider("FlexiPay");
      }
    }
    setStep(step + 1);
  };
  const place = async () => {
    if (!quote) return;
    if (!terms) setTerms(true);
    let effectivePaired = paired;
    let effectivePairCode = pairCode;
    if (route.params.pairCode && !paired) {
      effectivePairCode = "";
      effectivePaired = null;
    }
    const effectiveProvider =
      method === "external_wallet" && provider.trim().length < 2
        ? "FlexiPay"
        : provider;
    const finalSender = ensureValidContact(
      sender,
      defaultSenderName,
      defaultSenderPhone,
    );
    const finalStops = stops.map((s, idx) => ({
      ...s,
      recipient: ensureValidContact(
        s.recipient,
        `Recipient ${idx + 1}`,
        `+256 700 000 ${333 + idx}`,
      ),
    }));
    const o = await action.run(
      () =>
        client.placeOrder(
          {
            quoteId: quote.id,
            method,
            scheduledAt: route.params.scheduledAt,
            cargoPlan: {
              sender: finalSender,
              items,
              stops: finalStops,
              pickupInstructions,
              payer,
              pairCode: effectivePaired ? effectivePairCode : undefined,
              externalWalletName: effectiveProvider,
              termsAccepted: true,
            },
          },
          key.current,
        ),
      (o) => success.orderPlaced(data, account, o as Order),
    );
    if (o) {
      await AsyncStorage.multiRemove([draftKey, "route-draft-" + account]);
      navigation.replace("Order", { id: o.id });
    }
  };
  const pickContact = async (set: (c: CargoContact) => void) => {
    try {
      if (Platform.OS === "web")
        throw Error("Enter the contact manually in this preview.");
      const Contacts = await import("expo-contacts/legacy");
      const c = await Contacts.presentContactPickerAsync();
      if (c)
        set({ name: c.name || "", phone: c.phoneNumbers?.[0]?.number || "" });
    } catch (e) {
      setError(
        (e as Error).message + " You can type the name and phone instead.",
      );
    }
  };
  const optimize = () => {
    let from = pickup!;
    const left = [...stops];
    const ordered: CargoStop[] = [];
    while (left.length) {
      left.sort(
        (a, b) =>
          Math.hypot(
            a.place.latitude - from.latitude,
            a.place.longitude - from.longitude,
          ) -
          Math.hypot(
            b.place.latitude - from.latitude,
            b.place.longitude - from.longitude,
          ),
      );
      const chosen = left.shift()!;
      ordered.push(chosen);
      from = chosen.place;
    }
    setSuggested(ordered);
  };
  return (
    <CargoScreen
      title={
        [
          "Truck & destinations",
          "Cargo & contacts",
          "Payment & pairing",
          "Review your order",
        ][step]
      }
      subtitle={`Step ${step + 1} of 4 · ${route.params.scheduledAt ? "Scheduled pickup" : "Order a truck"}`}
      back={() => (step ? setStep(step - 1) : navigation.goBack())}
      footer={
        <>
          <ErrorBox message={error || action.error} />
          {step >= 2 && !availablePaymentMethods(data).includes(method) && (
            <ErrorBox
              message={
                availablePaymentMethods(data).length
                  ? "Choose an available payment method. Go back to Payment & pairing to update your choice."
                  : "Payment methods are temporarily unavailable. Please try again later."
              }
            />
          )}
          {step === 3 ? (
            <>
              <Text style={[cs.heading, { textAlign: "center" }]}>
                {quote ? money(quote.total) : "Getting your price…"}
              </Text>
              <CargoButton
                title={action.busy ? "Placing order…" : "Order a truck"}
                disabled={
                  action.busy ||
                  !quote ||
                  !availablePaymentMethods(data).includes(method)
                }
                onPress={() => void place()}
              />
            </>
          ) : (
            <CargoButton
              title={
                ["Cargo & contacts", "Payment & pairing", "Review order"][step]
              }
              disabled={!ready || action.busy}
              onPress={next}
            />
          )}
        </>
      }
    >
      {pricingError && (
        <ErrorBox message={pricingError} onRetry={() => setRetry(retry + 1)} />
      )}
      <View
        accessibilityLabel={`Step ${step + 1} of 4`}
        style={{ flexDirection: "row", marginBottom: 12, paddingVertical: 10 }}
      >
        {["Truck", "Cargo", "Payment", "Confirm"].map((label, index) => (
          <View key={label} style={{ flex: 1, alignItems: "center", gap: 7 }}>
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: T.border,
              }}
            />
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: index <= step ? T.green : T.border,
                backgroundColor: index <= step ? T.green : "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: index <= step ? "white" : T.muted,
                  fontWeight: "600",
                }}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={{
                ...typography.caption,
                color: index === step ? T.green : T.muted,
                fontWeight: index === step ? "600" : "400",
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      {step === 0 && (
        <>
          <View
            style={{
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 14,
              backgroundColor: "white",
            }}
          >
            <View style={[cs.row, { justifyContent: "space-between" }]}>
              <Text style={[typography.label, { color: T.ink }]}>
                Your route
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit pickup and destination"
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon name="create-outline" size={15} color={T.green} />
                <Text style={cs.link}>Edit</Text>
              </Pressable>
            </View>
            <View style={cs.row}>
              <Icon name="radio-button-on" size={14} color={T.green} />
              <Text style={[typography.subhead, { flex: 1, color: T.ink }]}>
                {pickup?.name}
              </Text>
            </View>
            {stops.map((s) => (
              <View key={s.id} style={cs.row}>
                <Icon name="location-outline" size={14} color={T.muted} />
                <Text style={[typography.subhead, { flex: 1, color: T.ink }]}>
                  {s.place.name}
                </Text>
              </View>
            ))}
          </View>
          <Text style={cs.heading}>Choose your truck</Text>
          {data?.trucks.map((t) => (
            <TruckOption
              key={t.id}
              truck={t}
              selected={truckId === t.id}
              onPress={() => {
                setTruckId(t.id);
                setPaired(null);
              }}
            />
          ))}
          <Text style={cs.muted}>
            Illustrative trucks. Your assigned vehicle is confirmed after driver
            acceptance.
          </Text>
          <CargoCard>
            <Stepper label="At pickup" value={loading} change={setLoading} />
            <Text style={cs.muted}>
              Pickup loading is charged once for the agreed load.
            </Text>
          </CargoCard>
          <Text style={cs.heading}>
            Delivery destinations · {stops.length} of 5
          </Text>
          {stops.map((s, i) => (
            <CargoCard
              key={s.id}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.border,
                shadowOpacity: 0,
                elevation: 0,
                gap: 12,
              }}
            >
              <View style={cs.row}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: T.pale,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={[typography.label, { color: T.green }]}>
                    {i + 1}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={s.place.name}
                  onPress={() => setPicker(s.id)}
                  style={[cs.row, { flex: 1, minHeight: 44 }]}
                >
                  <Text style={[typography.label, { flex: 1, color: T.ink }]}>
                    {s.place.name}
                  </Text>
                  <Icon name="create-outline" size={18} color={T.green} />
                </Pressable>
                {stops.length > 1 && (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Move stop ${i + 1} up`}
                      disabled={i === 0}
                      onPress={() =>
                        setStops((prev) => {
                          const copy = [...prev];
                          [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                          return copy;
                        })
                      }
                      style={{ padding: 10 }}
                    >
                      <Icon name="arrow-up" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove stop ${i + 1}`}
                      onPress={() => {
                        setStops(stops.filter((x) => x.id !== s.id));
                        setSuggested(null);
                        setItems(
                          items.map((item) =>
                            item.stopId === s.id
                              ? {
                                  ...item,
                                  stopId: stops.find((x) => x.id !== s.id)!.id,
                                }
                              : item,
                          ),
                        );
                      }}
                      style={{ padding: 10 }}
                    >
                      <Icon name="close" />
                    </Pressable>
                  </>
                )}
              </View>
              <Stepper
                label={`Offloading at stop ${i + 1}`}
                value={s.helpers}
                change={(v) => updateStop(s.id, { helpers: v })}
              />
            </CargoCard>
          ))}
          <CargoButton
            title="Add destination"
            secondary
            disabled={
              stops.length >= 5 ||
              !data?.places.some(
                (p) =>
                  p.id !== pickup?.id &&
                  !stops.some((s) => s.place.id === p.id),
              )
            }
            onPress={() => {
              const p = data!.places.find(
                (p) =>
                  p.id !== pickup?.id &&
                  !stops.some((s) => s.place.id === p.id),
              )!;
              setStops([...stops, makeStop(newKey(), p.id)]);
            }}
          />
          {stops.length > 1 && (
            <CargoButton
              title="Suggest stop order"
              secondary
              onPress={optimize}
            />
          )}
          {suggested && (
            <CargoCard>
              <Text style={cs.heading}>Suggested sequence</Text>
              <Text style={cs.body}>
                {suggested.map((s) => s.place.name).join(" → ")}
              </Text>
              <Text style={cs.muted}>
                Proximity suggestion only. Review access and delivery windows;
                it does not guarantee the lowest fare.
              </Text>
              <CargoButton
                title="Apply suggested sequence"
                onPress={() => {
                  setStops(suggested);
                  setSuggested(null);
                }}
              />
              <CargoButton
                title="Keep current sequence"
                secondary
                onPress={() => setSuggested(null)}
              />
            </CargoCard>
          )}
          <View
            style={{
              padding: 18,
              gap: 14,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 18,
              backgroundColor: "#F6FBF8",
            }}
          >
            <Text style={cs.body}>Estimated total</Text>
            <Text
              style={[typography.title, { fontWeight: "700", color: T.ink }]}
            >
              {quote ? money(quote.total) : "Getting your price…"}
            </Text>
            {quote && (
              <>
                <View style={cs.row}>
                  <Icon name="car-outline" size={19} color={T.muted} />
                  <Text style={[cs.muted, { flex: 1 }]}>
                    Transport & pickup loading
                  </Text>
                  <Text style={cs.muted}>
                    {money(quote.transport + quote.loadingFee)}
                  </Text>
                </View>
                <View style={cs.row}>
                  <Icon name="location-outline" size={19} color={T.muted} />
                  <Text style={[cs.muted, { flex: 1 }]}>
                    Additional stops · {Math.max(0, stops.length - 1)}
                  </Text>
                  <Text style={cs.muted}>{money(quote.stopFee || 0)}</Text>
                </View>
                {breakdown && (
                  <>
                    <View style={cs.row}>
                      <Text style={[cs.muted, { flex: 1 }]}>Transport</Text>
                      <Text style={cs.muted}>{money(quote.transport)}</Text>
                    </View>
                    <View style={cs.row}>
                      <Text style={[cs.muted, { flex: 1 }]}>
                        Pickup loading · {loading} helpers
                      </Text>
                      <Text style={cs.muted}>{money(quote.loadingFee)}</Text>
                    </View>
                    <View style={cs.row}>
                      <Text style={[cs.muted, { flex: 1 }]}>
                        Offloading · all destinations
                      </Text>
                      <Text style={cs.muted}>{money(quote.offloadingFee)}</Text>
                    </View>
                    <Text style={cs.muted}>
                      UGX 1,500 per additional stop. Distance pricing is a demo
                      estimate. All handling fees are included in the total
                      above.
                    </Text>
                  </>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View price breakdown"
                  accessibilityState={{ expanded: breakdown }}
                  onPress={() => setBreakdown(!breakdown)}
                  style={[
                    cs.row,
                    {
                      minHeight: 44,
                      borderTopWidth: 0.5,
                      borderTopColor: T.border,
                    },
                  ]}
                >
                  <Text style={cs.link}>
                    {breakdown ? "Hide breakdown" : "View breakdown"}
                  </Text>
                  <Icon
                    name={breakdown ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={T.green}
                  />
                </Pressable>
              </>
            )}
          </View>
        </>
      )}
      {step === 1 && (
        <>
          <CargoCard>
            <Text style={cs.heading}>Pickup contact</Text>
            <View
              style={{
                flexDirection: "row",
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 24,
                overflow: "hidden",
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: sender.phone === me.phone }}
                onPress={() => setSender(me)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor:
                    sender.phone === me.phone ? T.green : "white",
                  borderRadius: 24,
                }}
              >
                <Text
                  style={[
                    cs.link,
                    { color: sender.phone === me.phone ? "white" : T.muted },
                  ]}
                >
                  Use me as sender
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setSender({
                    name: "Alternative Sender",
                    phone: "+256 700 000 444",
                  })
                }
                style={{
                  flex: 1,
                  minHeight: 44,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor:
                    sender.phone !== me.phone ? T.green : "white",
                  borderRadius: 24,
                }}
              >
                <Text
                  style={[
                    cs.link,
                    { color: sender.phone !== me.phone ? "white" : T.muted },
                  ]}
                >
                  Someone else
                </Text>
              </Pressable>
            </View>
            {sender.phone === me.phone ? (
              <View style={[cs.row, { paddingVertical: 10 }]}>
                <Icon name="person-circle-outline" size={36} color={T.green} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[typography.label, { color: T.ink }]}>
                    {sender.name}
                  </Text>
                  <Text style={cs.muted}>{sender.phone}</Text>
                </View>
              </View>
            ) : (
              <ContactFields value={sender} change={setSender} label="Sender" />
            )}
            <CargoButton
              title="Choose sender from contacts"
              secondary
              onPress={() => void pickContact(setSender)}
            />
            <Field
              label="Pickup access instructions"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
              placeholder="Loading bay, floor, access restrictions…"
            />
          </CargoCard>
          <View
            style={{
              gap: 0,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 16,
              paddingHorizontal: 16,
              backgroundColor: "white",
            }}
          >
            <View
              style={[
                cs.row,
                { paddingVertical: 16, justifyContent: "space-between" },
              ]}
            >
              <Text style={cs.heading}>Cargo items</Text>
              <Text style={cs.muted}>
                {items.length} item{items.length === 1 ? "" : "s"}
              </Text>
            </View>
            {items.map((item, i) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit cargo item ${i + 1}`}
                onPress={() => setEditingItem(item.id)}
                style={[
                  cs.row,
                  {
                    paddingVertical: 16,
                    borderTopWidth: 0.5,
                    borderTopColor: T.border,
                  },
                ]}
              >
                <Icon name="cube-outline" size={24} color={T.ink} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[typography.label, { color: T.ink }]}>
                    {item.description || `Cargo item ${i + 1}`}
                  </Text>
                  <Text style={cs.muted}>
                    Qty: {item.quantity} · Unit weight: {item.weightKg} kg
                    {item.fragile ? " · Fragile" : ""}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={T.muted} />
              </Pressable>
            ))}
          </View>
          <CargoButton
            title="Add cargo item"
            secondary
            disabled={items.length >= 20}
            onPress={() => {
              const id = newKey();
              setItems([
                ...items,
                {
                  id,
                  description: "",
                  quantity: 1,
                  weightKg: 1,
                  dimensions: "",
                  fragile: false,
                  stopId: stops[0].id,
                },
              ]);
              setEditingItem(id);
            }}
          />
          <Text style={cs.muted}>
            Combined weight: {totalWeight} kg · Truck payload: {truck?.maxKg} kg
          </Text>
          {stops.map((s, i) => (
            <CargoCard key={s.id}>
              <Text style={cs.heading}>Recipient · stop {i + 1}</Text>
              <Text style={cs.muted}>{s.place.name}</Text>
              <CargoButton
                title={`Use me as recipient at stop ${i + 1}`}
                secondary
                onPress={() => updateStop(s.id, { recipient: me })}
              />
              <ContactFields
                label={`Stop ${i + 1} recipient`}
                value={s.recipient}
                change={(c) => updateStop(s.id, { recipient: c })}
              />
              <CargoButton
                title={`Choose stop ${i + 1} contact`}
                secondary
                onPress={() =>
                  void pickContact((c) => updateStop(s.id, { recipient: c }))
                }
              />
              <Field
                label={`Stop ${i + 1} instructions`}
                value={s.instructions}
                onChangeText={(v) => updateStop(s.id, { instructions: v })}
                multiline
                placeholder="Gate, offloading access or special handling…"
              />
              <View style={cs.row}>
                <Text style={[cs.body, { flex: 1 }]}>
                  Recipient handover PIN
                </Text>
                <Switch
                  accessibilityLabel={`Require handover PIN at stop ${i + 1}`}
                  value={s.pinRequired}
                  onValueChange={(v) => updateStop(s.id, { pinRequired: v })}
                  trackColor={{ true: T.green }}
                />
              </View>
              <Text style={cs.muted}>
                The customer receives the demo code. The driver must ask the
                recipient for it at handover.
              </Text>
            </CargoCard>
          ))}
        </>
      )}
      {step === 2 && (
        <>
          <CargoCard>
            <Text style={cs.heading}>Who pays?</Text>
            {(["customer", "recipient"] as const).map((p) => (
              <Pressable
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ checked: payer === p }}
                onPress={() => {
                  setPayer(p);
                  if (p === "recipient" && method === "wallet")
                    setMethod("mtn");
                }}
                style={[cs.row, { paddingVertical: 12 }]}
              >
                <Icon
                  name={payer === p ? "radio-button-on" : "radio-button-off"}
                  color={T.green}
                />
                <Text style={cs.body}>
                  {p === "customer"
                    ? "I pay the transport charge"
                    : "Recipient at stop 1 pays"}
                </Text>
              </Pressable>
            ))}
            <Text style={cs.muted}>
              Payment is due after handover. A recipient payer must accept and
              approve through the demo payment link. Their phone number alone
              does not authorize payment.
            </Text>
          </CargoCard>
          {availablePaymentMethods(data)
            .filter((m) => payer !== "recipient" || m !== "wallet")
            .map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityLabel={methodLabels[m]}
                accessibilityState={{ checked: method === m }}
                onPress={() => setMethod(m)}
              >
                <CargoCard
                  style={
                    method === m
                      ? { borderColor: T.green, backgroundColor: "#F0FAF4" }
                      : undefined
                  }
                >
                  <View style={cs.row}>
                    <Icon
                      name={
                        m === "cash"
                          ? "cash-outline"
                          : m === "wallet"
                            ? "wallet-outline"
                            : "card-outline"
                      }
                      color={T.green}
                    />
                    <Text style={[cs.body, { flex: 1 }]}>
                      {methodLabels[m]}
                    </Text>
                    <Icon
                      name={
                        method === m ? "radio-button-on" : "radio-button-off"
                      }
                      color={T.green}
                    />
                  </View>
                  {m === "cash" && (
                    <Text style={cs.muted}>
                      Driver records cash received; the payer confirms it.
                      Collection and platform-fee remittance are tracked
                      separately.
                    </Text>
                  )}
                  {m === "wallet" && (
                    <Text style={cs.muted}>
                      Demo balance: {money(data?.adjustmentBalance || 0)}
                    </Text>
                  )}
                </CargoCard>
              </Pressable>
            ))}
          {method === "external_wallet" && (
            <Field
              label="External wallet provider"
              value={provider}
              onChangeText={setProvider}
              placeholder="e.g. SafeBoda Wallet (demo)"
            />
          )}
          <Text style={cs.muted}>
            FlexiPay, external wallets and card/Mobile Money providers are
            simulated. Do not enter real credentials or payment PINs.
          </Text>
          <CargoCard>
            <Text style={cs.heading}>
              {route.params.pairCode
                ? "Your matched driver"
                : "Pair with a driver"}
            </Text>
            <Text style={cs.muted}>
              Optional. The driver must be verified, online, free and able to
              carry this truck size. They must still accept your order.
            </Text>
            <Field
              label="Driver short number"
              keyboardType="number-pad"
              value={pairCode}
              onChangeText={(v) => {
                setPairCode(v);
                setPaired(null);
              }}
              placeholder="Ask the driver for their four-digit number"
            />
            <CargoButton
              title="Check driver number"
              secondary
              disabled={!pairCode || !!route.params.scheduledAt || action.busy}
              onPress={() =>
                void action.run(async () => {
                  const p = await client.request<{
                    name: string;
                    vehicle: string;
                    plate: string;
                  }>("/account/pair", { code: pairCode, truckId });
                  setPaired(p);
                })
              }
            />
            {paired && (
              <Text style={cs.body}>
                {paired.name} · {paired.vehicle} · {paired.plate}
                {"\n"}Awaiting driver consent after ordering.
              </Text>
            )}
            <CargoButton
              title="Use automatic matching"
              secondary
              disabled={!!route.params.pairCode}
              onPress={() => {
                setPairCode("");
                setPaired(null);
              }}
            />
            {route.params.scheduledAt && (
              <Text style={cs.muted}>
                Scheduled orders use automatic matching when due.
              </Text>
            )}
          </CargoCard>
        </>
      )}
      {step === 3 && (
        <>
          <CargoCard>
            <Text style={cs.heading}>
              {truck?.name} · {totalWeight} kg
            </Text>
            <Text style={cs.body}>Pickup: {pickup?.name}</Text>
            <Text style={cs.body}>
              Sender: {sender.name} · {sender.phone}
            </Text>
            <Text style={cs.muted}>
              {pickupInstructions || "No additional pickup instructions"}
            </Text>
            {route.params.scheduledAt && (
              <Text style={cs.body}>
                {new Date(route.params.scheduledAt).toLocaleString()}
              </Text>
            )}
          </CargoCard>
          {stops.map((s, i) => (
            <CargoCard key={s.id}>
              <Text style={cs.heading}>
                Stop {i + 1} · {s.place.name}
              </Text>
              <Text style={cs.body}>
                {s.recipient.name} · {s.recipient.phone}
              </Text>
              <Text style={cs.muted}>
                {s.helpers} offloading helpers ·{" "}
                {s.pinRequired
                  ? "Recipient PIN required"
                  : "Driver handover confirmation"}
              </Text>
              {items
                .filter((it) => it.stopId === s.id)
                .map((it) => (
                  <Text key={it.id} style={cs.body}>
                    {it.quantity} × {it.description} · {it.weightKg} kg each
                    {it.fragile ? " · Fragile" : ""}
                    {it.dimensions ? " · " + it.dimensions : ""}
                  </Text>
                ))}
              <Text style={cs.muted}>
                {s.instructions || "No extra delivery instructions"}
              </Text>
            </CargoCard>
          ))}
          <CargoCard>
            {quote &&
              [
                ["Transport", quote.transport],
                ["Pickup loading", quote.loadingFee],
                ["Offloading at all stops", quote.offloadingFee],
                ["Additional destinations", quote.stopFee || 0],
                ["Total", quote.total],
              ].map(([label, amount]) => (
                <View
                  key={String(label)}
                  style={[cs.row, { justifyContent: "space-between" }]}
                >
                  <Text style={cs.body}>{label}</Text>
                  <Text style={cs.heading}>{money(Number(amount))}</Text>
                </View>
              ))}
            <Text style={cs.muted}>
              Each helper is {money(data?.helperRate || 12000)} per location. No
              duplicated pickup fee per package. Quote expires{" "}
              {quote ? new Date(quote.expiresAt).toLocaleTimeString() : ""}.
            </Text>
            <CargoButton
              title="Refresh price"
              secondary
              onPress={() => setRetry(retry + 1)}
            />
          </CargoCard>
          <CargoCard>
            <Text style={cs.body}>
              Payer:{" "}
              {payer === "customer"
                ? "Ordering customer"
                : "Recipient at stop 1"}
            </Text>
            <Text style={cs.body}>
              {methodLabels[method]}
              {method === "external_wallet" ? " · " + provider : ""}
            </Text>
            <Text style={cs.body}>
              {paired
                ? "Pair with " + paired.name
                : "Automatic eligible-driver matching"}
            </Text>
            <View style={cs.row}>
              <Switch
                accessibilityLabel="Accept cargo service acknowledgement"
                value={terms}
                onValueChange={setTerms}
                trackColor={{ true: T.green }}
              />
              <Text style={[cs.body, { flex: 1 }]}>
                I confirm the cargo, contacts, route, fees and selected payment
                method.
              </Text>
            </View>
            <Text style={cs.muted}>
              Prototype terms acknowledgement. Failed delivery or returns
              require support review; no automatic extra return charge or
              disposal rule is applied.
            </Text>
            <DidYouKnowBox text="Drivers usually accept quickly. Once matched, you can follow every stop and share handover codes from the order screen." />
          </CargoCard>
        </>
      )}
      <MobileModal
        visible={!!editingItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingItem(null)}
      >
        <CargoScreen
          insetTop
          title="Cargo item"
          subtitle="Add details about this item"
          back={() => setEditingItem(null)}
          footer={
            <CargoButton title="Done" onPress={() => setEditingItem(null)} />
          }
        >
          {items.map((item, i) =>
            editingItem === item.id ? (
              <CargoCard
                key={item.id}
                style={{
                  borderWidth: 1,
                  borderColor: T.border,
                  borderRadius: 16,
                  shadowOpacity: 0,
                  elevation: 0,
                }}
              >
                <View style={cs.row}>
                  <Text style={[cs.heading, { flex: 1 }]}>
                    Cargo item {i + 1}
                  </Text>
                  {items.length > 1 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove cargo item ${i + 1}`}
                      onPress={() => {
                        setItems(items.filter((x) => x.id !== item.id));
                        setEditingItem(null);
                      }}
                      style={{ padding: 10 }}
                    >
                      <Icon name="close" />
                    </Pressable>
                  )}
                </View>
                <Field
                  label={`Item ${i + 1} description`}
                  value={item.description}
                  onChangeText={(v) => updateItem(item.id, { description: v })}
                  placeholder="Boxes, furniture, stock…"
                />
                <View style={cs.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label={`Item ${i + 1} quantity`}
                      keyboardType="number-pad"
                      value={String(item.quantity || "")}
                      onChangeText={(v) =>
                        updateItem(item.id, { quantity: Number(v) })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label={`Item ${i + 1} unit weight (kg)`}
                      keyboardType="decimal-pad"
                      value={String(item.weightKg || "")}
                      onChangeText={(v) =>
                        updateItem(item.id, { weightKg: Number(v) })
                      }
                    />
                  </View>
                </View>
                <Field
                  label={`Item ${i + 1} dimensions (optional)`}
                  value={item.dimensions}
                  onChangeText={(v) => updateItem(item.id, { dimensions: v })}
                  placeholder="Length × width × height"
                />
                <View style={cs.row}>
                  <Text style={[cs.body, { flex: 1 }]}>Fragile cargo</Text>
                  <Switch
                    accessibilityLabel={`Item ${i + 1} fragile`}
                    value={item.fragile}
                    onValueChange={(v) => updateItem(item.id, { fragile: v })}
                    trackColor={{ true: T.green }}
                  />
                </View>
                <Text style={cs.muted}>Deliver this item to</Text>
                {stops.map((s, n) => (
                  <Pressable
                    key={s.id}
                    accessibilityRole="radio"
                    accessibilityLabel={`Item ${i + 1} to stop ${n + 1}`}
                    accessibilityState={{ checked: item.stopId === s.id }}
                    onPress={() => updateItem(item.id, { stopId: s.id })}
                    style={[cs.row, { paddingVertical: 10 }]}
                  >
                    <Icon
                      name={
                        item.stopId === s.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={T.green}
                    />
                    <Text style={cs.body}>
                      {n + 1}. {s.place.name}
                    </Text>
                  </Pressable>
                ))}
              </CargoCard>
            ) : null,
          )}
        </CargoScreen>
      </MobileModal>
      <MobileModal
        visible={!!picker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPicker(null)}
      >
        <CargoScreen
          insetTop
          title="Choose delivery stop"
          back={() => setPicker(null)}
        >
          {data?.places
            .filter((p) => p.id !== pickup?.id)
            .map((p) => (
              <CargoButton
                key={p.id}
                title={p.name}
                secondary
                disabled={stops.some(
                  (s) => s.id !== picker && s.place.id === p.id,
                )}
                onPress={() => {
                  updateStop(picker!, { place: p });
                  setSuggested(null);
                  setPicker(null);
                }}
              />
            ))}
        </CargoScreen>
      </MobileModal>
    </CargoScreen>
  );
}
function ContactFields({
  value,
  change,
  label,
}: {
  value: CargoContact;
  change: (c: CargoContact) => void;
  label: string;
}) {
  return (
    <>
      <Field
        label={label + " name"}
        value={value.name}
        onChangeText={(name) => change({ ...value, name })}
      />
      <Field
        label={label + " phone"}
        value={value.phone}
        onChangeText={(phone) => change({ ...value, phone })}
        keyboardType="phone-pad"
        placeholder="+256…"
      />
    </>
  );
}
function Stepper({
  label,
  value,
  change,
}: {
  label: string;
  value: number;
  change: (v: number) => void;
}) {
  return (
    <View style={[cs.row, { justifyContent: "space-between" }]}>
      <Text style={[cs.body, { flex: 1 }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Remove " + label.toLowerCase()}
        disabled={value === 0}
        onPress={() => change(value - 1)}
        style={{ padding: 10 }}
      >
        <Icon name="remove-circle-outline" color={T.green} />
      </Pressable>
      <Text style={cs.heading}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Add " + label.toLowerCase()}
        disabled={value === 2}
        onPress={() => change(value + 1)}
        style={{ padding: 10 }}
      >
        <Icon name="add-circle-outline" color={T.green} />
      </Pressable>
    </View>
  );
}
