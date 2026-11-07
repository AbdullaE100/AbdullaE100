import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { REPORT_REASONS } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";

export function ReportSheet({ open, onClose, listingId, userId, onDone }: { open: boolean; onClose: () => void; listingId: number; userId: string; onDone: () => void }) {
  const c = useColors();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("reports").insert({ listing_id: listingId, reporter_id: userId, reason, details: details.trim() || null });
    setBusy(false);
    if (error) return setErr(error.code === "23505" ? "You've already reported this ad." : "Couldn't send your report. Try again.");
    onClose();
    onDone();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Report this ad" footer={<Button title="Send report" variant="danger" size="lg" style={styles.flex} disabled={!reason} loading={busy} onPress={submit} />}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text tone="muted">Tell us what's wrong. The seller won't see who reported it.</Text>
        <View role="radiogroup" style={styles.list}>
          {REPORT_REASONS.map((r) => {
            const on = reason === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setReason(r.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.option, { borderColor: on ? c.danger : c.border, backgroundColor: on ? c.dangerSoft : c.surface }]}
              >
                <View style={[styles.radio, { borderColor: on ? c.danger : c.borderStrong, backgroundColor: on ? c.danger : "transparent" }]}>{on && <Check size={12} color="#fff" strokeWidth={3} />}</View>
                <Text variant="bodyLg" weight="600">
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Input label="Details" optional value={details} onChangeText={setDetails} multiline maxLength={1000} placeholder="Anything that helps us check, e.g. the seller asked for an advance payment." error={err} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 14 },
  list: { gap: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderRadius: radius.lg },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
});
