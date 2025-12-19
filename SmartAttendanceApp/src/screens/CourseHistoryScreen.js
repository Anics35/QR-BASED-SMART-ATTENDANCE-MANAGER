import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, StatusBar, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function CourseHistoryScreen({ route, navigation }) {
  // Safety check for params
  const { courseId, courseName, courseCode } = route.params || {};
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchHistory();
    } else {
      Alert.alert("Error", "Course ID is missing.");
      setLoading(false);
    }
  }, [courseId]);

  const fetchHistory = async () => {
    try {
      console.log("Fetching history for:", courseId);
      const { data } = await api.get(`/attendance/history/course/${courseId}`);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Fetch Error:", error.response?.data || error.message);
      // Don't show alert loop, just log it. 500 errors will result in empty list.
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isPresent = item.status === 'present';
    const dateObj = new Date(item.date);
    
    return (
      <Surface style={[styles.card, isPresent ? styles.cardPresent : styles.cardAbsent]} elevation={1}>
        {/* Date Box */}
        <View style={styles.dateBox}>
          <Text style={styles.dayText}>{dateObj.getDate()}</Text>
          <Text style={styles.monthText}>{dateObj.toLocaleString('default', { month: 'short' })}</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.timeText}>
            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.duration} mins
          </Text>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <MaterialCommunityIcons 
              name={isPresent ? "check-circle" : "close-circle"} 
              size={16} 
              color={isPresent ? '#166534' : '#b91c1c'} 
              style={{marginRight:4}}
            />
            <Text style={[styles.statusText, { color: isPresent ? '#166534' : '#b91c1c' }]}>
              {isPresent ? "Present" : "Absent"}
            </Text>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <Appbar.Header style={{backgroundColor: '#2563eb'}}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content 
            title={courseCode || "Course History"} 
            subtitle={courseName || "Attendance Log"} 
            color="white" 
        />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No sessions recorded yet.</Text>
              <Text style={styles.emptySubText}>Or unable to fetch data.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    overflow: 'hidden'
  },
  cardPresent: { borderLeftColor: '#22c55e' },
  cardAbsent: { borderLeftColor: '#ef4444' },

  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    width: 65,
  },
  dayText: { fontSize: 20, fontWeight: 'bold', color: '#334155' },
  monthText: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight:'600' },

  infoBox: { flex: 1, paddingHorizontal: 16 },
  timeText: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  statusText: { fontSize: 15, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748b', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#94a3b8', fontSize: 14, marginTop: 4 }
});