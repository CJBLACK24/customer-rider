import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import { getActivity, seedDemoActivityIfEmpty, ActivityItem } from "@/utils/activityStore";
import * as Icons from "phosphor-react-native";

export default function Activity() {
  const [data, setData] = useState<ActivityItem[]>([]);

  const load = useCallback(async () => {
    await seedDemoActivityIfEmpty();
    const items = await getActivity();
    setData(items);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const newItems = data.filter((i) => i.status === "pending");
  const recentItems = data.filter((i) => i.status !== "pending");

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
      <View style={styles.container}>
        <Typo size={28} fontWeight="900" style={{ marginBottom: spacingY._5 }}>
          <Typo size={28} fontWeight="900" color={colors.green}>Activity</Typo>
        </Typo>

        <FlatList
          ListHeaderComponent={
            <View>
              {newItems.length > 0 && (
                <>
                  <Typo size={16} color={colors.white} fontFamily="InterLight" style={{ marginBottom: spacingY._7 }}>
                    New
                  </Typo>
                  {newItems.map((item) => (
                    <View key={item.id} style={styles.row}>
                      <Icons.Wrench size={18} color={colors.green} weight="bold" />
                      <View style={{ flex: 1, marginLeft: spacingX._10 }}>
                        <Typo size={13} color={colors.neutral300} fontFamily="InterLight">
                          Request assistance
                        </Typo>
                        <Typo size={15} color={colors.white} fontWeight="800" fontFamily="InterLight">
                          {item.placeName || "—"}
                        </Typo>
                        <Typo size={12} color={colors.neutral400} fontFamily="InterLight" style={{ marginTop: 2 }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </Typo>
                      </View>
                      <View style={styles.dot} />
                    </View>
                  ))}
                  <View style={{ height: spacingY._12 }} />
                </>
              )}

              <Typo size={16} color={colors.white} fontFamily="InterLight" style={{ marginBottom: spacingY._7 }}>
                Recent
              </Typo>
            </View>
          }
          data={recentItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: spacingY._20 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Icons.Wrench size={18} color={colors.green} weight="bold" />
              <View style={{ flex: 1, marginLeft: spacingX._10 }}>
                <Typo size={15} color={colors.white} fontWeight="800" fontFamily="InterLight">
                  {item.title}
                </Typo>
                <Typo size={12} color={colors.neutral400} fontFamily="InterLight" style={{ marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Typo>
                <Typo size={12} color={colors.neutral400} fontFamily="InterLight" style={{ marginTop: 4 }}>
                  Rate →
                </Typo>
              </View>
              <Icons.Check size={18} color={colors.green} weight="bold" />
            </View>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: spacingX._15 },
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#121417", borderRadius: radius._15,
    paddingHorizontal: spacingX._15, paddingVertical: spacingY._10,
    marginBottom: spacingY._7,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
});
