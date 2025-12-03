import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ProgressBar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import api from '../services/api';

export default function AnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);
  const [semester, setSemester] = useState('Autumn');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/report/student/semester?semester=${semester}`);
      setReport(data.report || []);
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [semester]);

  // Calculate Consolidated Stats
  const totalClasses = report.reduce((sum, item) => sum + item.totalSessions, 0);
  const totalAttended = report.reduce((sum, item) => sum + item.attended, 0);
  const overallPercent = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;

  const getStatusColor = (percent) => {
    if (percent >= 75) return '#4CAF50'; // Green
    if (percent >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{fontWeight:'bold', color:'#1a73e8'}}>
          Performance
        </Text>
        <Text variant="bodyMedium" style={{color:'gray'}}>Academic Report</Text>
      </View>

      {/* Semester Toggle */}
      <View style={{padding: 16}}>
        <SegmentedButtons
          value={semester}
          onValueChange={setSemester}
          buttons={[
            { value: 'Autumn', label: 'Autumn' },
            { value: 'Spring', label: 'Spring' },
          ]}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReport(); }} />
        }
      >
        {/* CONSOLIDATED SUMMARY CARD */}
        <Card style={[styles.card, {backgroundColor: '#e3f2fd'}]}>
          <Card.Content>
            <Text variant="titleMedium" style={{fontWeight:'bold'}}>Overall Attendance</Text>
            <View style={styles.row}>
              <Text variant="displaySmall" style={{color:'#1565c0', fontWeight:'bold'}}>
                {overallPercent}%
              </Text>
              <Text variant="bodyMedium">
                {totalAttended}/{totalClasses} Classes
              </Text>
            </View>
          </Card.Content>
        </Card>

        {loading ? <ActivityIndicator size="large" style={{marginTop:20}} /> : null}

        {/* SUBJECT WISE LIST */}
        {report.map((item, index) => {
          const percent = parseFloat(item.percentage);
          const color = getStatusColor(percent);
          
          return (
            <Card key={index} style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <View style={{flex:1}}>
                    <Text variant="titleMedium" style={{fontWeight:'bold'}}>
                      {item.courseCode || "CODE"}
                    </Text>
                    <Text variant="bodySmall" style={{color:'gray'}}>
                      {item.courseName || "Subject Name"}
                    </Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text variant="headlineSmall" style={{color: color, fontWeight:'bold'}}>
                      {percent}%
                    </Text>
                    <Text variant="labelSmall">
                      {item.attended}/{item.totalSessions}
                    </Text>
                  </View>
                </View>
                <ProgressBar 
                  progress={percent / 100} 
                  color={color} 
                  style={{marginTop: 15, height: 8, borderRadius: 4}} 
                />
              </Card.Content>
            </Card>
          );
        })}
        
        {!loading && report.length === 0 && (
           <Text style={{textAlign:'center', marginTop: 30, color:'#999'}}>No records for this semester.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  scrollContent: { padding: 16 },
  card: { marginBottom: 12, backgroundColor: 'white', borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});