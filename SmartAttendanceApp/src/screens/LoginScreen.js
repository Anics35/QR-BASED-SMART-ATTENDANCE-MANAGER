import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

export default function LoginScreen({ navigation }) {
  const [deviceId, setDeviceId] = useState('Fetching...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDeviceId();
  }, []);

  // Requirement 3.1: Capture Unique Device ID
  const getDeviceId = async () => {
    let id = 'UNKNOWN_ID';
    if (Platform.OS === 'android') {
      id = Application.androidId; // Reliable ID on Android
    } else if (Platform.OS === 'ios') {
      id = await Application.getIosIdForVendorAsync(); // Reliable ID on iOS
    } else {
      id = 'WEB_SIMULATOR';
    }
    setDeviceId(id);
  };

  const handleLogin = () => {
    setLoading(true);
    
    // Simulate Google Auth Delay
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Device Binding Successful", 
        `Your Device ID: \n${deviceId}\n\nHas been registered to your account.`,
        [
          { text: "OK", onPress: () => navigation.replace('StudentHome') }
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>Attendance App</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>University of Smart Tech</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{marginBottom: 10, textAlign: 'center'}}>
            Student Login
          </Text>
          
          {/* Debugging Info: Showing Device ID on screen */}
          <View style={styles.debugBox}>
            <Text style={styles.debugLabel}>detected device id:</Text>
            <Text style={styles.debugText}>{deviceId}</Text>
          </View>

          <Button 
            mode="contained" 
            icon="google" 
            onPress={handleLogin}
            loading={loading}
            buttonColor="#4285F4"
            style={styles.button}
          >
            Sign in with Google
          </Button>
        </Card.Content>
      </Card>

      <Text style={styles.footer}>Secure QR Attendance System v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
  },
  card: {
    elevation: 4,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 15,
    borderRadius: 8,
  },
  debugBox: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  debugLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  debugText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#aaa',
    fontSize: 12,
  }
});