import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import firebaseService from '../services/firebase';
import authService from '../services/authService';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    screenTime: 8,
    activityLevel: 'Moderado',
    sleepHours: 8,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const activityLevels = ['Sedentario', 'Moderado', 'Activo'];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = authService.getCurrentUserId();
      
      if (!userId) {
        Alert.alert('Error', 'Usuario no autenticado');
        navigation.navigate('Welcome');
        return;
      }

      // Obtener datos del usuario desde Firestore
      const userDoc = await firebaseService.getUserProfile(userId);
      
      if (userDoc.success) {
        const userData = userDoc.profile;
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age?.toString() || '',
          screenTime: userData.screenTime || 8,
          activityLevel: userData.activityLevel || 'Moderado',
          sleepHours: userData.sleepHours || 8,
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No pudimos cargar tu perfil');
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    if (!profile.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!profile.age || profile.age < 13 || profile.age > 120) {
      newErrors.age = 'La edad debe estar entre 13 y 120 años';
    }

    if (profile.screenTime < 0 || profile.screenTime > 24) {
      newErrors.screenTime = 'Las horas de pantalla deben estar entre 0 y 24';
    }

    if (profile.sleepHours < 0 || profile.sleepHours > 24) {
      newErrors.sleepHours = 'Las horas de sueño deben estar entre 0 y 24';
    }

    return newErrors;
  };

  const handleUpdateProfile = async () => {
    const validationErrors = validateProfile();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

        try {
          const userId = authService.getCurrentUserId();
          
          if (!userId) {
            throw new Error('Usuario no autenticado');
          }

          const profileData = {
            name: profile.name.trim(),
            age: parseInt(profile.age),
            screenTime: profile.screenTime,
            activityLevel: profile.activityLevel,
            sleepHours: profile.sleepHours,
            completed: true
          };

          await firebaseService.updateUserProfile(userId, profileData);
          
          // Actualizar el usuario en el servicio de autenticación
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            currentUser.profile = profileData;
            authService.setAuthenticatedUser(currentUser);
          }
          
          Alert.alert(
            'Perfil actualizado',
            'Tu perfil ha sido actualizado exitosamente.',
            [{ text: 'OK' }]
          );
        } catch (error) {
      console.error('Error actualizando perfil:', error);
      Alert.alert(
        'Error',
        'No pudimos actualizar tu perfil. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
              onPress: async () => {
                try {
                  await authService.logout();
                  // La navegación se manejará automáticamente por el AppNavigator
                } catch (error) {
                  console.error('Error cerrando sesión:', error);
                  // Aún así cerrar sesión
                  await authService.logout();
                }
              },
        },
      ]
    );
  };

  const renderActivitySelector = () => {
    return (
      <View style={styles.activityContainer}>
        <Text style={styles.label}>Nivel de actividad</Text>
        <View style={styles.activityButtons}>
          {activityLevels.map((level) => (
            <CustomButton
              key={level}
              title={level}
              variant={profile.activityLevel === level ? 'primary' : 'outline'}
              size="small"
              onPress={() => setProfile({ ...profile, activityLevel: level })}
              style={styles.activityButton}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.subtitle}>
            Actualiza tu información para recibir consejos más personalizados
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Nombre completo"
            placeholder="Tu nombre completo"
            value={profile.name}
            onChangeText={(value) => setProfile({ ...profile, name: value })}
            autoCapitalize="words"
            error={errors.name}
          />

          <CustomInput
            label="Email"
            placeholder="tu@email.com"
            value={profile.email}
            editable={false}
            style={styles.disabledInput}
          />

          <CustomInput
            label="Edad"
            placeholder="25"
            value={profile.age}
            onChangeText={(value) => setProfile({ ...profile, age: value })}
            keyboardType="numeric"
            error={errors.age}
          />

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>
              Horas frente a pantalla: {Math.round(profile.screenTime)}h
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={24}
              value={profile.screenTime}
              onValueChange={(value) => setProfile({ ...profile, screenTime: value })}
              step={1}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0h</Text>
              <Text style={styles.sliderLabel}>24h</Text>
            </View>
          </View>

          {renderActivitySelector()}

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>
              Horas de sueño: {Math.round(profile.sleepHours)}h
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
              value={profile.sleepHours}
              onValueChange={(value) => setProfile({ ...profile, sleepHours: value })}
              step={1}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0h</Text>
              <Text style={styles.sliderLabel}>12h</Text>
            </View>
          </View>

          <CustomButton
            title="Actualizar perfil"
            onPress={handleUpdateProfile}
            loading={loading}
            style={styles.updateButton}
          />

          <CustomButton
            title="Cerrar sesión"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    paddingHorizontal: spacing.md,
  },
  form: {
    flex: 1,
  },
  label: {
    ...typography.body,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: '600',
  },
  disabledInput: {
    opacity: 0.6,
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing.sm,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  activityContainer: {
    marginBottom: spacing.lg,
  },
  activityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  activityButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  updateButton: {
    marginTop: spacing.xl,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});

export default ProfileScreen;
