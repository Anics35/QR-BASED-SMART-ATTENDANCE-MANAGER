import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import api from '../services/api';

export default function JoinCourseScreen({ navigation }) {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code) {
      Alert.alert("Error", "Please enter a course code");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/course/join', {
        courseCode: code
      });

      Alert.alert("Success 🎉", data.message, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      Alert.alert("Join Failed", error.response?.data?.message || "Could not find course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{fontSize: 60}}>🏫</Text>
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>Join a Class</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Ask your teacher for the Course Code (e.g., CSB401)
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Course Code"
              value={code}
              onChangeText={text => setCode(text.toUpperCase())}
              mode="outlined"
              placeholder="Ex: CSB401"
              autoCapitalize="characters"
              left={<TextInput.Icon icon="book-outline" />}
              style={styles.input}
            />
            
            <Button 
              mode="contained" 
              onPress={handleJoin} 
              loading={loading}
              style={styles.btn}
              contentStyle={{height: 50}}
            >
              Join Class
            </Button>
          </Card.Content>
        </Card>
        
        <Button mode="text" onPress={() => navigation.goBack()} style={{marginTop: 20}}>
          Cancel
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#1a73e8' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  card: { borderRadius: 12, backgroundColor: 'white' },
  input: { marginBottom: 20, backgroundColor: 'white' },
  btn: { borderRadius: 8, backgroundColor: '#1a73e8' }
});