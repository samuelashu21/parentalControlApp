import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
  FlatList,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/services/api";

interface LocationRecord {
  _id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface Child {
  _id: string;
  name: string;
  email: string;
}

export default function LocationScreen() {
  const { user, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [latestLocation, setLatestLocation] = useState<LocationRecord | null>(null);
  const [history, setHistory] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Fetch linked children by getting users with this parent's id
  // The API doesn't have a direct "get my children" endpoint, so we use a workaround:
  // we store children in memory after they are linked via the Devices screen.
  // For now, allow manually entering a child ID or show a message.
  const fetchLatestLocation = async (child: Child) => {
    if (!token) return;
    setLoading(true);
    setLatestLocation(null);
    setHistory([]);
    try {
      const res = await authFetch(`/locations/${child._id}/latest`, {}, token);
      const data = await res.json();
      if (res.ok) {
        setLatestLocation(data.location);
      } else {
        Alert.alert("Info", data.error || "No location data");
      }
      const histRes = await authFetch(`/locations/${child._id}`, {}, token);
      const histData = await histRes.json();
      if (histRes.ok) setHistory(histData.locations);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    fetchLatestLocation(child);
  };

  const handleRefresh = () => {
    if (selectedChild) fetchLatestLocation(selectedChild);
  };

  const handleDeleteHistory = async () => {
    if (!token || !selectedChild) return;
    Alert.alert(
      "Delete History",
      `Delete all location history for ${selectedChild.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await authFetch(`/locations/${selectedChild._id}`, { method: "DELETE" }, token);
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setHistory([]);
              setLatestLocation(null);
              Alert.alert("Done", "Location history deleted.");
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
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
          Child Locations
        </ThemedText>

        {/* Child ID input section */}
        {!selectedChild && (
          <View style={[styles.infoCard, { borderColor: colors.tint }]}>
            <ThemedText type="defaultSemiBold">Select a child</ThemedText>
            <ThemedText style={{ color: colors.icon }}>
              After linking a child in the Devices tab, tap their card there to view their location, or enter their ID below.
            </ThemedText>
          </View>
        )}

        {selectedChild && (
          <>
            <View style={[styles.selectedCard, { backgroundColor: colors.tint + "22", borderColor: colors.tint }]}>
              <ThemedText type="defaultSemiBold">Viewing: {selectedChild.name}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedChild(null)}>
                <ThemedText style={{ color: colors.tint }}>Change</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                onPress={handleRefresh}
              >
                <ThemedText style={styles.actionBtnText}>🔄 Refresh</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#e74c3c" }]}
                onPress={handleDeleteHistory}
              >
                <ThemedText style={styles.actionBtnText}>🗑 Delete History</ThemedText>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 24 }} />
            ) : (
              <>
                {latestLocation && (
                  <View style={[styles.latestCard, { borderColor: colors.tint }]}>
                    <ThemedText type="defaultSemiBold">📍 Latest Location</ThemedText>
                    <ThemedText>Lat: {latestLocation.latitude.toFixed(6)}</ThemedText>
                    <ThemedText>Lng: {latestLocation.longitude.toFixed(6)}</ThemedText>
                    {latestLocation.accuracy !== undefined && (
                      <ThemedText style={{ color: colors.icon }}>
                        Accuracy: ±{latestLocation.accuracy}m
                      </ThemedText>
                    )}
                    <ThemedText style={{ color: colors.icon }}>
                      {new Date(latestLocation.timestamp).toLocaleString()}
                    </ThemedText>
                  </View>
                )}

                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Location History ({history.length})
                </ThemedText>
                {history.length === 0 ? (
                  <ThemedText style={{ color: colors.icon }}>No history available.</ThemedText>
                ) : (
                  history.map((loc) => (
                    <View key={loc._id} style={[styles.historyItem, { borderColor: colors.icon }]}>
                      <ThemedText type="defaultSemiBold">
                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      </ThemedText>
                      <ThemedText style={{ color: colors.icon }}>
                        {new Date(loc.timestamp).toLocaleString()}
                      </ThemedText>
                    </View>
                  ))
                )}
              </>
            )}
          </>
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
  infoCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8, marginBottom: 16 },
  selectedCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "700" },
  latestCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    marginBottom: 20,
  },
  sectionTitle: { marginBottom: 12 },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    gap: 2,
  },
});
