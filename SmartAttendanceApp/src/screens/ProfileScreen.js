import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, StatusBar, Image, Platform } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // 1. Fetch data from the new endpoint
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      // Fallback: If fetch fails, try to load basic name from storage
      const storedName = await SecureStore.getItemAsync('studentName');
      if (storedName) setUser({ name: storedName, role: 'student' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('studentToken');
          await SecureStore.deleteItemAsync('studentName');
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* 1. HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={100} 
            label={user?.name?.substring(0,2).toUpperCase() || "ST"} 
            style={{backgroundColor: 'white'}}
            color="#2563eb"
            labelStyle={{fontWeight: 'bold', fontSize: 32}}
          />
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || "STUDENT"}</Text>
          </View>
        </View>
        
        <Text style={styles.nameText}>{user?.name || "Student Name"}</Text>
        <Text style={styles.emailText}>{user?.email || "student@tezu.ac.in"}</Text>
      </View>

      {/* 2. DETAILS SECTION */}
      <ScrollView contentContainerStyle={styles.content}>
        
        <Surface style={styles.infoCard} elevation={2}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          
          <DetailItem icon="card-account-details-outline" label="Roll Number" value={user?.rollNumber || "N/A"} />
          <Divider style={styles.divider} />
          
          <DetailItem icon="domain" label="Department" value={user?.department || "CSE"} />
          <Divider style={styles.divider} />
          
         
        </Surface>

        <Surface style={styles.infoCard} elevation={2}>
          <Text style={styles.sectionTitle}>Device Security</Text>
          <View style={styles.deviceRow}>
            <View style={styles.deviceIcon}>
                <MaterialCommunityIcons name="cellphone-check" size={24} color="#166534" />
            </View>
            <View style={{flex:1}}>
                <Text style={styles.deviceStatus}>Device Bound</Text>
                <Text style={styles.deviceSub}>Your account is linked to this phone.</Text>
            </View>
          </View>
        </Surface>

        <Button 
          mode="contained" 
          onPress={handleLogout} 
          style={styles.logoutBtn}
          icon="logout"
          buttonColor="#fee2e2"
          textColor="#b91c1c"
        >
          Sign Out
        </Button>

        <Text style={styles.version}>v1.0.0 • Smart Attendance</Text>
      </ScrollView>
    </View>
  );
}

// --- HELPER COMPONENT ---
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.itemRow}>
    <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={22} color="#64748b" />
    </View>
    <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  roleBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb'
  },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#78350f' },
  nameText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  emailText: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },

  // Content
  content: { padding: 20 },
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconBox: { width: 40, alignItems: 'center' },
  label: { fontSize: 12, color: '#64748b' },
  value: { fontSize: 16, color: '#0f172a', fontWeight: '500' },
  divider: { backgroundColor: '#f1f5f9', marginVertical: 8 },

  // Device Section
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deviceIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  deviceStatus: { fontSize: 16, fontWeight: 'bold', color: '#166534' },
  deviceSub: { fontSize: 12, color: '#64748b' },

  logoutBtn: { borderRadius: 12, marginTop: 10 },
  version: { textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 12 }
});