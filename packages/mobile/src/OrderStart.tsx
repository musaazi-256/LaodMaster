import { TruckOption } from "./TruckOption";
import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { terminal, money, stageLabels } from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useDemo, useAction } from "./state";
import { CargoScreen, CargoCard, CargoButton, cs } from "./CargoUI";
import { Field, ErrorBox, Empty, Icon } from "./ui";
import { typography as type } from "./mobileDesign";
import { customerTheme as T } from "./customerTheme";
export function OrderStart({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "OrderStart">) {
  const { data, client } = useDemo();
  const action = useAction();
  const [truckId, setTruckId] = useState("small");
  const [code, setCode] = useState("");
  const mode = route.params.mode;
  const history = [...(data?.orders || [])]
    .filter(terminal)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const next = () => navigation.navigate("Locations", { truckId });
  return (
    <CargoScreen
      title={
        mode === "repeat"
          ? "Order again"
          : mode === "truck"
            ? "Choose a truck"
            : "Match a driver"
      }
      subtitle={
        mode === "repeat"
          ? "Choose a past trip, then review and edit its details."
          : mode === "truck"
            ? "Choose the right capacity before setting your route."
            : "Enter a driver’s short number or LoadMaster ID."
      }
      back={() => navigation.goBack()}
      footer={
        mode === "repeat" ? undefined : (
          <CargoButton
            title={
              action.busy
                ? "Checking driver…"
                : mode === "driver"
                  ? "Check driver & continue"
                  : "Continue to locations"
            }
            disabled={
              action.busy ||
              (mode === "driver" ? !code.trim() : !data?.trucks.length)
            }
            onPress={() => {
              if (mode === "truck") {
                next();
                return;
              }
              void action.run(async () => {
                const driver = await client.request<{
                  pairCode: string;
                  truckId: string;
                }>("/account/pair", { code: code.trim(), truckId: "small" });
                navigation.navigate("Locations", {
                  truckId: driver.truckId,
                  pairCode: driver.pairCode,
                });
              });
            }}
          />
        )
      }
    >
      <ErrorBox message={action.error} />
      {mode === "repeat" &&
        (history.length ? (
          history.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              accessibilityLabel={`Repeat trip ${o.id}`}
              onPress={() =>
                navigation.navigate("Locations", { repeatId: o.id })
              }
            >
              <CargoCard>
                <View style={cs.row}>
                  <Icon name="time-outline" color={T.green} />
                  <Text style={[type.label, { flex: 1, color: T.ink }]}>
                    {o.quote.pickup.name} → {o.quote.destination.name}
                  </Text>
                  <Icon name="chevron-forward" />
                </View>
                <Text style={cs.muted}>
                  {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                  {stageLabels[o.stage]} · {money(o.quote.total)}
                </Text>
                <Text style={cs.muted}>
                  Review locations, cargo and contacts. A fresh price will be
                  calculated.
                </Text>
              </CargoCard>
            </Pressable>
          ))
        ) : (
          <Empty
            title="No past trips yet"
            detail="Completed, returned and cancelled trips appear here. Order a truck to get started."
          />
        ))}
      {mode === "truck" &&
        data?.trucks.map((t) => (
          <TruckOption
            key={t.id}
            truck={t}
            selected={truckId === t.id}
            onPress={() => setTruckId(t.id)}
          />
        ))}
      {mode === "driver" && (
        <CargoCard>
          <Field
            label="Driver number or ID"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. 2001 or driver-1"
          />
          <Text style={cs.body}>
            Your order goes directly to this driver for acceptance. We check
            their availability and truck capacity again when you order.
          </Text>
        </CargoCard>
      )}
    </CargoScreen>
  );
}
