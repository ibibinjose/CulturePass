// template
import { Platform, ScrollView, ScrollViewProps } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  keyboardDismissMode = Platform.OS === "ios" ? "interactive" : "on-drag",
  contentInsetAdjustmentBehavior = "automatic",
  automaticallyAdjustKeyboardInsets = Platform.OS === "ios",
  ...props
}: Props) {
  if (Platform.OS === "web") {
    return (
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
