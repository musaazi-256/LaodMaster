import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  methodLabels,
  money,
  availablePaymentMethods,
  type Method,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
import {
  Badge,
  Body,
  Button,
  C,
  Card,
  Empty,
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
import { PromoModal } from "./CargoUI";
import { PromoBadgeArt } from "./MapIllustration";
export function Vehicle() {
  const { data, client } = useDemo();
  const p = data?.profile;
  const [truckId, setTruckId] = useState(p?.truckId || "small");
  const [vehicle, setVehicle] = useState(p?.vehicle || "");
  const [plate, setPlate] = useState(p?.plate || "");
  const [saved, setSaved] = useState(false);
  const action = useAction();
  return (
    <Screen
      footer={
        <>
          <ErrorBox message={action.error} />
          <Button
            title="Submit vehicle for review"
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                await client.request("/account/vehicle", {
                  truckId,
                  vehicle,
                  plate,
                });
                setSaved(true);
              }, success.vehicleSubmitted())
            }
          />
        </>
      }
    >
      <Title>{"Your vehicle.\nYour next move."}</Title>
      <Body muted>
        Changing vehicle details requires a new review. Finish any current
        delivery first.
      </Body>
      {saved && <Badge>Vehicle submitted for review</Badge>}
      <Card>
        <Field
          label="Vehicle model"
          value={vehicle}
          onChangeText={setVehicle}
          placeholder="e.g. Isuzu Forward"
        />
        <Field
          label="Licence plate"
          value={plate}
          onChangeText={setPlate}
          placeholder="UBB 920 B"
        />
      </Card>
      <Section title="Truck category" />
      {data?.trucks.map((t) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: t.id === truckId }}
          key={t.id}
          onPress={() => setTruckId(t.id)}
        >
          <Card>
            <Row>
              <Icon
                name={t.id === truckId ? "radio-button-on" : "radio-button-off"}
                color={C.green}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Title small>{t.name}</Title>
                <Text style={s.small}>
                  {t.capacity} · {t.body}
                </Text>
              </View>
            </Row>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
export function Documents({
  navigation,
}: NativeStackScreenProps<RootStack, "Verification">) {
  const { data, client } = useDemo();
  const action = useAction();
  const p = data?.profile;
  const [uploading, setUploading] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const upload = async (name: string, camera: boolean) => {
    setUploading(name);
    await action.run(
      async () => {
        if (camera) {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted)
            throw new Error(
              "Camera access is disabled. Enable it in Settings or choose a photo instead.",
            );
        }
        const result = camera
          ? await ImagePicker.launchCameraAsync({
              base64: true,
              quality: 0.5,
              allowsEditing: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              base64: true,
              quality: 0.5,
              allowsEditing: true,
            });
        if (result.canceled) return;
        const asset = result.assets[0];
        if (!asset.base64)
          throw new Error(
            "This photo could not be read. Choose another image.",
          );
        if (asset.base64.length > 2900000)
          throw new Error("Use a smaller photo, under 2 MB.");
        const content = `data:image/${asset.mimeType === "image/png" ? "png" : "jpeg"};base64,${asset.base64}`;
        setPreview(asset.uri);
        await client.request("/account/document", {
          name,
          fileName: asset.fileName || "document.jpg",
          content,
        });
        return true;
      },
      (done) => (done ? success.documentUploaded(data, name) : undefined),
    );
    setUploading("");
  };
  const choose = (name: string) => {
    if (Platform.OS === "ios")
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take a photo", "Choose from library"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index) void upload(name, index === 1);
        },
      );
    else
      Alert.alert(
        "Submit " + name,
        "Use a synthetic document for this prototype.",
        [
          { text: "Camera", onPress: () => void upload(name, true) },
          { text: "Photo library", onPress: () => void upload(name, false) },
          { text: "Cancel", style: "cancel" },
        ],
      );
  };
  return (
    <Screen>
      <Title>Ready for the road.</Title>
      <Badge tone={p?.verified ? "green" : "amber"}>
        {p?.verified ? "DRIVER APPROVED" : "ACCOUNT REVIEW REQUIRED"}
      </Badge>
      <Card>
        <Label>REGISTERED VEHICLE</Label>
        <Title small>{p?.vehicle || "Add your vehicle"}</Title>
        <Body>{p?.plate || "No licence plate supplied"}</Body>
        <Body muted>
          {data?.trucks.find((t) => t.id === p?.truckId)?.capacity ||
            "Truck category not selected"}
        </Body>
        <Button
          secondary
          title="Edit vehicle details"
          onPress={() => navigation.navigate("Vehicle")}
        />
      </Card>
      <ErrorBox message={action.error} />
      <Body muted>
        Submit all four documents, then an administrator reviews them and
        approves your driver account. Use demo images, not real identity
        documents.
      </Body>
      {[
        "Driver licence",
        "Identity document",
        "Vehicle registration",
        "Third-party insurance",
      ].map((name) => {
        const doc = p?.documents?.find((d) => d.name === name);
        return (
          <Card key={name}>
            <Row>
              <View style={s.iconCircle}>
                <Icon name="document-text-outline" color={C.green} />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Title small>{name}</Title>
                <Badge
                  tone={
                    doc?.status === "approved"
                      ? "green"
                      : doc?.status === "rejected"
                        ? "red"
                        : "amber"
                  }
                >
                  {doc?.status || "Not submitted"}
                </Badge>
              </View>
            </Row>
            {!!doc?.reason && <Body muted>Review note: {doc.reason}</Body>}
            {!!doc?.fileName && <Text style={s.small}>{doc.fileName}</Text>}
            <Button
              secondary
              title={doc ? "Replace photo" : "Submit photo"}
              busy={action.busy && uploading === name}
              disabled={action.busy}
              onPress={() => choose(name)}
            />
          </Card>
        );
      })}
      {preview && (
        <Card>
          <Label>LAST SELECTED PHOTO</Label>
          <Image
            source={{ uri: preview }}
            style={{ height: 200, borderRadius: 12 }}
            resizeMode="contain"
          />
        </Card>
      )}
      <Text style={s.small}>
        Approval updates will sync from the web admin. No guaranteed review time
        is implied.
      </Text>
    </Screen>
  );
}
export function PaymentMethods() {
  const { data, client } = useDemo();
  const action = useAction();
  const [kind, setKind] = useState<Method>("mtn");
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [adding, setAdding] = useState(false);
  const methods = data?.profile.paymentMethods || [];
  return (
    <Screen>
      <Title>{"Your payment\nmethods."}</Title>
      <Body muted>
        Saved demo methods only. No real card number, security code or Mobile
        Money PIN is collected.
      </Body>
      <ErrorBox message={action.error} />
      {methods.map((m) => (
        <Card key={m.id}>
          <Row>
            <Icon
              name={
                m.kind === "card" ? "card-outline" : "phone-portrait-outline"
              }
              color={C.green}
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Title small>{methodLabels[m.kind]}</Title>
              <Body muted>
                {m.label} ·•••• {m.last4}
              </Body>
            </View>
            {!availablePaymentMethods(data).includes(m.kind) ? (
              <Badge tone="amber">Unavailable</Badge>
            ) : (
              m.isDefault && <Badge>Default</Badge>
            )}
          </Row>
          <Row>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                title="Set default"
                disabled={
                  action.busy ||
                  m.isDefault ||
                  !availablePaymentMethods(data).includes(m.kind)
                }
                onPress={() =>
                  void action.run(() =>
                    client.request("/account/methods", {
                      ...m,
                      isDefault: true,
                    }),
                  )
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                secondary
                danger
                title="Remove"
                disabled={action.busy}
                onPress={() =>
                  Alert.alert(
                    "Remove demo method?",
                    "Existing order receipts are retained.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () =>
                          void action.run(() =>
                            client.request("/account/methods", {
                              ...m,
                              remove: true,
                            }),
                          ),
                      },
                    ],
                  )
                }
              />
            </View>
          </Row>
        </Card>
      ))}
      {!methods.length && (
        <Empty
          title="No saved methods"
          detail="Add a synthetic method to use as your default."
        />
      )}
      <Button
        title={adding ? "Close method form" : "Add a demo method"}
        secondary
        onPress={() => setAdding(!adding)}
      />
      {adding && (
        <Card>
          {availablePaymentMethods(data)
            .filter((m) => ["mtn", "airtel", "card"].includes(m))
            .map((m) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: kind === m }}
                onPress={() => setKind(m)}
                key={m}
                style={{ paddingVertical: 10 }}
              >
                <Row>
                  <Icon
                    name={kind === m ? "radio-button-on" : "radio-button-off"}
                    color={C.green}
                  />
                  <Body>{methodLabels[m]}</Body>
                </Row>
              </Pressable>
            ))}
          <Field
            label="Method nickname"
            value={label}
            onChangeText={setLabel}
            placeholder="My demo account"
          />
          {kind !== "card" && (
            <Field
              label="Last four digits only (demo)"
              value={last4}
              onChangeText={setLast4}
              keyboardType="numeric"
            />
          )}
          <Button
            title="Save demo method"
            busy={action.busy}
            disabled={!availablePaymentMethods(data).includes(kind)}
            onPress={() =>
              void action.run(
                async () => {
                  await client.request("/account/methods", {
                    kind,
                    label,
                    last4,
                    isDefault: !methods.length,
                  });
                  setAdding(false);
                  setLabel("");
                  setLast4("");
                },
                success.paymentMethodAdded(data, label, last4),
              )
            }
          />
        </Card>
      )}
    </Screen>
  );
}
export function SavedPlaces() {
  const { data, client } = useDemo();
  const action = useAction();
  const [label, setLabel] = useState("");
  const [placeId, setPlaceId] = useState("ntinda");
  return (
    <Screen>
      <Title>Your familiar places.</Title>
      <Body muted>Save frequently used demo locations for future orders.</Body>
      <ErrorBox message={action.error} />
      {data?.savedPlaces?.map((p) => (
        <Card key={p.id}>
          <Row>
            <Icon name="bookmark-outline" color={C.green} />
            <View style={{ flex: 1, gap: 5 }}>
              <Title small>{p.label}</Title>
              <Text style={s.small}>
                {data.places.find((x) => x.id === p.placeId)?.name}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Remove " + p.label}
              onPress={() =>
                void action.run(() =>
                  client.request("/account/place", { id: p.id, remove: true }),
                )
              }
              style={{ padding: 12 }}
            >
              <Icon name="trash-outline" size={20} />
            </Pressable>
          </Row>
        </Card>
      ))}
      <Card>
        <Label>ADD A SAVED PLACE</Label>
        <Field
          label="Place nickname"
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. My shop"
        />
        {data?.places.map((p) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: placeId === p.id }}
            key={p.id}
            onPress={() => setPlaceId(p.id)}
            style={{ paddingVertical: 8 }}
          >
            <Row>
              <Icon
                name={placeId === p.id ? "radio-button-on" : "radio-button-off"}
                color={C.green}
              />
              <Text style={[s.body, { flex: 1 }]}>{p.name}</Text>
            </Row>
          </Pressable>
        ))}
        <Button
          title="Save place"
          busy={action.busy}
          onPress={() =>
            void action.run(async () => {
              await client.request("/account/place", { label, placeId });
              setLabel("");
            }, success.placeSaved(label))
          }
        />
      </Card>
    </Screen>
  );
}
export function Notifications({
  navigation,
}: NativeStackScreenProps<RootStack, "Notifications">) {
  const { data, client } = useDemo();
  const action = useAction();
  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <Title>Your updates.</Title>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void action.run(() => client.request("/account/notification", {}))
          }
          style={{ padding: 10 }}
        >
          <Text style={s.link}>Mark all read</Text>
        </Pressable>
      </Row>
      <ErrorBox message={action.error} />
      {data?.notifications?.length ? (
        data.notifications
          .slice()
          .reverse()
          .map((n) => (
            <Pressable
              accessibilityRole="button"
              key={n.id}
              onPress={() => {
                void action.run(() =>
                  client.request("/account/notification", { id: n.id }),
                );
                if (n.orderId) navigation.navigate("Order", { id: n.orderId });
              }}
            >
              <Card style={{ backgroundColor: n.read ? "white" : C.mint }}>
                <Title small>{n.title}</Title>
                <Body>{n.message}</Body>
                <Text style={s.small}>
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
              </Card>
            </Pressable>
          ))
      ) : (
        <Empty
          title="You’re all caught up"
          detail="Order, payment and support updates will appear here."
        />
      )}
      <Text style={s.small}>
        These are connected in-app records. Background push delivery is not
        integrated.
      </Text>
    </Screen>
  );
}
export function Preferences() {
  const { data, client, logout } = useDemo();
  const action = useAction();
  const p = data?.profile;
  return (
    <Screen>
      <Title>Make it yours.</Title>
      <ErrorBox message={action.error} />
      <Card>
        {[
          [
            "notifications",
            "In-app updates",
            "Keep order, payment and support notifications.",
          ],
          [
            "hideAmounts",
            "Hide Home balances",
            "Mask earning amounts on your Home screen.",
          ],
        ].map(([id, label, note]) => (
          <Row key={id}>
            <View style={{ flex: 1, gap: 5 }}>
              <Title small>{label}</Title>
              <Body muted>{note}</Body>
            </View>
            <Switch
              accessibilityLabel={label}
              value={!!p?.preferences?.[id as "notifications" | "hideAmounts"]}
              onValueChange={(value) =>
                void action.run(() =>
                  client.request("/account/profile", {
                    preferences: { [id]: value },
                  }),
                )
              }
              trackColor={{ true: C.green, false: C.line }}
            />
          </Row>
        ))}
      </Card>
      <Card>
        <Title small>Demo data & account deletion</Title>
        <Body muted>
          Deleting your demo account disables sign-in. Order and financial
          history remains in the shared demo dataset for review.
        </Body>
        <Button
          title="Delete demo account"
          secondary
          danger
          disabled={action.busy}
          onPress={() =>
            Alert.alert(
              "Delete this demo account?",
              "Finish or cancel active orders first. Historical financial records will be retained.",
              [
                { text: "Keep account", style: "cancel" },
                {
                  text: "Delete account",
                  style: "destructive",
                  onPress: () =>
                    void action.run(async () => {
                      await client.request("/account/delete", {});
                      await logout();
                    }),
                },
              ],
            )
          }
        />
      </Card>
    </Screen>
  );
}
export function Password() {
  const { client, signIn } = useDemo();
  const action = useAction();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <Screen>
      <Title>Change password.</Title>
      <Card>
        <Field
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
        <Field
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Field
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        <ErrorBox message={action.error} />
        {saved && <Badge>Password updated</Badge>}
        <Button
          title="Update password"
          busy={action.busy}
          onPress={() =>
            void action.run(async () => {
              if (password !== confirm)
                throw new Error("The new passwords do not match.");
              const result = await client.request<{
                token: string;
                account: string;
              }>("/account/password", { current, password });
              await signIn(result);
              setSaved(true);
              setCurrent("");
              setPassword("");
              setConfirm("");
            }, success.passwordUpdated())
          }
        />
      </Card>
    </Screen>
  );
}
export function PayoutRequests() {
  const { data, client } = useDemo();
  const action = useAction();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("mtn");
  const [destination, setDestination] = useState(data?.profile.phone || "");
  const [provider, setProvider] = useState("");
  const [requestKey, setRequestKey] = useState(
    () => "withdrawal-" + Date.now(),
  );
  const methods = availablePaymentMethods(data).filter((m) =>
    ["mtn", "airtel", "flexipay", "external_wallet"].includes(m),
  );
  const active = data?.withdrawals?.find((w) =>
    ["requested", "approved", "processing", "failed"].includes(w.status),
  );
  const total = data?.payoutBalance?.unpaid ?? 0;
  return (
    <Screen>
      <Title>Withdraw earnings</Title>
      <Card>
        <Label>UNPAID EARNINGS</Label>
        <Title>{money(total)}</Title>
        <Body muted>
          Choose an amount and destination. Office reviews your request, then
          finance sends your payment. The payout record shows the provider
          charge, who covers it, and the amount you receive. Charges are
          confirmed by finance. Payments are simulated in this demo.
        </Body>
        {active && (
          <Body muted>
            {money(active.amount)} reserved in request {active.id} ·{" "}
            {active.status}. Complete this request before submitting another.
          </Body>
        )}
        <Body muted>
          Available after reservations ·{" "}
          {money(data?.payoutBalance?.available || 0)}
        </Body>
        <Field
          hint="Enter the amount to remove from your earnings. If you cover a provider charge, it is deducted from this amount."
          label="Withdrawal amount (UGX)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Label>PAYOUT PLATFORM</Label>
        {!methods.includes(method) && (
          <Body muted>
            {methods.length
              ? "Choose an available payout platform. Availability is managed by LoadMaster."
              : "Payout platforms are temporarily unavailable. Please try again later."}
          </Body>
        )}
        {methods.map((m) => (
          <Button
            key={m}
            title={(method === m ? "✓ " : "") + methodLabels[m]}
            secondary
            onPress={() => setMethod(m)}
          />
        ))}
        {method === "external_wallet" && (
          <Field
            label="Platform name"
            value={provider}
            onChangeText={setProvider}
          />
        )}
        <Field
          hint="Check the destination carefully. Office approval is followed by a separate finance payment."
          label={
            method === "external_wallet"
              ? "Destination account"
              : "Payout phone number"
          }
          value={destination}
          onChangeText={setDestination}
        />
        <ErrorBox message={action.error} />
        <Button
          title="Request withdrawal"
          busy={action.busy}
          disabled={
            !methods.includes(method) ||
            !total ||
            !!active ||
            !Number.isSafeInteger(Number(amount)) ||
            Number(amount) <= 0 ||
            Number(amount) > total
          }
          onPress={() =>
            void action.run(
              () =>
                client.request<{ amount?: number }>("/account/withdrawal", {
                  amount: Number(amount),
                  method,
                  destination,
                  provider,
                  key: requestKey,
                }),
              (r) => {
                setRequestKey("withdrawal-" + Date.now());
                setAmount("");
                return success.payoutRequested(r);
              },
            )
          }
        />
      </Card>
      <Section title="Your requests" />
      {data?.withdrawals?.length ? (
        data.withdrawals
          .slice()
          .reverse()
          .map((w) => (
            <Card key={w.id}>
              <Row style={{ justifyContent: "space-between" }}>
                <Title small>{money(w.amount)}</Title>
                <Badge
                  tone={
                    w.status === "rejected"
                      ? "red"
                      : w.status === "paid"
                        ? "green"
                        : "amber"
                  }
                >
                  {w.status}
                </Badge>
              </Row>
              <Text style={s.small}>
                {w.id} · {new Date(w.createdAt).toLocaleString()}
              </Text>
              <Body>
                {w.method ? methodLabels[w.method] : "Mobile money"} ·{" "}
                {w.destination || "Registered phone"}
              </Body>
              <Body>Wallet withdrawal · {money(w.amount)}</Body>
              <Body>
                {w.status === "paid"
                  ? "Payout charge"
                  : "Charge on successful payment"}{" "}
                ·{" "}
                {w.fee == null ? "Awaiting finance confirmation" : money(w.fee)}
              </Body>
              {w.feePayer && (
                <Body>
                  Charge paid by ·{" "}
                  {w.feePayer === "platform"
                    ? "LoadMaster"
                    : "You, from this withdrawal"}
                </Body>
              )}
              {w.netAmount != null && (
                <Body>
                  {w.status === "paid"
                    ? "Amount received"
                    : "Amount on successful payment"}{" "}
                  · {money(w.netAmount)}
                </Body>
              )}
              {!!w.reference && <Body>Payment reference · {w.reference}</Body>}
              {!!w.approvedAt && (
                <Body muted>
                  Approved · {new Date(w.approvedAt).toLocaleString()}
                </Body>
              )}
              {!!w.paidAt && (
                <Body muted>Paid · {new Date(w.paidAt).toLocaleString()}</Body>
              )}
              {w.attempts?.map((a) => (
                <Body key={a.id} muted>
                  {a.id} · {a.status}
                  {a.reference ? " · " + a.reference : ""}
                  {a.fee != null
                    ? ` · Recorded charge ${money(a.fee)} · ${a.feePayer === "platform" ? "LoadMaster pays" : "Deducted on success"}`
                    : ""}
                </Body>
              ))}
              <Body muted>
                {w.status === "requested"
                  ? "Office is reviewing your request."
                  : w.status === "approved"
                    ? "Approved. Finance still needs to send the payment."
                    : w.status === "processing"
                      ? "The transfer result is being checked. Your earnings stay reserved until finance confirms the outcome."
                      : w.status === "failed"
                        ? "Finance can retry the confirmed failure or reject the request to release your earnings."
                        : w.status === "rejected"
                          ? "The reservation has been released. Correct your details and submit a new request."
                          : "Payment confirmed. This receipt includes any provider charge."}
              </Body>
              {!!w.reason && <Body muted>{w.reason}</Body>}
            </Card>
          ))
      ) : (
        <Empty
          title="No payout requests yet"
          detail="Requests and decisions from operations appear here."
        />
      )}
    </Screen>
  );
}
export function Rewards() {
  const { data } = useDemo();
  const [promoOpen, setPromoOpen] = useState(false);
  const code = "LM-" + data?.profile.id.slice(-6).toUpperCase();
  return (
    <Screen>
      <Title>{"A good move\nis worth sharing."}</Title>
      <Card style={{ alignItems: "center", gap: 12 }}>
        <PromoBadgeArt size={84} />
        <Label>YOUR DEMO REFERRAL CODE</Label>
        <Title small>{code}</Title>
        <Body muted>
          Share your code to preview the referral experience. Rewards are
          recorded and approved by operations, not automatically promised.
        </Body>
        <View style={{ width: "100%", gap: 10 }}>
          <Button
            title="Preview loyalty offer card"
            onPress={() => setPromoOpen(true)}
          />
          <Button
            secondary
            title="Share referral code"
            icon="share-outline"
            onPress={() =>
              void Share.share({
                message: `My LoadMaster demo referral code is ${code}.`,
              })
            }
          />
        </View>
      </Card>
      <PromoModal visible={promoOpen} onClose={() => setPromoOpen(false)} />
      <Section title="Your reward records" />
      {data?.rewards?.length ? (
        data.rewards.map((r) => (
          <Card key={r.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Title small>{money(r.amount)}</Title>
              <Badge tone={r.status === "paid" ? "green" : "amber"}>
                {r.status}
              </Badge>
            </Row>
            <Body>
              {r.kind === "cashback" ? "Customer cashback" : "Referral bonus"}
            </Body>
            <Body muted>{r.reason}</Body>
          </Card>
        ))
      ) : (
        <Empty
          icon="gift-outline"
          title="No rewards recorded"
          detail="Approved referral and cashback records appear here."
        />
      )}
      <Card>
        <Label>DEMO ACCOUNT ADJUSTMENTS</Label>
        <Title small>{money(data?.adjustmentBalance || 0)}</Title>
        <Text style={s.small}>
          A clearing-account record of demo transfers, refunds and payouts. This
          is not a spendable customer wallet.
        </Text>
      </Card>
    </Screen>
  );
}
export function SupportCases() {
  const { data } = useDemo();
  const tickets = data?.tickets || [];
  return (
    <Screen>
      <Title>{"Your support\nconversations."}</Title>
      {tickets.length ? (
        tickets
          .slice()
          .reverse()
          .map((t) => (
            <Card key={t.id}>
              <Row style={{ justifyContent: "space-between" }}>
                <Label>{t.id}</Label>
                <Badge tone={t.status === "resolved" ? "green" : "amber"}>
                  {t.status}
                </Badge>
              </Row>
              <Title small>{t.subject}</Title>
              <Body>{t.message}</Body>
              {t.replies.map((r) => (
                <View
                  key={r.id}
                  style={{
                    backgroundColor: C.mint,
                    padding: 14,
                    borderRadius: 12,
                    gap: 7,
                  }}
                >
                  <Label>OPERATIONS REPLY</Label>
                  <Body>{r.message}</Body>
                  <Text style={s.small}>{new Date(r.at).toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          ))
      ) : (
        <Empty
          title="No support cases yet"
          detail="Reports you send from Help & support will appear here."
        />
      )}
    </Screen>
  );
}
