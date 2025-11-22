import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Application from 'expo-application';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ask for permission on load
  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
        <Button mode="contained" onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return; // STOP multiple scans
    setScanned(true);
    setLoading(true);

    [cite_start]// 1. Get Current Location [cite: 55]
    let location = await Location.getCurrentPositionAsync({});
    
    [cite_start]// 2. Get Device ID (with Fallback for Expo Go) [cite: 54]
    let deviceId = Platform.OS === 'android' ? Application.androidId : 'IOS_ID';
    if (!deviceId) deviceId = "TEST_DEVICE_ID_123"; // Fallback if hidden

    // Log to console (Simulating Backend Push)
    console.log("Sending to backend:", {
      sessionId: data, 
      studentId: "CSB22035",
      deviceId: deviceId,
      location: location.coords
    });

    // Simulate Network Delay
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Attendance Marked!",
        `Session: ${data}\nLocation Verified: ✅`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Check if we can go back, otherwise go to Home
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('StudentHome');
              }
            } 
          }
        ]
      );
    }, 1500);
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

      {/* 2. OVERLAY LAYER (Foreground) - Sits ON TOP, not inside */}
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
          {loading && <ActivityIndicator animating={true} color="white" size="large" />}
          <Button 
            mode="contained-tonal" 
            style={{marginTop: 20}} 
            onPress={() => {
               if (navigation.canGoBack()) navigation.goBack();
               else navigation.navigate('StudentHome');
            }}
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
    ...StyleSheet.absoluteFillObject, // This makes the overlay cover the screen
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
    borderColor: '#34A853', 
    backgroundColor: 'transparent',
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
  }
});