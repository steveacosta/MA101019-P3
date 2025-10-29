import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomButton from '../components/CustomButton';
import firebaseService from '../services/firebase';
import authService from '../services/authService';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email, type } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Iniciar countdown de 60 segundos
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return; // Solo permitir un dígito

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const result = await firebaseService.verifyOTP(email, otpCode, type);
      
      if (result.success) {
        if (type === 'registration') {
          // Para registro, solo verificar email y volver al login
          Alert.alert(
            '¡Verificación exitosa!',
            'Tu email ha sido verificado. Ahora puedes iniciar sesión.',
            [
              {
                text: 'Iniciar sesión',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
          } else {
            // Para login, autenticar al usuario
            const user = result.user;
            authService.setAuthenticatedUser(user);
            
            Alert.alert(
              '¡Bienvenido!',
              `Hola ${user.name}, has iniciado sesión exitosamente.`,
              [
                {
                  text: 'Continuar',
                  onPress: () => {
                    // La navegación se manejará automáticamente por el AppNavigator
                  }
                }
              ]
            );
          }
      }
    } catch (error) {
      console.error('Error verificando OTP:', error);
      Alert.alert(
        'Error',
        error.message || 'Código inválido. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);

    try {
      if (type === 'registration') {
        await firebaseService.sendOTPForRegistration(email);
      } else {
        await firebaseService.sendOTPForLogin(email);
      }
      
      // Reiniciar countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('Éxito', 'Código reenviado exitosamente');
    } catch (error) {
      console.error('Error reenviando OTP:', error);
      Alert.alert('Error', 'No pudimos reenviar el código. Inténtalo de nuevo.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatEmail = (email) => {
    const [username, domain] = email.split('@');
    return `${username.substring(0, 2)}***@${domain}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verifica tu email</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de 6 dígitos a{'\n'}
            <Text style={styles.email}>{formatEmail(email)}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <CustomButton
          title="Verificar código"
          onPress={handleVerifyOTP}
          loading={loading}
          disabled={otp.join('').length !== 6}
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={countdown > 0 || resendLoading}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendText,
              countdown > 0 && styles.resendTextDisabled
            ]}>
              {resendLoading 
                ? 'Enviando...' 
                : countdown > 0 
                  ? `Reenviar código (${countdown}s)` 
                  : 'Reenviar código'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
    lineHeight: 24,
  },
  email: {
    color: colors.text,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGray,
  },
  verifyButton: {
    marginBottom: spacing.xl,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: colors.mediumGray,
  },
});

export default VerifyOTPScreen;
