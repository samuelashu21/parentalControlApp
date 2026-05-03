import React from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/services/api";

export default function PrivacyScreen() {
  const { user, token, refreshUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleGrantConsent = async () => {
    if (!token) return;
    try {
      const res = await authFetch("/auth/grant-consent", { method: "PATCH" }, token);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant consent");
      await refreshUser();
      Alert.alert("Success", "Tracking consent granted.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRequestPause = async () => {
    Alert.alert(
      "Request Pause",
      "Send a tracking pause request to your parent?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: () => {
            // In a full implementation, this would send a notification to the parent
            Alert.alert(
              "Request Sent",
              "Your parent has been notified of your pause request. They can approve it from the Devices tab."
            );
          },
        },
      ]
    );
  };

  if (user?.role !== "child") {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>This screen is for children only.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          Privacy & Tracking
        </ThemedText>

        <View style={[styles.infoCard, { borderColor: colors.tint, backgroundColor: colors.tint + "15" }]}>
          <ThemedText style={styles.infoIcon}>👁️</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            Monitoring Notice
          </ThemedText>
          <ThemedText style={{ color: colors.icon, lineHeight: 22 }}>
            Your location is being monitored by your parent for your safety. This app collects location
            data to keep you safe and help your family stay connected.
          </ThemedText>
        </View>

        {/* Tracking Status */}
        <View style={[styles.statusCard, { borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold">Tracking Status</ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: user?.isTrackingPaused ? "#e74c3c" : "#2ecc71" },
              ]}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText type="defaultSemiBold">
                {user?.isTrackingPaused ? "Tracking Paused" : "Tracking Active"}
              </ThemedText>
              <ThemedText style={{ color: colors.icon, fontSize: 13 }}>
                {user?.isTrackingPaused
                  ? "Your parent has paused location tracking."
                  : "Your location is being shared with your parent."}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Consent Status */}
        <View style={[styles.statusCard, { borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold">Consent Status</ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: user?.trackingConsent ? "#2ecc71" : "#f39c12" },
              ]}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText type="defaultSemiBold">
                {user?.trackingConsent ? "Consent Granted" : "Consent Pending"}
              </ThemedText>
              <ThemedText style={{ color: colors.icon, fontSize: 13 }}>
                {user?.trackingConsent
                  ? "You have agreed to location tracking."
                  : "You have not yet agreed to location tracking."}
              </ThemedText>
            </View>
          </View>
          {!user?.trackingConsent && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleGrantConsent}
            >
              <ThemedText style={styles.buttonText}>Grant Consent</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Request Pause */}
        {!user?.isTrackingPaused && (
          <TouchableOpacity
            style={[styles.pauseBtn, { borderColor: "#f39c12" }]}
            onPress={handleRequestPause}
          >
            <ThemedText style={{ color: "#f39c12", fontWeight: "700" }}>
              ⏸ Request Tracking Pause
            </ThemedText>
          </TouchableOpacity>
        )}

        <View style={[styles.dataCard, { borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            📋 What data is collected?
          </ThemedText>
          <ThemedText style={{ color: colors.icon, lineHeight: 22 }}>
            • GPS location (latitude & longitude){"\n"}
            • Location accuracy{"\n"}
            • Timestamp of each location update{"\n"}
            • Device battery level{"\n"}
            • Last active time
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { marginTop: 48, marginBottom: 20 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    gap: 8,
  },
  infoIcon: { fontSize: 32 },
  infoTitle: { textAlign: "center" },
  statusCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 14, gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  statusTextContainer: { flex: 1, gap: 2 },
  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  pauseBtn: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  dataCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 8 },
});
