import React, { useState } from 'react';
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

const ProfileSetupScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    age: '',
    screenTime: 8,
    activityLevel: 'Moderado',
    sleepHours: 8,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const activityLevels = ['Sedentario', 'Moderado', 'Activo'];

  const validateProfile = () => {
    const newErrors = {};
    
    if (!profile.age || profile.age < 13 || profile.age > 120) {
      newErrors.age = 'La edad debe estar entre 13 y 120 años';
    }

    return newErrors;
  };

  const handleSaveProfile = async () => {
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
            age: parseInt(profile.age),
            screenTime: profile.screenTime,
            activityLevel: profile.activityLevel,
            sleepHours: profile.sleepHours,
            completed: true
          };

          // Actualizar perfil en Firebase
          await firebaseService.updateUserProfile(userId, profileData);
          
          // Actualizar el usuario en el servicio de autenticación
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            currentUser.profile = profileData;
            authService.setAuthenticatedUser(currentUser);
          }
          
          Alert.alert(
            '¡Perfil creado!',
            'Tu perfil ha sido configurado exitosamente. Ahora puedes recibir consejos personalizados.',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  // La navegación se manejará automáticamente por el AppNavigator
                }
              },
            ]
          );
        } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert(
        'Error',
        error.message || 'No pudimos guardar tu perfil. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
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

  const renderSlider = (label, value, setValue, min, max, unit) => {
    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>
          {label}: {Math.round(value)}{unit}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={value}
          onValueChange={(newValue) => setProfile({ ...profile, [setValue]: newValue })}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbStyle={styles.sliderThumb}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{min}{unit}</Text>
          <Text style={styles.sliderLabel}>{max}{unit}</Text>
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
          <Text style={styles.title}>Configura tu perfil</Text>
          <Text style={styles.subtitle}>
            Ayúdanos a conocerte mejor para darte consejos personalizados
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Edad"
            placeholder="25"
            value={profile.age}
            onChangeText={(value) => setProfile({ ...profile, age: value })}
            keyboardType="numeric"
            error={errors.age}
          />

          {renderSlider(
            'Horas frente a pantalla',
            profile.screenTime,
            'screenTime',
            0,
            24,
            'h'
          )}

          {renderActivitySelector()}

          {renderSlider(
            'Horas de sueño',
            profile.sleepHours,
            'sleepHours',
            0,
            12,
            'h'
          )}

          <CustomButton
            title="Guardar perfil"
            onPress={handleSaveProfile}
            loading={loading}
            style={styles.saveButton}
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
  saveButton: {
    marginTop: spacing.xl,
  },
});

export default ProfileSetupScreen;