import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Divider, Appbar } from 'react-native-paper';

// Mock Data
const MOCK_HISTORY = [
  { id: '1', subject: 'Data Structures', date: '2025-10-20', time: '09:15 AM', status: 'Present', location: 'Room 301' },
  { id: '2', subject: 'Operating Systems', date: '2025-10-20', time: '11:00 AM', status: 'Present', location: 'Lab 2' },
  { id: '3', subject: 'Algorithms', date: '2025-10-19', time: '02:00 PM', status: 'Absent', location: '-' },
  { id: '4', subject: 'Indian Knowledge Sys', date: '2025-10-18', time: '10:00 AM', status: 'Present', location: 'Hall A' },
];

export default function HistoryScreen({ navigation }) {
  
  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardRow}>
        <View>
          <Text variant="titleMedium" style={{fontWeight:'bold'}}>{item.subject}</Text>
          <Text variant="bodySmall" style={{color:'#666'}}>{item.date} • {item.time}</Text>
          {/* FIXED: Changed 'caption' to 'bodySmall' */}
          <Text variant="bodySmall" style={{color:'#888'}}>Loc: {item.location}</Text>
        </View>
        <Chip 
          icon={item.status === 'Present' ? 'check-circle' : 'close-circle'} 
          style={{backgroundColor: item.status === 'Present' ? '#e6f4ea' : '#fce8e6'}}
          textStyle={{color: item.status === 'Present' ? '#137333' : '#c5221f'}}
        >
          {item.status}
        </Chip>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={{backgroundColor:'white'}}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Attendance History" />
      </Appbar.Header>

      <View style={styles.summaryContainer}>
        <View style={styles.statBox}>
          <Text variant="headlineMedium" style={{color:'#4285F4', fontWeight:'bold'}}>75%</Text>
          <Text variant="bodySmall">Total Attendance</Text>
        </View>
        <Divider style={{width: 1, height: '100%'}} />
        <View style={styles.statBox}>
          <Text variant="headlineMedium" style={{color:'#333', fontWeight:'bold'}}>3</Text>
          <Text variant="bodySmall">Total Absences</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_HISTORY}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-evenly', padding: 20, backgroundColor: 'white', marginBottom: 10, elevation: 2 },
  statBox: { alignItems: 'center' },
  listContent: { padding: 15 },
  card: { marginBottom: 10, backgroundColor: 'white' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});