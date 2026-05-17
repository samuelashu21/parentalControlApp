import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authFetch } from "../../services/api";

function ParentDashboard() {
  const { user, token, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Welcome, {user?.name} 👋</ThemedText>
          <TouchableOpacity
            onPress={logout}
            style={[styles.logoutBtn, { borderColor: colors.icon }]}
          >
            <ThemedText style={{ color: colors.icon }}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.roleChip, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.roleChipText}>Parent Account</ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Overview
        </ThemedText>

        <View style={styles.cardRow}>
          <View style={[styles.card, { borderColor: colors.tint }]}>
            <ThemedText style={styles.cardIcon}>📍</ThemedText>
            <ThemedText type="defaultSemiBold">Location</ThemedText>
            <ThemedText style={{ color: colors.icon }}>
              Track children
            </ThemedText>
          </View>
          <View style={[styles.card, { borderColor: colors.tint }]}>
            <ThemedText style={styles.cardIcon}>🗺️</ThemedText>
            <ThemedText type="defaultSemiBold">Geofences</ThemedText>
            <ThemedText style={{ color: colors.icon }}>Safe zones</ThemedText>
          </View>
        </View>
        <View style={styles.cardRow}>
          <View style={[styles.card, { borderColor: colors.tint }]}>
            <ThemedText style={styles.cardIcon}>📱</ThemedText>
            <ThemedText type="defaultSemiBold">Devices</ThemedText>
            <ThemedText style={{ color: colors.icon }}>
              Manage devices
            </ThemedText>
          </View>
          <View style={[styles.card, { borderColor: colors.tint }]}>
            <ThemedText style={styles.cardIcon}>🔗</ThemedText>
            <ThemedText type="defaultSemiBold">Link Child</ThemedText>
            <ThemedText style={{ color: colors.icon }}>
              Use Devices tab
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.hint, { color: colors.icon }]}>
          Use the tabs below to manage your child's location, geofences, and
          devices.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

function ChildDashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleGrantConsent = async () => {
    if (!token) return;
    try {
      const res = await authFetch(
        "/auth/grant-consent",
        { method: "PATCH" },
        token,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant consent");
      await refreshUser();
      Alert.alert("Success", "Tracking consent granted.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Hi, {user?.name} 👋</ThemedText>
          <TouchableOpacity
            onPress={logout}
            style={[styles.logoutBtn, { borderColor: colors.icon }]}
          >
            <ThemedText style={{ color: colors.icon }}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.roleChip, { backgroundColor: "#e74c3c" }]}>
          <ThemedText style={styles.roleChipText}>Child Account</ThemedText>
        </View>

        <View style={[styles.statusCard, { borderColor: colors.tint }]}>
          <ThemedText type="defaultSemiBold">Tracking Status</ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: user?.isTrackingPaused
                    ? "#e74c3c"
                    : "#2ecc71",
                },
              ]}
            />
            <ThemedText>
              {user?.isTrackingPaused ? "Tracking Paused" : "Tracking Active"}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.statusCard, { borderColor: colors.tint }]}>
          <ThemedText type="defaultSemiBold">Consent Status</ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: user?.trackingConsent
                    ? "#2ecc71"
                    : "#f39c12",
                },
              ]}
            />
            <ThemedText>
              {user?.trackingConsent ? "Consent Given" : "Consent Pending"}
            </ThemedText>
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

        <ThemedText style={[styles.hint, { color: colors.icon }]}>
          Use the SOS tab for emergencies, and the Privacy tab to manage your
          tracking preferences.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "parent" ? <ParentDashboard /> : <ChildDashboard />;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 48,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  roleChipText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionTitle: { marginBottom: 16 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardIcon: { fontSize: 28, marginBottom: 4 },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  hint: { textAlign: "center", marginTop: 16, fontSize: 14 },
});
