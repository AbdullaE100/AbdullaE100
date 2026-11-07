import { Check, ChevronDown, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { radius, type as typeScale, useColors } from "@/lib/theme";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type Option<V extends string | number = string> = { value: V; label: string; sub?: string; count?: number; group?: string };

/** Searchable single-choice list in a bottom sheet. */
export function OptionSheet<V extends string | number>({
  open,
  onClose,
  title,
  options,
  value,
  onChange,
  anyLabel,
  searchable = options.length > 12,
  placeholder = "Search",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: Option<V>[];
  value: V | null | undefined;
  onChange: (v: V | null) => void;
  /** Adds a first row that clears the choice, e.g. "Any make". */
  anyLabel?: string;
  searchable?: boolean;
  placeholder?: string;
}) {
  const c = useColors();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
    return anyLabel && !needle ? [{ value: null as V | null, label: anyLabel }, ...list] : list;
  }, [q, options, anyLabel]);

  const close = () => {
    setQ("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title={title} height={options.length > 8 ? "tall" : "auto"}>
      {searchable && (
        <View style={[styles.search, { backgroundColor: c.surface2 }]}>
          <Search size={18} color={c.fgSubtle} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor={c.fgSubtle}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={placeholder}
            style={[styles.searchInput, { color: c.fg }]}
          />
        </View>
      )}
      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.value ?? "__any")}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text tone="muted" style={styles.empty}>
            Nothing matches “{q}”.
          </Text>
        }
        renderItem={({ item, index }) => {
          const selected = item.value === (value ?? null);
          const prevGroup = index > 0 ? (rows[index - 1] as Option<V>).group : undefined;
          const group = (item as Option<V>).group;
          return (
            <>
              {group && group !== prevGroup && !q && (
                <Text variant="caption" weight="700" tone="subtle" style={styles.group}>
                  {group.toUpperCase()}
                </Text>
              )}
              <Pressable
                onPress={() => {
                  onChange(item.value as V | null);
                  close();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.surface2 : "transparent" }]}
              >
                <View style={styles.rowText}>
                  <Text variant="bodyLg" weight={selected ? "700" : "400"} tone={selected ? "brand" : "default"}>
                    {item.label}
                  </Text>
                  {!!(item as Option<V>).sub && (
                    <Text variant="small" tone="subtle">
                      {(item as Option<V>).sub}
                    </Text>
                  )}
                </View>
                {(item as Option<V>).count != null && (
                  <Text variant="small" tone="subtle" numeric>
                    {(item as Option<V>).count!.toLocaleString("en-LK")}
                  </Text>
                )}
                {selected && <Check size={20} color={c.brandText} />}
              </Pressable>
            </>
          );
        }}
      />
    </Sheet>
  );
}

/** Field that looks like an input and opens an OptionSheet. */
export function SelectField<V extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = "Choose",
  error,
  anyLabel,
  disabled,
  optional,
  title,
}: {
  label: string;
  value: V | null | undefined;
  options: Option<V>[];
  onChange: (v: V | null) => void;
  placeholder?: string;
  error?: string | null;
  anyLabel?: string;
  disabled?: boolean;
  optional?: boolean;
  title?: string;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      <Text variant="small" weight="700">
        {label}
        {optional && (
          <Text variant="small" tone="subtle">
            {"  "}Optional
          </Text>
        )}
      </Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          styles.control,
          { borderColor: error ? c.danger : c.borderStrong, backgroundColor: pressed ? c.surface2 : c.surface, borderWidth: error ? 1.5 : 1 },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text variant="bodyLg" tone={current ? "default" : "subtle"} numberOfLines={1} style={styles.flex}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color={c.fgMuted} />
      </Pressable>
      {!!error && (
        <Text variant="small" tone="danger" role="alert">
          {error}
        </Text>
      )}
      <OptionSheet open={open} onClose={() => setOpen(false)} title={title ?? label} options={options} value={value} onChange={onChange} anyLabel={anyLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 12, borderRadius: radius.lg, minHeight: 44 },
  searchInput: { flex: 1, minWidth: 0, ...typeScale.bodyLg, paddingVertical: 10, outlineStyle: "none" } as object,
  list: { paddingVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 20, paddingVertical: 8 },
  rowText: { flex: 1, gap: 2 },
  group: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, letterSpacing: 0.6 },
  empty: { textAlign: "center", padding: 24 },
  field: { gap: 6 },
  control: { minHeight: 48, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  flex: { flex: 1 },
});
