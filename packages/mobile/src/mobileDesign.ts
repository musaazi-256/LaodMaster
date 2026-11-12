import { Platform, type TextStyle } from "react-native";
const ios = Platform.OS === "ios";
const type = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle["fontWeight"] = "400",
): TextStyle => ({ fontSize, lineHeight, fontWeight });
/** System fonts and scalable points/sp; roles follow HIG and Material hierarchy. */
export const typography = {
  largeTitle: type(ios ? 34 : 32, 41, "700"),
  title: type(ios ? 28 : 28, 34, "700"),
  headline: type(ios ? 22 : 24, 30, "600"),
  section: type(ios ? 20 : 20, 26, "600"),
  body: type(ios ? 17 : 16, 24),
  label: type(ios ? 17 : 16, 24, "600"),
  subhead: type(ios ? 15 : 14, 21),
  caption: type(ios ? 13 : 12, 18),
};
export const metrics = {
  touch: ios ? 44 : 48,
  radius: 16,
  sheetRadius: 28,
  spacing: 16,
};
