import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Avatar, Text, Button, Card, List, Divider } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [studentName, setStudentName] = useState("Loading...");
  const [deviceId, setDeviceId] = useState("Unknown");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // 1. Get Name
    const name = await SecureStore.getItemAsync('studentName');
    if (name) setStudentName(name);

    // 2. Get Device ID (Visual confirmation for the user)
    let id;
    if (Platform.OS === 'android') {
      id = Application.getAndroidId();
    } else {
      id = await Application.getIosIdForVendorAsync();
    }
    setDeviceId(id || "Unknown");
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('studentToken');
          await SecureStore.deleteItemAsync('studentName');
          // Reset navigation stack to Login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={studentName.charAt(0)} style={{backgroundColor:'#1a73e8'}} />
        <Text variant="headlineSmall" style={styles.name}>{studentName}</Text>
        <Text variant="bodyMedium" style={{color:'gray'}}>Student Account</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <List.Section>
            <List.Subheader>Device Information</List.Subheader>
            <List.Item 
              title="Device Binding ID" 
              description={deviceId}
              left={() => <List.Icon icon="cellphone-link" />}
            />
            <Divider />
            <List.Item 
              title="App Version" 
              description="1.0.0 (Beta)"
              left={() => <List.Icon icon="information-outline" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        textColor="#d32f2f" 
        style={styles.logoutBtn}
        icon="logout"
        onPress={handleLogout}
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  name: { fontWeight: 'bold', marginTop: 10 },
  card: { backgroundColor: 'white', borderRadius: 12 },
  logoutBtn: { marginTop: 'auto', borderColor: '#d32f2f', marginBottom: 20 }
});