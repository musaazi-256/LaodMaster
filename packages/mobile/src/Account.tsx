import { typography } from "./mobileDesign";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
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
import { MenuRow } from "./components";
export function Account() {
  const { data, role, logout } = useDemo();
  const [more, setMore] = useState(false);
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  return (
    <Screen plain>
      <Text
        accessibilityRole="header"
        style={[typography.title, { color: C.ink, marginBottom: 20 }]}
      >
        Account
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View your profile"
        onPress={() => nav.navigate("Profile")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 8,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: C.mint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[typography.section, { color: C.green }]}>
            {(data?.profile.name || "Demo Account")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[typography.label, { color: C.ink }]}>
            {data?.profile.name || "Demo account"}
          </Text>
          <Text style={s.small}>{data?.profile.phone || "Connecting…"}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={C.muted} />
      </Pressable>
      <View
        style={{
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 16,
          paddingHorizontal: 16,
        }}
      >
        <MenuRow
          compact
          icon="person-outline"
          title="Your profile"
          detail="Update your name and contact details"
          onPress={() => nav.navigate("Profile")}
        />
        {role === "driver" && (
          <MenuRow
            compact
            icon="shield-checkmark-outline"
            title="Vehicle & verification"
            detail="Registered truck and document status"
            onPress={() => nav.navigate("Verification")}
          />
        )}
        <MenuRow
          compact
          icon="headset-outline"
          title="Help & support"
          detail="Get help with orders and payments"
          onPress={() => nav.navigate("Help")}
        />
        <MenuRow
          compact
          icon="card-outline"
          title="Payment methods"
          detail="Manage your cards and payment options"
          onPress={() => nav.navigate("PaymentMethods")}
        />
        {role === "customer" && (
          <MenuRow
            compact
            icon="bookmark-outline"
            title="Saved places"
            detail="Manage pickup and drop-off locations"
            onPress={() => nav.navigate("SavedPlaces")}
          />
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More account options"
        accessibilityState={{ expanded: more }}
        onPress={() => setMore(!more)}
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text style={s.small}>More account options</Text>
        <Icon
          name={more ? "chevron-up" : "chevron-down"}
          size={18}
          color={C.muted}
        />
      </Pressable>
      {more && (
        <View style={{ borderTopWidth: 1, borderColor: C.line }}>
          <MenuRow
            compact
            icon="options-outline"
            title="Demo connection & accounts"
            detail="Switch test account or service address"
            onPress={() => nav.navigate("Settings")}
          />
          {role === "driver" && (
            <MenuRow
              compact
              icon="wallet-outline"
              title="Payout requests"
              onPress={() => nav.navigate("PayoutRequests")}
            />
          )}
          {role === "driver" && (
            <MenuRow
              compact
              icon="time-outline"
              title="Request history"
              onPress={() => nav.navigate("RequestHistory")}
            />
          )}
          <MenuRow
            compact
            icon="gift-outline"
            title="Referrals & rewards"
            onPress={() => nav.navigate("Rewards")}
          />
          <MenuRow
            compact
            icon="chatbubbles-outline"
            title="Your support cases"
            onPress={() => nav.navigate("SupportCases")}
          />
          <MenuRow
            compact
            icon="lock-closed-outline"
            title="Change password"
            onPress={() => nav.navigate("Password")}
          />
          <MenuRow
            compact
            icon="settings-outline"
            title="Settings & privacy"
            onPress={() => nav.navigate("Preferences")}
          />
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginTop: 18,
        }}
        onPress={() =>
          Alert.alert(
            "Sign out?",
            "Active orders remain recorded and can be resumed after signing in.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", onPress: () => void logout() },
            ],
          )
        }
      >
        <Icon name="log-out-outline" size={22} color={C.muted} />
        <Text style={[typography.subhead, { color: C.ink }]}>Log out</Text>
      </Pressable>
      <Text style={[s.small, { marginTop: 18 }]}>
        App demo. No real transactions.
      </Text>
    </Screen>
  );
}
export function Settings({
  navigation,
}: NativeStackScreenProps<RootStack, "Settings">) {
  const { account, url, role, configure } = useDemo();
  const [address, setAddress] = useState(url);
  const [selected, setSelected] = useState(account);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!/^https?:\/\/[^ /]+(?::\d+)?(?:\/.*)?$/.test(address.trim())) {
      setError("Enter a valid http:// or https:// service address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await configure(selected, address.trim());
      navigation.popToTop();
    } catch {
      setError("Could not save connection settings. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      footer={
        <>
          <ErrorBox message={error} />
          <Button
            title="Save & reconnect"
            busy={busy}
            onPress={() => void save()}
          />
        </>
      }
    >
      <Title>Your demo setup.</Title>
      <Body muted>
        Both apps must connect to the same demo service. These are separate
        synthetic accounts, not production sign-in.
      </Body>
      <Card>
        <Field
          label="Demo service URL"
          value={address}
          onChangeText={setAddress}
          keyboardType="url"
          placeholder="http://localhost:4000"
        />
        <Text style={s.small}>
          iOS simulator: http://localhost:4000{"\n"}Android emulator:
          http://10.0.2.2:4000{"\n"}Physical device: your computer’s LAN IP on
          port 4000.
        </Text>
      </Card>
      <Section title="Choose a test account" />
      {[1, 2].map((n) => {
        const id = role + "-" + n;
        const name =
          role === "customer"
            ? n === 1
              ? "Alex Mukasa"
              : "Sarah Nakato"
            : n === 1
              ? "Brian Kato · Large truck"
              : "Grace Nambasa · Medium truck";
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === id }}
            accessibilityLabel={name}
            key={id}
            onPress={() => setSelected(id)}
          >
            <Card>
              <Row>
                <Icon
                  name={
                    selected === id ? "radio-button-on" : "radio-button-off"
                  }
                  color={C.green}
                />
                <View style={{ flex: 1, gap: 5 }}>
                  <Title small>{name}</Title>
                  <Text style={s.small}>{id}</Text>
                </View>
              </Row>
            </Card>
          </Pressable>
        );
      })}
      <Body muted>
        Use two driver accounts to test competing acceptance. Each customer can
        have one immediate active order, plus scheduled orders.
      </Body>
    </Screen>
  );
}
export function Profile() {
  const { data, client } = useDemo();
  const [name, setName] = useState(data?.profile.name || "");
  const [email, setEmail] = useState(data?.profile.email || "");
  const action = useAction();
  const [saved, setSaved] = useState(false);
  return (
    <Screen>
      <Title>Your profile</Title>
      <Card>
        <Field
          label="Your name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setSaved(false);
          }}
        />
        <Field label="Email" value={email} onChangeText={setEmail} />
        <Label>REGISTERED DEMO PHONE</Label>
        <Body>{data?.profile.phone}</Body>
        <Text style={s.small}>
          Phone and payment identity are fixed for these test accounts.
        </Text>
        <ErrorBox message={action.error} />
        {saved && <Badge>Profile saved</Badge>}
        <Button
          title="Save profile"
          busy={action.busy}
          onPress={() =>
            void action.run(async () => {
              await client.request("/account/profile", { name, email });
              setSaved(true);
            }, success.profileSaved())
          }
        />
      </Card>
    </Screen>
  );
}
export function Help({
  navigation,
}: NativeStackScreenProps<RootStack, "Help">) {
  return (
    <Screen>
      <Label>WE’RE HERE FOR YOUR MOVE</Label>
      <Title>{"A little help\ngoes a long way."}</Title>
      {[
        [
          "How do I order a truck?",
          "Choose pickup and destination, select a suitable truck, confirm handling and payment method, then tap Order a truck.",
        ],
        [
          "Who loads and offloads?",
          "Transport only means you arrange handling. Add helpers at pickup, destination, or both before ordering. Stairs, heavy equipment and complex loads need an assisted quote.",
        ],
        [
          "When do I pay?",
          "The demo payment starts after delivery is confirmed. Mobile Money and card outcomes are simulated; no real payment is sent.",
        ],
        [
          "My payment is still checking",
          "Check the current payment status. Do not start another payment while the first outcome is uncertain.",
        ],
        [
          "How do the apps stay connected?",
          "Both apps use the same demo service and refresh in the foreground. Open the driver app, go online, and review the customer’s request.",
        ],
        [
          "Are maps and phone calls live?",
          "Native maps display planned routes; driver GPS progress is simulated. All names, contacts and card details are synthetic; call actions are disabled.",
        ],
      ].map(([title, detail]) => (
        <Card key={title}>
          <Title small>{title}</Title>
          <Body muted>{detail}</Body>
        </Card>
      ))}
      <Button
        title="Contact demo support"
        icon="headset-outline"
        onPress={() => navigation.navigate("Support", {})}
      />
    </Screen>
  );
}
export function Support({
  route,
}: NativeStackScreenProps<RootStack, "Support">) {
  const { client } = useDemo();
  const action = useAction();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const id = route.params?.orderId;
  return (
    <Screen>
      <Label>LET’S SORT IT OUT</Label>
      <Title>{"Tell us what\nhappened."}</Title>
      <Body muted>
        {id
          ? `Your report will be saved against ${id} and visible in the demo record.`
          : "Your support case will be saved and visible to the demo operations team."}
      </Body>
      <Card>
        <Field
          label="Describe the issue"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Payment, loading, cargo, or something else…"
        />
        <ErrorBox message={action.error} />
        {sent ? (
          <Badge>Issue recorded · Demo support only</Badge>
        ) : (
          <Button
            title={id ? "Save issue report" : "Send support request"}
            busy={action.busy}
            disabled={message.trim().length < 5}
            onPress={() => {
              if (id)
                void action.run(async () => {
                  await client.request(`/orders/${id}/issue`, { message });
                  setSent(true);
                }, success.supportSent(true));
              else
                void action.run(async () => {
                  await client.request("/account/ticket", {
                    subject: "Help with my account",
                    message,
                  });
                  setSent(true);
                }, success.supportSent(false));
            }}
          />
        )}
      </Card>
      <Text style={s.small}>
        No SMS, email or call is sent by this demo. For a real cargo emergency,
        use your established operations contact.
      </Text>
    </Screen>
  );
}
