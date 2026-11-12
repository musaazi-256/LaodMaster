import React from "react";
import {
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  View,
  useWindowDimensions,
  type ModalProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
/** One native modal surface; transparent confirmations scroll at large text sizes. */
export function MobileModal({
  children,
  onRequestClose,
  transparent,
  ...props
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal
      {...props}
      transparent={transparent}
      onRequestClose={onRequestClose}
      onDismiss={props.onDismiss}
      allowSwipeDismissal={Platform.OS === "ios" && !transparent}
      statusBarTranslucent={Platform.OS === "android"}
      navigationBarTranslucent={Platform.OS === "android"}
    >
      {transparent ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View accessibilityViewIsModal style={{ flex: 1 }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              contentContainerStyle={{
                flexGrow: 1,
                minHeight: height,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      ) : (
        children
      )}
    </Modal>
  );
}
