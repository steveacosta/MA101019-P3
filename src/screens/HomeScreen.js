import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomButton from '../components/CustomButton';
import TipCard from '../components/TipCard';
import firebaseService from '../services/firebase';
import authService from '../services/authService';

const HomeScreen = ({ navigation }) => {
  const [dailyTip, setDailyTip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
    loadDailyTip();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = authService.getCurrentUserId();
      if (userId) {
        const result = await firebaseService.getUserProfile(userId);
        if (result.success) {
          setUserProfile(result.profile);
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const loadDailyTip = async () => {
    try {
      const userId = authService.getCurrentUserId();
      if (userId) {
        const result = await firebaseService.getDailyTip(userId);
        if (result.success) {
          setDailyTip(result.tip);
        }
      }
    } catch (error) {
      console.error('Error cargando consejo diario:', error);
    }
  };

  const handleGenerateNewTip = async () => {
    setLoading(true);
    
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      let profile = userProfile;
      if (!profile) {
        const profileResult = await firebaseService.getUserProfile(userId);
        if (!profileResult?.success || !profileResult?.profile) {
          throw new Error('Perfil no encontrado');
        }
        profile = profileResult.profile;
        setUserProfile(profile);
      }

      const result = await firebaseService.generateTip(userId, profile);
      if (result.success) {
        setDailyTip(result.tip);
        
        Alert.alert(
          '¡Nuevo consejo generado!',
          'Hemos creado un consejo personalizado para ti.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generando consejo:', error);
      Alert.alert(
        'Error',
        error.message || 'No pudimos generar un nuevo consejo. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadDailyTip()]);
    setRefreshing(false);
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{formatGreeting()}</Text>
            <Text style={styles.userName}>
              {userProfile?.name || 'Usuario'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleViewProfile}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Consejo del día */}
        <View style={styles.tipSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consejo del día</Text>
            <CustomButton
              title="Nuevo"
              variant="outline"
              size="small"
              onPress={handleGenerateNewTip}
              loading={loading}
            />
          </View>

          {dailyTip ? (
            <TipCard
              title={dailyTip.title}
              content={dailyTip.content}
              date={dailyTip.createdAt}
              category={dailyTip.category}
              style={styles.dailyTipCard}
            />
          ) : (
            <View style={styles.emptyTipCard}>
              <Text style={styles.emptyTipText}>
                No tienes consejos aún. ¡Genera tu primer consejo personalizado!
              </Text>
              <CustomButton
                title="Generar consejo"
                onPress={handleGenerateNewTip}
                loading={loading}
                style={styles.generateButton}
              />
            </View>
          )}
        </View>


        {/* Estadísticas rápidas */}
        {userProfile && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Tu perfil</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userProfile.age} años</Text>
                <Text style={styles.statLabel}>Edad</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userProfile.screenTime}h</Text>
                <Text style={styles.statLabel}>Pantalla</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userProfile.sleepHours}h</Text>
                <Text style={styles.statLabel}>Sueño</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userProfile.activityLevel}</Text>
                <Text style={styles.statLabel}>Actividad</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.body,
    color: colors.mediumGray,
  },
  userName: {
    ...typography.h2,
    marginTop: spacing.xs,
  },
  profileButton: {
    padding: spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3,
    color: colors.white,
  },
  tipSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  dailyTipCard: {
    marginBottom: 0,
  },
  emptyTipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTipText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    marginBottom: spacing.lg,
  },
  generateButton: {
    marginTop: 0,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mediumGray,
    textAlign: 'center',
  },
});

export default HomeScreen;
