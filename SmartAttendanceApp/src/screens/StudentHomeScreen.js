import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, StatusBar } from 'react-native';
import { Text, Card, Avatar, Button, Appbar, ActivityIndicator, IconButton, Surface, useTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function StudentHomeScreen({ navigation }) {
  const theme = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // 1. Get Name
      const name = await SecureStore.getItemAsync('studentName');
      if (name) setStudentName(name);

      // 2. Fetch Recent History
      const { data } = await api.get('/attendance/history');
      setHistory(data);
    } catch (error) {
      console.log("Fetch Error (Home):", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('studentToken');
          await SecureStore.deleteItemAsync('studentName');
          navigation.replace('Login');
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <Surface style={styles.historyCard} elevation={1}>
      <View style={styles.cardLeft}>
        <Avatar.Icon 
          size={40} 
          icon="check-bold" 
          style={{backgroundColor: '#e8f5e9'}} 
          color="#2e7d32" 
        />
        <View style={{marginLeft: 12}}>
          <Text variant="titleMedium" style={{fontWeight: 'bold', color: '#333'}}>
            {item.courseId?.courseCode || "CODE"}
          </Text>
          <Text variant="bodySmall" style={{color: '#666'}}>
            {item.courseId?.courseName || "Unknown Course"}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text variant="labelSmall" style={{color: '#999'}}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <Text variant="bodyMedium" style={{fontWeight: '600', color: '#1a73e8'}}>
          {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      
      {/* HEADER */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content 
          title="Smart Attendance" 
          subtitle={`Welcome, ${studentName}`} 
          titleStyle={{fontWeight: 'bold', color: 'white'}}
          subtitleStyle={{color: '#e3f2fd'}}
        />
        <Appbar.Action icon="logout" color="white" onPress={handleLogout} />
      </Appbar.Header>

      <View style={styles.content}>
        
        {/* QUICK ACTIONS CARD */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.actionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              
              {/* 1. JOIN */}
              <View style={styles.actionBtnContainer}>
                <IconButton
                  icon="plus-circle"
                  mode="contained"
                  containerColor="#f3e5f5"
                  iconColor="#9c27b0"
                  size={30}
                  onPress={() => navigation.navigate('JoinCourse')}
                />
                <Text variant="labelMedium">Join Class</Text>
              </View>

              {/* 2. SCAN (Center/Main) */}
              <View style={styles.actionBtnContainer}>
                <IconButton
                  icon="qrcode-scan"
                  mode="contained"
                  containerColor="#e3f2fd"
                  iconColor="#1a73e8"
                  size={32}
                  style={{width: 60, height: 60}} // Bigger button
                  onPress={() => navigation.navigate('Scanner')}
                />
                <Text variant="labelMedium" style={{fontWeight:'bold'}}>Scan QR</Text>
              </View>

              {/* 3. REPORTS */}
              <View style={styles.actionBtnContainer}>
                <IconButton
                  icon="chart-bar"
                  mode="contained"
                  containerColor="#e0f2f1"
                  iconColor="#009688"
                  size={30}
                  onPress={() => navigation.navigate('Analytics')}
                />
                <Text variant="labelMedium">Reports</Text>
              </View>

            </View>
          </Card.Content>
        </Card>

        {/* RECENT LIST */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Recent Activity</Text>

        {loading ? (
          <ActivityIndicator size="large" style={{marginTop: 50}} color="#1a73e8" />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => { setRefreshing(true); loadData(); }} 
                colors={['#1a73e8']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Avatar.Icon size={60} icon="history" style={{backgroundColor:'#f0f0f0'}} color="#ccc" />
                <Text style={{marginTop: 10, color:'#999'}}>No attendance records yet.</Text>
                <Button mode="text" onPress={() => navigation.navigate('Scanner')}>Scan your first class!</Button>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  appbar: { backgroundColor: '#1a73e8', elevation: 4 },
  content: { flex: 1, padding: 16 },
  
  // Quick Actions
  actionCard: { marginBottom: 20, backgroundColor: 'white', borderRadius: 12, elevation: 2 },
  actionTitle: { marginBottom: 15, fontWeight: 'bold', color: '#444' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  actionBtnContainer: { alignItems: 'center', gap: 5 },

  // List
  sectionTitle: { marginBottom: 12, fontWeight: 'bold', color: '#333', marginLeft: 4 },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardRight: { alignItems: 'flex-end' },
  
  emptyState: { alignItems: 'center', marginTop: 50 }
});