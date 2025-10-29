import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import authService from './src/services/authService';
import { colors } from './src/constants/colors';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Cargar usuario desde storage al iniciar
    const loadUser = async () => {
      try {
        const user = await authService.loadUserFromStorage();
        if (user) {
          setIsAuthenticated(true);
          setUserProfile(user.profile);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Escuchar cambios de autenticación
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setUserProfile(user ? user.profile : null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppNavigator 
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
      />
      <StatusBar style="dark" backgroundColor={colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
