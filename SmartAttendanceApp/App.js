import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- IMPORT SCREENS ---
// Make sure these file names match EXACTLY in your src/screens folder
import LoginScreen from './src/screens/LoginScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            
            {/* 1. Login Screen */}
            <Stack.Screen name="Login" component={LoginScreen} />
            
            {/* 2. Student Dashboard */}
            <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
            
            {/* 3. QR Scanner */}
            <Stack.Screen name="Scanner" component={ScannerScreen} />

            {/* 4. Attendance History (New) */}
            <Stack.Screen name="History" component={HistoryScreen} />
          
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}