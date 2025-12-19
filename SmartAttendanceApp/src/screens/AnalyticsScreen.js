import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { Text, Surface, SegmentedButtons, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import api from '../services/api';

const { width } = Dimensions.get('window');

// --- HELPER: ANIMATED BAR ---
const AnimatedProgressBar = ({ percent, color, delay = 0 }) => {
  const widthVal = useSharedValue(0);

  useEffect(() => {
    widthVal.value = withDelay(delay, withTiming(percent, { duration: 1000 }));
  }, [percent]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
    backgroundColor: color,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressBar, animatedStyle]} />
    </View>
  );
};

export default function AnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);
  const [semester, setSemester] = useState('Autumn');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/report/student/semester?semester=${semester}`);
      console.log("Analytics Data:", JSON.stringify(data.report, null, 2)); // Debug Log
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

  // --- CALCULATIONS ---
  const calculateRecovery = (attended, total) => {
    if (total === 0) return 0;
    const target = 0.75;
    const current = attended / total;
    if (current >= target) return 0;
    const needed = Math.ceil((target * total - attended) / (1 - target));
    return needed > 0 ? needed : 0;
  };

  const totalClasses = report.reduce((sum, item) => sum + item.totalSessions, 0);
  const totalAttended = report.reduce((sum, item) => sum + item.attended, 0);
  const hasData = totalClasses > 0;
  const overallPercent = hasData ? ((totalAttended / totalClasses) * 100).toFixed(1) : "0.0";
  
  const getStatusColor = (p) => {
    if (!hasData) return '#64748b';
    return p >= 75 ? '#10b981' : p >= 60 ? '#f59e0b' : '#ef4444';
  };
  const overallColor = getStatusColor(parseFloat(overallPercent));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* 1. STATIC BACKGROUND */}
      <View style={styles.staticBackground} />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchReport(); }} 
            tintColor="white"
            colors={['#2563eb']} 
          />
        }
      >
        {/* HEADER CONTENT */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Academic Report</Text>
              <Text style={styles.headerSubtitle}>Performance Analytics</Text>
            </View>
            <View style={styles.headerIconCircle}>
              <MaterialCommunityIcons name="google-analytics" size={26} color="#2563eb" />
            </View>
          </View>

          {/* TOGGLE BUTTONS */}
          <View style={styles.toggleContainer}>
            <SegmentedButtons
              value={semester}
              onValueChange={setSemester}
              density="small"
              theme={{ colors: { secondaryContainer: 'rgba(255,255,255,0.25)', onSecondaryContainer: 'white', outline: 'rgba(255,255,255,0.3)' } }}
              buttons={[
                { 
                  value: 'Autumn', 
                  label: 'Autumn', 
                  style: semester === 'Autumn' ? styles.activeBtn : styles.inactiveBtn,
                  labelStyle: semester === 'Autumn' ? styles.activeLabel : styles.inactiveLabel
                },
                { 
                  value: 'Spring', 
                  label: 'Spring', 
                  style: semester === 'Spring' ? styles.activeBtn : styles.inactiveBtn,
                  labelStyle: semester === 'Spring' ? styles.activeLabel : styles.inactiveLabel
                },
              ]}
            />
          </View>
        </View>

        {/* SUMMARY CARD */}
        <Surface style={styles.summaryCard} elevation={4}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Overall Attendance</Text>
                <View style={styles.percentRow}>
                    <Text style={[styles.summaryBigText, { color: overallColor }]}>
                      {hasData ? `${overallPercent}%` : "N/A"}
                    </Text>
                    {hasData && (
                      <MaterialCommunityIcons 
                          name={parseFloat(overallPercent) >= 75 ? "trending-up" : "trending-down"} 
                          size={28} 
                          color={overallColor} 
                          style={{marginBottom: 8, marginLeft: 6}}
                      />
                    )}
                </View>
                <Text style={styles.summarySub}>
                  {hasData ? `${totalAttended} attended / ${totalClasses} sessions` : "No classes conducted yet"}
                </Text>
              </View>
              
              <View style={[styles.ringContainer, { borderColor: overallColor + '20' }]}>
                <View style={[styles.ringFill, { borderColor: overallColor }]} />
                <MaterialCommunityIcons 
                  name={!hasData ? "calendar-clock" : parseFloat(overallPercent) >= 75 ? "trophy-award" : "alert-rhombus"} 
                  size={32} 
                  color={overallColor} 
                />
              </View>
            </View>

            <View style={[styles.adviceBox, { 
              backgroundColor: !hasData ? '#f1f5f9' : parseFloat(overallPercent) >= 75 ? '#ecfdf5' : '#fef2f2', 
              borderColor: !hasData ? '#cbd5e1' : parseFloat(overallPercent) >= 75 ? '#a7f3d0' : '#fecaca' 
            }]}>
              <MaterialCommunityIcons 
                name={!hasData ? "information-outline" : parseFloat(overallPercent) >= 75 ? "check-circle" : "alert"} 
                size={22} 
                color={!hasData ? "#64748b" : parseFloat(overallPercent) >= 75 ? "#059669" : "#dc2626"} 
              />
              <Text style={[styles.adviceText, { color: !hasData ? "#475569" : parseFloat(overallPercent) >= 75 ? "#065f46" : "#991b1b" }]}>
                {!hasData 
                  ? "Classes for this semester haven't started yet."
                  : parseFloat(overallPercent) >= 75 
                    ? "Great job! Your attendance is healthy." 
                    : "Attention needed! Please prioritize classes."}
              </Text>
            </View>
        </Surface>

        {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}

        {/* COURSE LIST */}
        {hasData && (
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
          </View>
        )}
        
        {report.map((item, index) => {
          const percent = parseFloat(item.percentage);
          const color = getStatusColor(percent);
          const needed = calculateRecovery(item.attended, item.totalSessions);
          const itemHasData = item.totalSessions > 0;
          
          // FIX: Robust ID selection (The Fix for 500 Error)
          const targetCourseId = item.courseId || item._id || item.id;

          return (
            <Animated.View 
              key={index} 
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              <Surface style={styles.courseCard} elevation={1}>
                {/* TOUCHABLE WRAPPER */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => {
                    if (targetCourseId) {
                      navigation.navigate('CourseHistory', {
                        courseId: targetCourseId,
                        courseName: item.courseName,
                        courseCode: item.courseCode
                      });
                    } else {
                      alert("Course ID missing in report data");
                    }
                  }}
                >
                  {/* Header */}
                  <View style={styles.courseHeader}>
                    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                      <Text style={[styles.iconText, { color: color }]}>
                        {item.courseCode?.substring(0,2) || "Sub"}
                      </Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={styles.courseCode}>{item.courseCode}</Text>
                      <Text style={styles.courseName} numberOfLines={1}>{item.courseName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.percentText, { color: color }]}>{itemHasData ? `${percent}%` : "-"}</Text>
                      <Text style={styles.fractionText}>{item.attended}/{item.totalSessions}</Text>
                    </View>
                  </View>

                  {/* Bar */}
                  {itemHasData && (
                    <View style={{ marginTop: 16, marginBottom: 16 }}>
                      <AnimatedProgressBar percent={percent} color={color} delay={500 + index * 100} />
                    </View>
                  )}

                  {/* Prediction Logic */}
                  {itemHasData ? (
                    percent >= 75 ? (
                        <View style={styles.statusRowSuccess}>
                            <MaterialCommunityIcons name="check-decagram" size={20} color="#059669" />
                            <Text style={styles.statusTextSuccess}>You are safely on track!</Text>
                        </View>
                    ) : (
                        <View style={styles.statusRowAlert}>
                            <View style={styles.alertIcon}>
                              <MaterialCommunityIcons name="clock-alert" size={24} color="#dc2626" />
                            </View>
                            <Text style={styles.statusTextAlert}>
                                Attend <Text style={styles.highlightNumberBox}>{needed}</Text> more classes to hit 75%
                            </Text>
                        </View>
                    )
                  ) : (
                    <Text style={{color:'#94a3b8', fontSize:12, marginTop:8}}>No classes recorded yet.</Text>
                  )}
                </TouchableOpacity>
              </Surface>
            </Animated.View>
          );
        })}
        
        {!loading && !hasData && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="school-outline" size={64} color="#e2e8f0" />
            <Text style={{color:'#94a3b8', marginTop: 12, fontSize: 16, fontWeight:'500'}}>
               Enjoy your break! No classes yet.
            </Text>
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  
  staticBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 320, 
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  scrollView: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 50 : 60, 
    paddingBottom: 20 
  },
  
  headerContainer: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', letterSpacing: 0.5 },
  headerSubtitle: { color: '#bfdbfe', fontSize: 13, marginTop: 4, fontWeight: '500' },
  headerIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  
  toggleContainer: { marginTop: 0 },
  activeBtn: { backgroundColor: 'white', borderWidth: 0 },
  inactiveBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 },
  activeLabel: { color: '#2563eb', fontWeight: 'bold' },
  inactiveLabel: { color: '#dbeafe' },

  summaryCard: { backgroundColor: 'white', borderRadius: 24, padding: 22, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  summaryLabel: { color: '#64748b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  percentRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  summaryBigText: { fontSize: 44, fontWeight: 'bold', lineHeight: 50 },
  summarySub: { color: '#94a3b8', fontSize: 13, marginTop: 4, fontWeight: '500' },
  
  ringContainer: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
  ringFill: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 5, opacity: 0.2 },
  
  adviceBox: { flexDirection: 'row', padding: 14, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 1 },
  adviceText: { fontSize: 13, flex: 1, fontWeight: '600' },

  sectionHeader: { marginBottom: 16, paddingLeft: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#334155' },

  courseCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16 },
  courseHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontWeight: '800', fontSize: 15 },
  courseCode: { fontWeight: '700', color: '#1e293b', fontSize: 16 },
  courseName: { color: '#64748b', fontSize: 12, marginTop: 2, fontWeight: '500' },
  percentText: { fontSize: 18, fontWeight: '800' },
  fractionText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  progressTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 5 },

  statusRowSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12, gap: 10 },
  statusTextSuccess: { color: '#047857', fontWeight: '700', fontSize: 13 },
  
  statusRowAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#fee2e2' },
  alertIcon: { opacity: 0.8 },
  statusTextAlert: { color: '#991b1b', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 22 },
  
  highlightNumberBox: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 4,
  },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.7 }
});