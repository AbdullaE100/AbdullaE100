import { useState, type ComponentRef, type ReactNode, type Ref } from "react";
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { radius, type as typeScale, useColors } from "@/lib/theme";
import { Text } from "./text";

export type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  /** Shown inside the field before the value, e.g. "Rs". */
  prefix?: string;
  /** Shown inside the field after the value, e.g. "km". */
  suffix?: string;
  left?: ReactNode;
  right?: ReactNode;
  optional?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function Input({ label, hint, error, prefix, suffix, left, right, optional, containerStyle, style, multiline, onFocus, onBlur, ref, ...props }: InputProps) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const border = error ? c.danger : focused ? c.brand : c.borderStrong;
  return (
    <View style={[styles.wrap, containerStyle]}>
      {!!label && (
        <Text variant="small" weight="700" style={styles.label}>
          {label}
          {optional && (
            <Text variant="small" tone="subtle">
              {"  "}Optional
            </Text>
          )}
        </Text>
      )}
      <View style={[styles.field, { borderColor: border, backgroundColor: c.surface, borderWidth: focused || error ? 1.5 : 1 }, multiline && styles.multiline]}>
        {left}
        {!!prefix && (
          <Text variant="bodyLg" tone="muted" style={styles.affix}>
            {prefix}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={c.fgSubtle}
          selectionColor={c.brand}
          cursorColor={c.brand}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          maxFontSizeMultiplier={1.6}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={hint}
          aria-invalid={!!error}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: c.fg }, multiline && styles.inputMultiline, style]}
          {...props}
        />
        {!!suffix && (
          <Text variant="bodyLg" tone="muted" style={styles.affix}>
            {suffix}
          </Text>
        )}
        {right}
      </View>
      {error ? (
        <Text variant="small" tone="danger" style={styles.below} accessibilityLiveRegion="polite" role="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="subtle" style={styles.below}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginBottom: 0 },
  field: { minHeight: 48, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  multiline: { alignItems: "flex-start", paddingVertical: 10 },
  input: { flex: 1, minWidth: 0, ...typeScale.bodyLg, paddingVertical: 12, minHeight: 46, outlineStyle: "none" } as object,
  inputMultiline: { minHeight: 120, paddingVertical: 2 },
  affix: { fontWeight: "600" },
  below: { marginTop: 0 },
});
