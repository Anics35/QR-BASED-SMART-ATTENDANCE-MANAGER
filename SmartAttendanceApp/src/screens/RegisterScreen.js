import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    semester: 'Autumn',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.rollNumber) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Device ID (Crucial for Binding)
      let deviceId;
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      if (!deviceId) throw new Error("Could not fetch Device ID");

      // 2. Send Registration Request
      const payload = { ...formData, deviceId };
      const { data } = await api.post('/auth/register', payload);

      // 3. Save Session
      await SecureStore.setItemAsync('studentToken', data.token);
      await SecureStore.setItemAsync('studentName', data.user.name);

      Alert.alert("Success", "Account Created! Device Bound successfully.");
      navigation.replace('StudentHome');

    } catch (error) {
      console.error(error);
      Alert.alert("Registration Failed", error.response?.data?.message || "Check network");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Student Registration</Text>
      
      <TextInput 
        label="Full Name" 
        value={formData.name} 
        onChangeText={t => setFormData({...formData, name: t})} 
        style={styles.input} 
      />
      <TextInput 
        label="Email (@tezu.ac.in)" 
        value={formData.email} 
        onChangeText={t => setFormData({...formData, email: t})} 
        style={styles.input} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        label="Roll Number (e.g. CSB21001)" 
        value={formData.rollNumber} 
        onChangeText={t => setFormData({...formData, rollNumber: t})} 
        style={styles.input} 
      />
      <TextInput 
        label="Department (e.g. CSE)" 
        value={formData.department} 
        onChangeText={t => setFormData({...formData, department: t})} 
        style={styles.input} 
      />
      
      <Button 
        mode="contained" 
        onPress={handleRegister} 
        loading={loading} 
        style={styles.btn}
        contentStyle={{height: 50}}
      >
        Create Account
      </Button>

      <Button mode="text" onPress={() => navigation.navigate('Login')} style={{marginTop: 20}}>
        Back to Login
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  title: { textAlign: 'center', marginBottom: 30, fontWeight: 'bold', color: '#1a73e8' },
  input: { marginBottom: 15, backgroundColor: 'white' },
  btn: { marginTop: 10, borderRadius: 8 }
});