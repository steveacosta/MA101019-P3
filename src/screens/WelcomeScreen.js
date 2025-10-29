import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomButton from '../components/CustomButton';

const WelcomeScreen = ({ navigation }) => {
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icono */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>💡</Text>
          </View>
          <Text style={styles.appName}>TipFit</Text>
          <Text style={styles.tagline}>
            Consejos personalizados para tu bienestar
          </Text>
        </View>

        {/* Descripción */}
        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>
            Bienvenido a tu viaje hacia el bienestar
          </Text>
          <Text style={styles.descriptionText}>
            Recibe consejos personalizados basados en tus hábitos y estilo de vida. 
            Nuestra IA analiza tu perfil para darte recomendaciones que realmente funcionan.
          </Text>
        </View>

        {/* Características */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Consejos personalizados</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Fácil de usar</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Privacidad garantizada</Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <CustomButton
            title="Iniciar sesión"
            onPress={handleLoginPress}
            style={styles.loginButton}
          />
          
          <CustomButton
            title="Crear cuenta"
            variant="outline"
            onPress={handleRegisterPress}
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar, aceptas nuestros términos y condiciones
          </Text>
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
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.mediumGray,
    textAlign: 'center',
  },
  description: {
    marginBottom: spacing.xxl,
  },
  descriptionTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text,
  },
  descriptionText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxl,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  loginButton: {
    marginBottom: spacing.md,
  },
  registerButton: {
    marginBottom: spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.mediumGray,
    paddingHorizontal: spacing.md,
  },
});

export default WelcomeScreen;
