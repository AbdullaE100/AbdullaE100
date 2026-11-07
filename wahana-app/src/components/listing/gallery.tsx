import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useRef, useState } from "react";
import { FlatList, Modal, Pressable, StatusBar, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { photoUrl } from "@/lib/env";

type Photo = { id: string; path: string; thumb_path: string | null; width: number | null; height: number | null };

/** Swipeable photos with a counter; tap for full screen. */
export function Gallery({ photos, title, type, seed, height }: { photos: Photo[]; title: string; type: string; seed: number; height: number }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  if (!photos.length) return <VehiclePlaceholder type={type} seed={seed} style={{ width, height }} artWidth={Math.min(width * 0.55, 260)} label="No photos yet" />;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={{ width, height }}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        onScroll={onScroll}
        scrollEventThrottle={32}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <Pressable onPress={() => setViewer(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${photos.length}. Open full screen`}>
            <Image
              source={{ uri: photoUrl(item.path)! }}
              placeholder={item.thumb_path ? { uri: photoUrl(item.thumb_path)! } : undefined}
              style={{ width, height }}
              contentFit="cover"
              transition={150}
              priority={i === 0 ? "high" : "normal"}
            />
          </Pressable>
        )}
      />
      <View style={styles.counter} pointerEvents="none">
        <Text variant="small" weight="700" tone="inverse" numeric>
          {index + 1} / {photos.length}
        </Text>
      </View>
      <Viewer photos={photos} start={viewer} onClose={() => setViewer(null)} title={title} />
    </View>
  );
}

function Viewer({ photos, start, onClose, title }: { photos: Photo[]; start: number | null; onClose: () => void; title: string }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Photo>>(null);
  return (
    <Modal
      visible={start != null}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={["portrait", "landscape"]}
      onShow={() => setIndex(start ?? 0)}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.viewer}>
        {start != null && (
          <FlatList
            ref={list}
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={start}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <Image source={{ uri: photoUrl(item.path)! }} style={{ width, height }} contentFit="contain" accessibilityLabel={title} />}
          />
        )}
        <View style={[styles.viewerBar, { top: insets.top + 8 }]}>
          <Text variant="body" weight="700" tone="inverse" numeric>
            {index + 1} / {photos.length}
          </Text>
          <IconButton tone="overlay" label="Close photos" icon={<X size={24} color="#fff" />} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  counter: { position: "absolute", right: 12, bottom: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  viewer: { flex: 1, backgroundColor: "#000" },
  viewerBar: { position: "absolute", left: 16, right: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
