import { typography } from "./mobileDesign";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDemo } from "./state";
import { Client } from "./api";
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
  Title,
  s,
} from "./ui";
import { TruckArt } from "./MapCanvas";
export function Auth() {
  const { role, url, signIn, error: sessionError } = useDemo();
  const [mode, setMode] = useState<"login" | "register" | "recover" | "verify">(
    "login",
  );
  const [address, setAddress] = useState(url);
  const [showConnection, setShowConnection] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{
    challenge: string;
    demoCode: string;
    forceReset?: boolean;
  } | null>(null);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (demo = false) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const client = new Client(address, role + "-1");
      let result: any;
      const defaultId =
        role === "driver" ? "brian@example.test" : "alex@example.test";
      const defaultPass = "DemoCargo2026!";
      const actualIdentifier = identifier.trim() || defaultId;
      const actualPassword = password.trim() || defaultPass;
      const actualCode = code.trim() || challenge?.demoCode || "";
      const actualName =
        name.trim() || (role === "driver" ? "Brian Okello" : "Alex Kamau");
      const actualPhone =
        phone.trim() ||
        (role === "driver" ? "+256 700 000 222" : "+256 700 000 111");

      if (demo)
        result = await client.request("/auth/login", {
          role,
          identifier: defaultId,
          password: defaultPass,
        });
      else if (mode === "verify")
        result = await client.request("/auth/verify", {
          challenge: challenge?.challenge,
          code: actualCode,
          ...(reset || challenge?.forceReset ? { password: actualPassword } : {}),
        });
      else if (mode === "register")
        result = await client.request("/auth/register", {
          role,
          name: actualName,
          phone: actualPhone,
          email: actualIdentifier,
          password: actualPassword,
        });
      else if (mode === "recover") {
        result = await client.request("/auth/recover", {
          identifier: actualIdentifier,
        });
        setReset(true);
      } else
        result = await client.request("/auth/login", {
          role,
          identifier: actualIdentifier,
          password: actualPassword,
        });
      if (result.token) await signIn(result, address);
      else {
        setChallenge(result);
        setMode("verify");
        setCode(result.demoCode || "");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Row style={{ justifyContent: "space-between", marginTop: 20 }}>
        <Row>
          <View style={[s.iconCircle, { backgroundColor: C.green }]}>
            <Icon name="arrow-up-outline" color="white" />
          </View>
          <Text
            style={{
              ...typography.section,
              fontWeight: "700",
              letterSpacing: -0.8,
              color: C.ink,
            }}
          >
            LoadMaster
          </Text>
        </Row>
        <Badge tone="neutral">
          {role === "driver" ? "DRIVER" : "CUSTOMER"}
        </Badge>
      </Row>
      <View style={{ marginTop: 25, gap: 16 }}>
        <TruckArt size={100} />
        <Label>YOUR NEXT MOVE STARTS HERE</Label>
        <Title>
          {mode === "verify"
            ? "A quick check.\nThen you’re in."
            : mode === "recover"
              ? "Let’s get you\nback in."
              : mode === "register"
                ? "Make your\nfirst move."
                : role === "driver"
                  ? "Good work.\nGreat journeys."
                  : "Move more.\nWorry less."}
        </Title>
        <Body muted>
          {mode === "verify"
            ? "Use the displayed demo code. No SMS is sent."
            : mode === "register"
              ? "Create your demo account to get started."
              : "Sign in to your connected cargo experience."}
        </Body>
      </View>
      <ErrorBox message={error || sessionError} />
      <Card>
        {mode === "register" && (
          <>
            <Field label="Full name" value={name} onChangeText={setName} />
            <Field
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}
        {mode !== "verify" && (
          <Field
            label={mode === "register" ? "Email (optional)" : "Phone or email"}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={
              role === "driver" ? "brian@example.test" : "alex@example.test"
            }
          />
        )}
        {mode === "verify" && (
          <>
            <Badge tone="amber">DEMO CODE: {challenge?.demoCode}</Badge>
            <Field
              label="Verification code"
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
            />
          </>
        )}
        {(mode === "login" ||
          mode === "register" ||
          (mode === "verify" && (reset || challenge?.forceReset))) && (
          <Field
            label={reset || challenge?.forceReset ? "New password" : "Password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}
        <Button
          title={
            mode === "verify"
              ? "Verify & continue"
              : mode === "register"
                ? "Create account"
                : mode === "recover"
                  ? "Continue"
                  : "Sign in"
          }
          busy={busy}
          onPress={() => void submit()}
        />
        {mode === "verify" && (
          <Button
            title="Resend demo code"
            secondary
            disabled={busy}
            onPress={() => {
              void new Client(address, role + "-1")
                .request("/auth/resend", { challenge: challenge?.challenge })
                .catch((e) => setError(e.message));
            }}
          />
        )}
      </Card>
      <Row style={{ justifyContent: "space-between" }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(null);
            setChallenge(null);
            setReset(false);
            setMode(mode === "login" ? "register" : "login");
          }}
          style={{ paddingVertical: 10 }}
        >
          <Text style={s.link}>
            {mode === "login" ? "Create account" : "Back to sign in"}
          </Text>
        </Pressable>
        {mode === "login" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode("recover");
              setError(null);
            }}
            style={{ paddingVertical: 10 }}
          >
            <Text style={s.link}>Forgot password?</Text>
          </Pressable>
        )}
      </Row>
      <Button
        title="Explore with a demo account"
        secondary
        busy={busy}
        onPress={() => void submit(true)}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowConnection(!showConnection)}
        style={{ paddingVertical: 10 }}
      >
        <Row>
          <Icon name="options-outline" size={18} color={C.muted} />
          <Text style={s.small}>Demo service connection</Text>
        </Row>
      </Pressable>
      {showConnection && (
        <Field
          label="Service URL"
          value={address}
          onChangeText={setAddress}
          keyboardType="url"
        />
      )}
      <Text style={s.small}>
        Prototype environment. Use synthetic details; no real payments or
        identity verification take place.
      </Text>
    </Screen>
  );
}
