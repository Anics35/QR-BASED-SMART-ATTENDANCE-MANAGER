import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Platform, 
  Pressable, 
  Dimensions, 
  Keyboard,
  TouchableOpacity // <--- ADDED THIS BACK
} from 'react-native';
import { Text, TextInput, Button, Menu, Divider, Provider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'CSE', // Default to CSE
    semester: 'Autumn',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  
  // Dropdown State
  const [visible, setVisible] = useState(false);
  const openMenu = () => {
    Keyboard.dismiss();
    setVisible(true);
  };
  const closeMenu = () => setVisible(false);

  // RESTRICTED TO CSE ONLY
  const departments = [
    { label: 'Computer Science (CSE)', value: 'CSE' },
  ];

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.rollNumber || !formData.department) {
      Alert.alert("Missing Information", "Please fill in all the details to proceed.");
      return;
    }

    setLoading(true);
    try {
      let deviceId;
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      if (!deviceId) throw new Error("Could not fetch Device ID");

      const payload = { ...formData, deviceId };
      const { data } = await api.post('/auth/register', payload);

      await SecureStore.setItemAsync('studentToken', data.token);
      await SecureStore.setItemAsync('studentName', data.user.name);

      Alert.alert("🎉 Welcome!", "Account created and device bound successfully.");
      navigation.replace('StudentHome');

    } catch (error) {
      console.error(error);
      Alert.alert("Registration Failed", error.response?.data?.message || "Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <View style={styles.mainContainer}>
        {/* Decorative Header Background */}
        <View style={styles.headerBackground}>
          <MaterialCommunityIcons name="school-outline" size={80} color="rgba(255,255,255,0.2)" style={styles.headerIcon} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.welcomeText}>Create Account</Text>
            <Text variant="bodyMedium" style={styles.subText}>Join the Smart Attendance System</Text>
          </View>

          <Surface style={styles.card} elevation={4}>
            
            <TextInput 
              label="Full Name" 
              value={formData.name} 
              onChangeText={t => setFormData({...formData, name: t})} 
              style={styles.input} 
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#2563eb"
              textColor="#000000"
              left={<TextInput.Icon icon="account-outline" color="#64748b" />}
            />
            
            <TextInput 
              label="University Email" 
              value={formData.email} 
              onChangeText={t => setFormData({...formData, email: t})} 
              style={styles.input} 
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#2563eb"
              textColor="#000000"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="e.g. student@tezu.ac.in"
              placeholderTextColor="#94a3b8"
              left={<TextInput.Icon icon="email-outline" color="#64748b" />}
            />
            
            <TextInput 
              label="Roll Number" 
              value={formData.rollNumber} 
              onChangeText={t => setFormData({...formData, rollNumber: t})} 
              style={styles.input} 
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#2563eb"
              textColor="#000000"
              placeholder="e.g. CSB21001"
              placeholderTextColor="#94a3b8"
              left={<TextInput.Icon icon="card-account-details-outline" color="#64748b" />}
            />

            {/* ROBUST DROPDOWN */}
            <View style={styles.dropdownContainer}>
              <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                  <View> 
                    <TextInput
                      label="Department"
                      value={formData.department}
                      style={styles.input}
                      mode="outlined"
                      outlineColor="#e2e8f0"
                      activeOutlineColor="#2563eb"
                      textColor="#000000"
                      editable={false} 
                      left={<TextInput.Icon icon="domain" color="#64748b" />}
                      right={<TextInput.Icon icon="chevron-down" color="#64748b" />}
                    />
                    {/* Transparent Overlay to Catch Taps reliably */}
                    <Pressable 
                      style={StyleSheet.absoluteFill} 
                      onPress={openMenu} 
                    />
                  </View>
                }
                contentStyle={styles.menuContent}
              >
                {departments.map((dept, index) => (
                  <React.Fragment key={dept.value}>
                    <Menu.Item 
                      onPress={() => {
                        setFormData({ ...formData, department: dept.value });
                        closeMenu();
                      }} 
                      title={dept.label}
                      titleStyle={styles.menuItemText}
                    />
                    {index < departments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Menu>
            </View>

            <Button 
              mode="contained" 
              onPress={handleRegister} 
              loading={loading} 
              style={styles.registerBtn}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Sign Up
            </Button>

          </Surface>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Log In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    opacity: 0.15,
    transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerTextContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  subText: {
    color: '#dbeafe',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    paddingTop: 32,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    fontSize: 15,
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  menuContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 5,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1e293b',
  },
  registerBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
});