import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen'; // <--- NEW IMPORT
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import JoinCourseScreen from './src/screens/JoinCourseScreen'; // <--- Import

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator (Home | History)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 1. Login Screen */}
            <Stack.Screen name="Login" component={LoginScreen} />
            
            {/* 2. Main Tabs (Home + History) */}
            <Stack.Screen name="StudentHome" component={MainTabs} />
            
            {/* 3. Features (Scanner & Analytics) */}
            <Stack.Screen name="Scanner" component={ScannerScreen} />

            <Stack.Screen name="Register" component={RegisterScreen} />
            
            <Stack.Screen 
              name="Analytics" 
              component={AnalyticsScreen} 
              options={{ 
                headerShown: true, 
                title: 'My Performance',
                headerBackTitle: 'Back'
              }} 
            />

<Stack.Screen 
  name="JoinCourse" 
  component={JoinCourseScreen} 
  options={{ headerShown: false }} 
/>

          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}