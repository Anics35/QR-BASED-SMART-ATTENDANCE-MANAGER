import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function StudentHomeScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // 1. Load Name
      const name = await SecureStore.getItemAsync('studentName');
      setStudentName(name || "Student");

      // 2. Load History
      const { data } = await api.get('/attendance/history');
      setHistory(data);
    } catch (error) {
      console.log("Fetch Error:", error.message);
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
    Alert.alert("Logout", "Are you sure you want to log out?", [
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

  // --- HELPER: ACTION BUTTON ---
  const renderActionCard = (title, icon, color, route) => (
    <Surface style={styles.actionCard} elevation={2}>
      <TouchableOpacity 
        style={styles.actionTouch} 
        onPress={() => navigation.navigate(route)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.actionText}>{title}</Text>
      </TouchableOpacity>
    </Surface>
  );

  // --- HELPER: HISTORY ITEM ---
  const renderHistoryItem = ({ item }) => (
    <Surface style={styles.historyItem} elevation={1}>
      <View style={styles.historyLeft}>
        <View style={styles.courseIcon}>
          <Text style={styles.courseInitials}>
            {item.courseId?.courseCode?.substring(0, 2) || "CO"}
          </Text>
        </View>
        <View style={styles.historyInfo}>
          <Text variant="titleMedium" style={styles.courseCode}>
            {item.courseId?.courseCode || "Unknown Code"}
          </Text>
          <Text variant="bodySmall" style={styles.courseName} numberOfLines={1}>
            {item.courseId?.courseName || "Course Name Unavailable"}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyRight}>
        <View style={styles.dateBadge}>
          <MaterialCommunityIcons name="calendar-blank" size={12} color="#64748b" />
          <Text style={styles.dateText}>
            {new Date(item.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            {loading ? (
               <ActivityIndicator size="small" color="white" style={{alignSelf:'flex-start', marginTop:5}} />
            ) : (
               <Text style={styles.studentName}>{studentName}</Text>
            )}
          </View>
          
          <View style={{flexDirection:'row', gap: 15}}>
             {/* Profile Button (Top Right) */}
             <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} color="#ffffff" />
             </TouchableOpacity>
             
             {/* Logout Button */}
             <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                <MaterialCommunityIcons name="logout" size={22} color="#ffffff" />
             </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        
        {/* QUICK ACTIONS (Removed History/Reports Icon) */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {renderActionCard("Scan QR", "qrcode-scan", "#2563eb", "Scanner")}
          {renderActionCard("Join Class", "plus-circle-outline", "#7c3aed", "JoinCourse")}
          {renderActionCard("My Report", "chart-bar", "#059669", "Analytics")} 
        </View>

        {/* RECENT ACTIVITY LIST */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Recent Activity</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => { setRefreshing(true); loadData(); }} 
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="history" size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Records Found</Text>
                <Text style={styles.emptySub}>Your attendance history will appear here.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Header
  headerContainer: {
    backgroundColor: '#2563eb',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: '#bfdbfe', fontSize: 14, fontWeight: '500' },
  studentName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },

  contentContainer: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionCard: { flex: 1, borderRadius: 16, backgroundColor: 'white', overflow: 'hidden' },
  actionTouch: { padding: 16, alignItems: 'center', justifyContent: 'center', height: 110 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  listContent: { paddingBottom: 20 },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  courseIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  courseInitials: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
  historyInfo: { flex: 1 },
  courseCode: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  courseName: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  historyRight: { alignItems: 'flex-end', justifyContent: 'center' },
  dateBadge: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, marginBottom: 4 
  },
  dateText: { fontSize: 11, color: '#64748b', marginLeft: 4, fontWeight: '600' },
  timeText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#cbd5e1', marginTop: 4 }
});