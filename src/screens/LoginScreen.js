import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import firebaseService from '../services/firebase';
import authService from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    // Validaciones
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!validatePassword(password)) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Primero verificar credenciales con Firebase Auth
      const loginResult = await firebaseService.loginUser(email, password);
      
      if (loginResult.success) {
        // Si las credenciales son correctas, enviar OTP
        const otpResult = await firebaseService.sendOTPForLogin(email);
        
        if (otpResult.success) {
          // Navegar a verificación OTP
          navigation.navigate('VerifyOTP', { 
            email: email, 
            type: 'login' 
          });
        }
      }

    } catch (error) {
      console.error('Error en login:', error);
      
      // Si el usuario no existe, sugerir registro
      if (error.message.includes('Usuario no encontrado') || error.message.includes('user-not-found')) {
        Alert.alert(
          'Usuario no encontrado',
          'Este email no está registrado. ¿Quieres registrarte?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registrarse', onPress: () => navigation.navigate('Register') }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Credenciales incorrectas o error al enviar el código.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
                <Text style={styles.subtitle}>
                  Ingresa tu email y contraseña para continuar
                </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <CustomInput
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
            />

            <CustomButton
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.linkText} onPress={handleRegisterPress}>
                Regístrate
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
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
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.mediumGray,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
