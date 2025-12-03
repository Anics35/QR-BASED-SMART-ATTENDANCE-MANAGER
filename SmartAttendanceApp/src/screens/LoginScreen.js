import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application'; // Import Application
import api from '../services/api'; 

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your student email");
      return;
    }

    setLoading(true);
    try {
      // 1. Get Unique Device ID (Same logic as Scanner Screen)
      let deviceId;
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      if (!deviceId) {
        throw new Error("Could not fetch Device ID");
      }

      // 2. Send Email AND DeviceID to Backend
      const { data } = await api.post('/auth/dev-login', { 
        email, 
        deviceId // <--- Binding happens here
      });

      // 3. Save Token
      await SecureStore.setItemAsync('studentToken', data.token);
      await SecureStore.setItemAsync('studentName', data.user.name);

      navigation.replace('StudentHome'); 
    } catch (error) {
      console.log(error);
      // Show backend error (e.g., "Device Mismatch" if they try a different phone)
      Alert.alert("Login Failed", error.response?.data?.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep your return statement and styles exactly the same)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Login</Text>
      <Text style={styles.subtitle}>Enter your university email</Text>

      <TextInput
        style={styles.input}
        placeholder="student@tezu.ac.in"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

{/* NEW BUTTON */}
<TouchableOpacity 
  style={{marginTop: 20, padding: 10}} 
  onPress={() => navigation.navigate('Register')}
>
  <Text style={{textAlign:'center', color:'#1a73e8'}}>
    New Student? Register Here
  </Text>
</TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});