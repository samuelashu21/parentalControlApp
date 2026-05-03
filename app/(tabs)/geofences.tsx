import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authFetch } from "@/services/api";

interface Geofence {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
}

export default function GeofencesScreen() {
  const { user, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [formName, setFormName] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("200");
  const [submitting, setSubmitting] = useState(false);

  const fetchGeofences = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authFetch("/geofences", {}, token);
      const data = await res.json();
      if (res.ok) setGeofences(data.geofences);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formLat || !formLng || !formRadius) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    const radius = parseFloat(formRadius);
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      Alert.alert(
        "Validation",
        "Latitude, longitude, and radius must be numbers.",
      );
      return;
    }
    if (radius < 50) {
      Alert.alert("Validation", "Radius must be at least 50 meters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        "/geofences",
        {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            latitude: lat,
            longitude: lng,
            radius,
          }),
        },
        token,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create geofence");
      setGeofences((prev) => [data.geofence, ...prev]);
      setModalVisible(false);
      setFormName("");
      setFormLat("");
      setFormLng("");
      setFormRadius("200");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (fence: Geofence) => {
    if (!token) return;
    try {
      const res = await authFetch(
        `/geofences/${fence._id}`,
        { method: "PUT", body: JSON.stringify({ isActive: !fence.isActive }) },
        token,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeofences((prev) =>
        prev.map((g) => (g._id === fence._id ? data.geofence : g)),
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = async (fence: Geofence) => {
    if (!token) return;
    Alert.alert("Delete Geofence", `Delete "${fence.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await authFetch(
              `/geofences/${fence._id}`,
              { method: "DELETE" },
              token,
            );
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error);
            }
            setGeofences((prev) => prev.filter((g) => g._id !== fence._id));
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
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
        <View style={styles.headerRow}>
          <ThemedText type="title">Geofences</ThemedText>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
            onPress={() => setModalVisible(true)}
          >
            <ThemedText style={styles.addBtnText}>+ Add</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={{ marginTop: 24 }}
          />
        ) : geofences.length === 0 ? (
          <ThemedText style={[styles.empty, { color: colors.icon }]}>
            No geofences yet. Tap "+ Add" to create one.
          </ThemedText>
        ) : (
          geofences.map((fence) => (
            <View
              key={fence._id}
              style={[styles.fenceCard, { borderColor: colors.icon }]}
            >
              <View style={styles.fenceHeader}>
                <ThemedText type="defaultSemiBold" style={styles.fenceName}>
                  {fence.name}
                </ThemedText>
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: fence.isActive ? "#2ecc71" : "#e74c3c" },
                  ]}
                >
                  <ThemedText style={styles.activeBadgeText}>
                    {fence.isActive ? "Active" : "Inactive"}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: colors.icon }}>
                📍 {fence.latitude.toFixed(5)}, {fence.longitude.toFixed(5)}
              </ThemedText>
              <ThemedText style={{ color: colors.icon }}>
                Radius: {fence.radius}m
              </ThemedText>
              <View style={styles.fenceActions}>
                <TouchableOpacity
                  style={[styles.fenceActionBtn, { borderColor: colors.tint }]}
                  onPress={() => handleToggleActive(fence)}
                >
                  <ThemedText style={{ color: colors.tint }}>
                    {fence.isActive ? "Deactivate" : "Activate"}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fenceActionBtn, { borderColor: "#e74c3c" }]}
                  onPress={() => handleDelete(fence)}
                >
                  <ThemedText style={{ color: "#e74c3c" }}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              New Geofence
            </ThemedText>

            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="e.g. Home, School"
              placeholderTextColor={colors.icon}
              value={formName}
              onChangeText={setFormName}
            />

            <ThemedText style={styles.label}>Latitude</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="e.g. 51.5074"
              placeholderTextColor={colors.icon}
              value={formLat}
              onChangeText={setFormLat}
              keyboardType="decimal-pad"
            />

            <ThemedText style={styles.label}>Longitude</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="e.g. -0.1278"
              placeholderTextColor={colors.icon}
              value={formLng}
              onChangeText={setFormLng}
              keyboardType="decimal-pad"
            />

            <ThemedText style={styles.label}>
              Radius (metres, min 50)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="200"
              placeholderTextColor={colors.icon}
              value={formRadius}
              onChangeText={setFormRadius}
              keyboardType="number-pad"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.icon }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={{ color: colors.icon }}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                    Create
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 48,
    marginBottom: 20,
  },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40 },
  fenceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  fenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fenceName: { flex: 1 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  fenceActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  fenceActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  label: { marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
});
