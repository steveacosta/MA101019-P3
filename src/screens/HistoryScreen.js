import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/colors';
import CustomButton from '../components/CustomButton';
import firebaseService from '../services/firebase';
import authService from '../services/authService';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTip, setSelectedTip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalTips: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadTips();
  }, []);

  useEffect(() => {
    loadStats();
  }, [tips]);

  const loadTips = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
        const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const result = await firebaseService.getTipsHistory(userId);
      
      if (result.success) {
        const tipsData = Array.isArray(result.tips) ? result.tips : [];
        setTips(tipsData);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      Alert.alert(
        'Error',
        'No pudimos cargar tu historial de consejos.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = () => {
    // Calcular estadísticas básicas
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = tips.filter(tip => {
      const tipDate = tip.createdAt?.toDate ? tip.createdAt.toDate() : new Date(tip.createdAt);
      return tipDate >= weekAgo;
    }).length;

    const thisMonth = tips.filter(tip => {
      const tipDate = tip.createdAt?.toDate ? tip.createdAt.toDate() : new Date(tip.createdAt);
      return tipDate >= monthAgo;
    }).length;

    setStats({
      totalTips: tips.length,
      thisWeek,
      thisMonth
    });
  };

  const handleRefresh = () => {
    loadTips(true);
  };

  const handleTipPress = (tip) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };


  // Sin filtros: mostrar todos los tips

  const formatDate = (date) => {
    if (!date) return '';
    
    const tipDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - tipDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    
    return tipDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ejercicio': return 'fitness';
      case 'alimentación': return 'restaurant';
      case 'sueño': return 'moon';
      case 'pantalla': return 'phone-portrait';
      case 'bienestar': return 'heart';
      default: return 'bulb';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ejercicio': return colors.success;
      case 'alimentación': return colors.warning;
      case 'sueño': return colors.info;
      case 'pantalla': return colors.error;
      case 'bienestar': return colors.primary;
      default: return colors.mediumGray;
    }
  };

  const renderTipItem = ({ item, index }) => {
    const category = item.category || 'bienestar';
    const categoryColor = getCategoryColor(category);
    
    return (
      <TouchableOpacity
        style={[styles.tipCard, { borderLeftColor: categoryColor }]}
        onPress={() => handleTipPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tipHeader}>
          <View style={styles.tipTitleContainer}>
            <Ionicons 
              name={getCategoryIcon(category)} 
              size={20} 
              color={categoryColor}
              style={styles.categoryIcon}
            />
            <Text style={styles.tipTitle} numberOfLines={2}>
              {item.title || 'Consejo Personalizado'}
            </Text>
          </View>
          <Text style={styles.tipDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <Text style={styles.tipContent} numberOfLines={3}>
          {item.content}
        </Text>
        
        {/* Acciones removidas: favorito y compartir */}
      </TouchableOpacity>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Tu progreso</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalTips}</Text>
          <Text style={styles.statLabel}>Total consejos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>Esta semana</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>Este mes</Text>
        </View>
      </View>
    </View>
  );

  // Eliminados botones de filtro

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={80} color={colors.mediumGray} />
      <Text style={styles.emptyTitle}>No tienes consejos aún</Text>
      <Text style={styles.emptySubtitle}>
        Genera tu primer consejo personalizado desde la pantalla principal
      </Text>
      <CustomButton
        title="Generar consejo"
        onPress={() => navigation.navigate('Home')}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderTipModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalle del consejo</Text>
        </View>
        
        {selectedTip && (
          <View style={styles.modalContent}>
            <View style={styles.modalTipHeader}>
              <Ionicons 
                name={getCategoryIcon(selectedTip.category || 'bienestar')} 
                size={24} 
                color={getCategoryColor(selectedTip.category || 'bienestar')}
              />
              <Text style={styles.modalTipTitle}>
                {selectedTip.title || 'Consejo Personalizado'}
              </Text>
            </View>
            
            <Text style={styles.modalTipDate}>
              {formatDate(selectedTip.createdAt)}
            </Text>
            
            <Text style={styles.modalTipContent}>
              {selectedTip.content}
            </Text>
            
            <View style={styles.modalActions}>
              
              
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Usar lista de tips tal cual

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de consejos</Text>
        <Text style={styles.subtitle}>
          Todos los consejos personalizados que hemos generado para ti
        </Text>
      </View>

      {renderStatsCard()}

      <FlatList
        data={tips}
        renderItem={renderTipItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        alwaysBounceVertical
      />

      {renderTipModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.mediumGray,
  },
  statsContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.mediumGray,
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.mediumGray,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  categoryIcon: {
    marginRight: spacing.sm,
  },
  tipTitle: {
    ...typography.h3,
    flex: 1,
    fontWeight: '600',
  },
  tipDate: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  tipContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  tipActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensar el botón de cerrar
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTipTitle: {
    ...typography.h2,
    flex: 1,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  modalTipDate: {
    ...typography.caption,
    color: colors.mediumGray,
    marginBottom: spacing.lg,
  },
  modalTipContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default HistoryScreen;