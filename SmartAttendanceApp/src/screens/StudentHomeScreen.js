import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';

export default function StudentHomeScreen({ navigation }) {
  const [address, setAddress] = useState('Fetching location...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setAddress(`Lat: ${location.coords.latitude}, Long: ${location.coords.longitude}`);
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.welcomeText}>Welcome, Student</Text>
          <Text variant="bodySmall" style={styles.subText}>Computer Science Department</Text>
        </View>
        <Avatar.Text size={45} label="ST" style={{backgroundColor: '#4285F4'}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Location Card */}
        <Card style={styles.locationCard}>
          <Card.Title 
            title="Location Status" 
            left={(props) => <Avatar.Icon {...props} icon="map-marker" style={{backgroundColor: '#34A853'}} />} 
          />
          <Card.Content>
            {loading ? (
              <ActivityIndicator animating={true} color="#34A853" />
            ) : (
              <View>
                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: '#333'}}>
                  {address}
                </Text>
                <Text variant="bodySmall" style={{color: '#666'}}>
                  GPS Active & Ready
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Scanner Button */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        <Card style={styles.actionCard} onPress={() => navigation.navigate('Scanner')}>
          <Card.Cover source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=300x150&data=demo' }} style={{height: 150}} />
          <Card.Content style={styles.actionContent}>
            <Button 
              mode="contained" 
              icon="camera" 
              buttonColor="#4285F4"
              contentStyle={{height: 50}}
              labelStyle={{fontSize: 18}}
              onPress={() => navigation.navigate('Scanner')}
            >
              Mark Attendance
            </Button> 
          </Card.Content>
        </Card>

        {/* History Button */}
        <Text variant="titleMedium" style={styles.sectionTitle}>History</Text>
        <Card style={{marginBottom: 20, backgroundColor:'white'}} onPress={() => navigation.navigate('History')}>
          <Card.Content>
            <Text style={{fontWeight:'bold'}}>View Past Records</Text>
          </Card.Content>
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'white', elevation: 2 },
  welcomeText: { fontWeight: 'bold', color: '#333' },
  subText: { color: '#666' },
  scrollContent: { padding: 15 },
  locationCard: { marginBottom: 20, backgroundColor: 'white', borderLeftWidth: 5, borderLeftColor: '#34A853' },
  sectionTitle: { marginBottom: 10, fontWeight: 'bold', color: '#555' },
  actionCard: { marginBottom: 25, overflow: 'hidden', backgroundColor: 'white' },
  actionContent: { paddingVertical: 20 }
});