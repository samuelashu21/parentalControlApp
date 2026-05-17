import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "parent" | "child">("parent");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, role);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>
            Create Account
          </ThemedText>

          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="Jane Doe"
            placeholderTextColor={colors.icon}
            value={name}
            onChangeText={setName}
          />

          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="you@example.com"
            placeholderTextColor={colors.icon}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.icon}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ThemedText style={styles.label}>Role</ThemedText>
          <View style={styles.roleRow}>
            {(["admin", "parent", "child"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleButton,
                  role === r && { backgroundColor: colors.tint },
                  { borderColor: colors.tint },
                ]}
                onPress={() => setRole(r)}
              >
                <ThemedText
                  style={[styles.roleText, role === r && { color: "#fff" }]}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Register</ThemedText>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" style={styles.link}>
            <ThemedText type="link">
              Already have an account? Sign In
            </ThemedText>
          </Link>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  heading: { textAlign: "center", marginBottom: 32 },
  label: { marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  roleText: { fontWeight: "600", fontSize: 15 },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignSelf: "center" },
});
