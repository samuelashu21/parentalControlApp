import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authFetch } from "@/services/api";

interface LinkedChild {
  _id: string;
  name: string;
  email: string;
  batteryLevel?: number;
  lastActive?: string;
  isTrackingPaused?: boolean;
  trackingConsent?: boolean;
}

export default function DevicesScreen() {
  const { user, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleLinkChild = async () => {
    if (!linkEmail.trim()) {
      Alert.alert("Validation", "Enter the child's email address.");
      return;
    }
    if (!token) return;
    setLinking(true);
    try {
      const res = await authFetch(
        "/auth/link-child",
        {
          method: "POST",
          body: JSON.stringify({ childEmail: linkEmail.trim().toLowerCase() }),
        },
        token,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link child");
      const child = data.child as LinkedChild;
      setChildren((prev) => {
        const exists = prev.find((c) => c._id === child._id);
        return exists
          ? prev.map((c) => (c._id === child._id ? child : c))
          : [child, ...prev];
      });
      setLinkEmail("");
      Alert.alert("Success", `${child.name} has been linked to your account.`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleToggleTracking = async (child: LinkedChild) => {
    if (!token) return;
    setToggling(child._id);
    try {
      const res = await authFetch(
        "/auth/toggle-tracking",
        { method: "PATCH", body: JSON.stringify({ childId: child._id }) },
        token,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle tracking");
      const updatedChild = data.child as LinkedChild;
      setChildren((prev) =>
        prev.map((c) => (c._id === updatedChild._id ? updatedChild : c)),
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setToggling(null);
    }
  };

  if (user?.role !== "parent") {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>This screen is for parents only.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title" style={styles.heading}>
          Linked Devices
        </ThemedText>

        {/* Link Child Section */}
        <View style={[styles.linkCard, { borderColor: colors.tint }]}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            🔗 Link a Child Account
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="Child's email address"
            placeholderTextColor={colors.icon}
            value={linkEmail}
            onChangeText={setLinkEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.linkBtn, { backgroundColor: colors.tint }]}
            onPress={handleLinkChild}
            disabled={linking}
          >
            {linking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.linkBtnText}>Link Child</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Linked Children ({children.length})
        </ThemedText>

        {children.length === 0 ? (
          <ThemedText style={[styles.empty, { color: colors.icon }]}>
            No children linked yet. Enter a child's email above to link them.
          </ThemedText>
        ) : (
          children.map((child) => (
            <View
              key={child._id}
              style={[styles.childCard, { borderColor: colors.icon }]}
            >
              <View style={styles.childHeader}>
                <ThemedText type="defaultSemiBold" style={styles.childName}>
                  {child.name}
                </ThemedText>
                <View
                  style={[
                    styles.trackingBadge,
                    {
                      backgroundColor: child.isTrackingPaused
                        ? "#e74c3c"
                        : "#2ecc71",
                    },
                  ]}
                >
                  <ThemedText style={styles.trackingBadgeText}>
                    {child.isTrackingPaused ? "Paused" : "Active"}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={{ color: colors.icon }}>
                {child.email}
              </ThemedText>

              {child.batteryLevel !== undefined && (
                <View style={styles.infoRow}>
                  <ThemedText>🔋 Battery: {child.batteryLevel}%</ThemedText>
                </View>
              )}

              {child.lastActive && (
                <View style={styles.infoRow}>
                  <ThemedText style={{ color: colors.icon }}>
                    Last active: {new Date(child.lastActive).toLocaleString()}
                  </ThemedText>
                </View>
              )}

              <View style={styles.infoRow}>
                <ThemedText>
                  Consent:{" "}
                  <ThemedText
                    style={{
                      color: child.trackingConsent ? "#2ecc71" : "#f39c12",
                    }}
                  >
                    {child.trackingConsent ? "Granted" : "Pending"}
                  </ThemedText>
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: child.isTrackingPaused
                      ? "#2ecc71"
                      : "#e74c3c",
                    opacity: toggling === child._id ? 0.6 : 1,
                  },
                ]}
                onPress={() => handleToggleTracking(child)}
                disabled={toggling === child._id}
              >
                {toggling === child._id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.toggleBtnText}>
                    {child.isTrackingPaused
                      ? "▶ Resume Tracking"
                      : "⏸ Pause Tracking"}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { marginTop: 48, marginBottom: 20 },
  linkCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  linkBtn: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  linkBtnText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { marginBottom: 16 },
  empty: { textAlign: "center", marginTop: 8 },
  childCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    gap: 6,
  },
  childHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childName: { flex: 1 },
  trackingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  trackingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  infoRow: { marginTop: 2 },
  toggleBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  toggleBtnText: { color: "#fff", fontWeight: "700" },
});
