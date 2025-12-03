import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Application from 'expo-application';
import api from '../services/api'; // Ensure you have this file created

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ask for permission on load
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Handle Loading Permissions
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Handle Denied Permissions
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: 'white' }}>
          We need your permission to show the camera
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return; // Prevent multiple scans
    setScanned(true);
    setLoading(true);

    try {
      // 1. Parse QR Data
      // The teacher sends a JSON string: { "sessionId": "...", "qrToken": "..." }
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        throw new Error("Invalid QR Code. Please scan the Teacher's Class QR.");
      }

      if (!qrData.sessionId || !qrData.qrToken) {
        throw new Error("Invalid QR Code content.");
      }

      // 2. Get Current Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Location permission is required to verify you are in class.");
      }
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 3. Get Device ID (FIXED for SDK 54)
      let deviceId;
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId(); // Correct Function call for Android
      } else {
        deviceId = await Application.getIosIdForVendorAsync(); // Async call for iOS
      }

      if (!deviceId) {
        throw new Error("Could not fetch Device ID. Restart app.");
      }

      console.log("Sending to backend:", {
        sessionId: qrData.sessionId,
        deviceId: deviceId,
        location: location.coords
      });

      // 4. Call Real Backend API
      const response = await api.post('/attendance/mark', {
        sessionId: qrData.sessionId,
        qrToken: qrData.qrToken,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        deviceId: deviceId,
        platform: Platform.OS
      });

      // 5. Success
      Alert.alert(
        "Attendance Marked! ✅",
        response.data.message || "You are present.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('StudentHome') 
          }
        ]
      );

    } catch (error) {
      console.error("Attendance Error:", error);
      
      // Handle Specific Backend Errors (e.g., "Device mismatch", "Too far")
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
      
      Alert.alert(
        "Attendance Failed ❌",
        errorMessage,
        [
          { 
            text: "Try Again", 
            onPress: () => {
              setScanned(false);
              setLoading(false);
            } 
          }
        ]
      );
    } finally {
      // If we didn't succeed, stop loading so they can try again. 
      // If success, we navigate away, so state doesn't matter much.
      if (!scanned) setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. CAMERA LAYER (Background) */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* 2. OVERLAY LAYER (Foreground) */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.scanText}>Scan the Class QR Code</Text>
        </View>
        
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.focused} />
          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          {loading && (
            <View style={{alignItems: 'center', marginBottom: 20}}>
              <ActivityIndicator animating={true} color="#34A853" size="large" />
              <Text style={{color: 'white', marginTop: 10}}>Verifying Location & Device...</Text>
            </View>
          )}
          
          <Button 
            mode="contained-tonal" 
            buttonColor="rgba(255,255,255,0.2)"
            textColor="white"
            onPress={() => navigation.navigate('StudentHome')}
          >
            Cancel
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250, 
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  focused: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#34A853', // Google Green
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    overflow: 'hidden'
  }
});