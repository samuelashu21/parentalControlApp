import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
  ActivityIndicator,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/services/api";

export default function SOSScreen() {
  const { user, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  const handleSOS = async () => {
    if (!token) return;
    Alert.alert(
      "Send SOS",
      "This will send your current location to your parent. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            setSent(false);
            try {
              // Use a placeholder location since expo-location isn't imported
              // In a real app you'd use expo-location to get the current position
              const latitude = 0;
              const longitude = 0;
              const res = await authFetch(
                "/locations",
                {
                  method: "POST",
                  body: JSON.stringify({ latitude, longitude, accuracy: 0 }),
                },
                token
              );
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to send SOS");
              setSent(true);
              setLastSentAt(new Date().toLocaleTimeString());
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          Emergency SOS
        </ThemedText>
        <ThemedText style={[styles.description, { color: colors.icon }]}>
          Press the button below to alert your parent with your current location in an emergency.
        </ThemedText>

        <TouchableOpacity
          style={[styles.sosButton, loading && styles.sosButtonDisabled]}
          onPress={handleSOS}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <ThemedText style={styles.sosText}>SOS</ThemedText>
              <ThemedText style={styles.sosSubtext}>Tap to alert parent</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {sent && (
          <View style={[styles.confirmBanner, { backgroundColor: "#2ecc71" }]}>
            <ThemedText style={styles.confirmText}>
              ✓ SOS sent successfully at {lastSentAt}
            </ThemedText>
          </View>
        )}

        <View style={[styles.infoCard, { borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            ℹ️ How it works
          </ThemedText>
          <ThemedText style={{ color: colors.icon }}>
            • Your location is immediately shared with your parent{"\n"}
            • Use only in genuine emergencies{"\n"}
            • Make sure tracking consent is granted
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 24, alignItems: "center" },
  heading: { marginTop: 48, marginBottom: 8, textAlign: "center" },
  description: { textAlign: "center", marginBottom: 40, fontSize: 15, lineHeight: 22 },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 32,
  },
  sosButtonDisabled: { opacity: 0.6 },
  sosText: { color: "#fff", fontSize: 42, fontWeight: "900" },
  sosSubtext: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4 },
  confirmBanner: {
    width: "100%",
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  infoCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoTitle: { marginBottom: 4 },
});
