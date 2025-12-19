import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import JoinCourseScreen from './src/screens/JoinCourseScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import CourseHistoryScreen from './src/screens/CourseHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// We removed HistoryScreen from the import if it's no longer used directly, 
// or you can keep it if you plan to link to it later.

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{ 
              headerShown: false, // We use our own custom blue headers
              animation: 'slide_from_right' // nice transition effect
            }}
          >
            {/* --- AUTHENTICATION --- */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* --- MAIN DASHBOARD --- */}
            {/* This replaces the old "MainTabs" */}
            <Stack.Screen name="StudentHome" component={StudentHomeScreen} />

            {/* --- FEATURES & SUB-SCREENS --- */}
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="JoinCourse" component={JoinCourseScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="CourseHistory" component={CourseHistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}