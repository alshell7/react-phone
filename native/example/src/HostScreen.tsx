import { ScrollView, Text, View } from "react-native";
import { usePhoneTheme, withAlpha } from "@azeer-ui-widget/react-native-phone";

/** Neutral stand-in for the host app beneath the island. No invented data. */
export function HostScreen({ topInset = 0 }: { topInset?: number }) {
  const theme = usePhoneTheme();
  const block = withAlpha(
    theme.foreground,
    theme.appearance === "dark" ? 0.1 : 0.06,
  );
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.surface }}
      contentContainerStyle={{
        paddingTop: topInset + 84,
        paddingHorizontal: 20,
        paddingBottom: 140,
        gap: 14,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 30,
          fontWeight: "700",
          letterSpacing: -0.5,
          color: theme.foreground,
        }}
      >
        Your app
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 21, color: theme.muted }}>
        The island floats above your screens. Calls keep going while people
        navigate, and the capsule shows status, a live timer, and voice
        activity.
      </Text>
      {Array.from({ length: 6 }, (_, i) => (
        <View
          key={i}
          style={{
            borderRadius: 18,
            backgroundColor: theme.background,
            padding: 16,
            gap: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: block,
            }}
          />
          <View style={{ flex: 1, gap: 8 }}>
            <View
              style={{
                height: 12,
                width: `${60 + ((i * 13) % 30)}%`,
                borderRadius: 6,
                backgroundColor: block,
              }}
            />
            <View
              style={{
                height: 10,
                width: `${35 + ((i * 17) % 40)}%`,
                borderRadius: 5,
                backgroundColor: block,
              }}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
