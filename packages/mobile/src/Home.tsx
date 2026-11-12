import { typography } from "./mobileDesign";
import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { money, stageLabels, terminal } from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useDemo, useAction } from "./state";
import {
  Badge,
  Body,
  Button,
  C,
  Card,
  ErrorBox,
  Hero,
  Icon,
  Label,
  Row,
  Screen,
  Section,
  Title,
  s,
} from "./ui";
import { MapCanvas, TruckArt, TruckFrontArt } from "./MapCanvas";
import { CustomerHome } from "./CustomerHome";
import { RouteSummary } from "./components";
import { useCountdown } from "./Delivery";
export function Home() {
  const { role } = useDemo();
  return role === "customer" ? <CustomerHome /> : <DriverHome />;
}
function Greeting() {
  const { data, role } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <View style={{ gap: 5 }}>
        <Label>
          LOADMASTER / {role === "driver" ? "DRIVER" : "CARGO, CONNECTED"}
        </Label>
        <Text
          style={{ ...typography.section, fontWeight: "700", color: C.ink }}
        >
          Hello, {data?.profile.name.split(" ")[0] || "there"}{" "}
          <Text style={{ color: C.green }}>↗</Text>
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View updates"
        onPress={() => nav.navigate("Notifications")}
        style={{
          width: 43,
          height: 43,
          borderRadius: 22,
          backgroundColor: C.mint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="notifications-outline" color={C.green} />
      </Pressable>
    </Row>
  );
}
function DriverHome() {
  const { data, error, refresh, client } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const action = useAction();
  const profile = data?.profile;
  const active = data?.orders.find((o) => !terminal(o));
  const offer = data?.offers[0];
  const left = useCountdown(offer?.offer?.expiresAt, data?.serverTime);
  const completed = data?.orders.filter((o) => o.stage === "delivered") || [];
  const earnings = completed.reduce((n, o) => n + o.financial.earning, 0);
  return (
    <Screen>
      <Greeting />
      <Card>
        <Label>YOUR DRIVER PAIRING NUMBER</Label>
        <Text
          selectable
          style={{ ...typography.headline, fontWeight: "700", color: C.green }}
        >
          {profile?.pairCode || "Loading…"}
        </Text>
        <Text style={s.small}>
          A customer can enter this number. You must still be online, eligible
          and accept the request.
        </Text>
      </Card>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      <Row>
        <View style={{ flex: 1, gap: 6 }}>
          <Title>
            {active
              ? "A good move,\nin progress."
              : profile?.online
                ? "Ready for your\nnext move."
                : "Your next move\nstarts here."}
          </Title>
        </View>
        <Badge tone={profile?.online ? "green" : "neutral"}>
          {profile?.online ? "ONLINE" : "OFFLINE"}
        </Badge>
      </Row>
      {!profile?.verified && (
        <Card style={{ backgroundColor: "#FFF6E5" }}>
          <Title small>Finish account verification</Title>
          <Body>
            Verified documents and vehicle details are required to receive
            orders.
          </Body>
          <Button
            title="View verification"
            onPress={() => nav.navigate("Verification")}
          />
        </Card>
      )}
      <MapCanvas order={active} height={235} />
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ gap: 5, flex: 1 }}>
            <Title small>
              {profile?.online ? "You’re online" : "You’re offline"}
            </Title>
            <Body muted>
              {profile?.online
                ? "Suitable requests will appear here."
                : "Go online when you’re ready to drive."}
            </Body>
          </View>
          <Switch
            accessibilityLabel="Available for new orders"
            value={!!profile?.online}
            disabled={action.busy || !profile}
            trackColor={{ false: "#CED7CE", true: C.green }}
            thumbColor="white"
            onValueChange={(online) =>
              void action.run(() => client.request("/availability", { online }))
            }
          />
        </Row>
        <ErrorBox message={action.error} />
      </Card>
      {active ? (
        <Card>
          <Badge>YOUR CURRENT DELIVERY</Badge>
          <Title small>{stageLabels[active.stage]}</Title>
          <RouteSummary order={active} compact />
          <Button
            title="Continue delivery"
            icon="arrow-forward"
            onPress={() => nav.navigate("Order", { id: active.id })}
          />
        </Card>
      ) : offer ? (
        <Hero eyebrow="NEW CARGO REQUEST" title="A new move is waiting.">
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              padding: 16,
              gap: 14,
            }}
          >
            <RouteSummary order={offer} compact />
            {left !== null && (
              <Badge tone={left <= 10 ? "red" : "amber"}>
                {`RESPOND IN ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} · OR IT GOES TO ANOTHER DRIVER`}
              </Badge>
            )}
            <Row style={{ justifyContent: "space-between" }}>
              <Label>Agreed fare</Label>
              <Title small>{money(offer.quote.total)}</Title>
            </Row>
            <Button
              title="Review request"
              onPress={() => nav.navigate("Offer", { id: offer.id })}
            />
          </View>
        </Hero>
      ) : (
        <Card>
          <View
            style={{
              backgroundColor: profile?.online ? "#EEF7F2" : "#F3F4F6",
              borderWidth: 1,
              borderColor: profile?.online ? "#68B684" : C.line,
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <TruckFrontArt size={56} />
            <View style={{ flex: 1, gap: 4 }}>
              <Title small>
                {profile?.online
                  ? "Listening for orders"
                  : "Take a moment. Then make a move."}
              </Title>
              <Body muted>
                {profile?.online
                  ? "No suitable request right now. Keep this app open while testing."
                  : "You won’t receive new requests while offline."}
              </Body>
            </View>
          </View>
        </Card>
      )}
      <Section title="Your day at a glance" />
      <Row>
        <Card style={{ flex: 1 }}>
          <Label>Completed</Label>
          <Text
            style={{ ...typography.title, fontWeight: "700", color: C.ink }}
          >
            {completed.length}
          </Text>
          <Text style={s.small}>demo deliveries</Text>
        </Card>
        <LinearGradient
          colors={["#173F30", "#08784D"]}
          style={{ flex: 1, padding: 18, borderRadius: 20, gap: 14 }}
        >
          <Label color={C.lime}>Earned</Label>
          <Text
            style={{ ...typography.section, fontWeight: "700", color: "white" }}
          >
            {profile?.preferences?.hideAmounts ? "UGX ••••••" : money(earnings)}
          </Text>
          <Text style={{ ...typography.caption, color: "#D7E9DA" }}>
            Payout status in Earnings
          </Text>
        </LinearGradient>
      </Row>
      <Card>
        <Row>
          <View style={{ flex: 1, gap: 6 }}>
            <Label>YOUR REGISTERED TRUCK</Label>
            <Title small>{profile?.vehicle || "Loading vehicle…"}</Title>
            <Text style={s.small}>
              {profile?.plate} ·{" "}
              {data?.trucks.find((t) => t.id === profile?.truckId)?.capacity}
            </Text>
          </View>
          <TruckArt size={82} />
        </Row>
      </Card>
    </Screen>
  );
}
