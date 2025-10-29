import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../constants/colors';

const TipCard = ({
  title,
  content,
  date,
  category,
  onPress,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ejercicio':
        return colors.success;
      case 'alimentación':
        return colors.primary;
      case 'descanso':
        return colors.secondary;
      case 'bienestar':
        return colors.accent;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
              <Text style={styles.categoryText}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
          )}
        </View>
        {date && (
          <Text style={styles.date}>
            {formatDate(date)}
          </Text>
        )}
      </View>
      
      <Text style={styles.content} numberOfLines={isExpanded ? undefined : 3}>
        {content}
      </Text>
      
      {content && content.length > 100 && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.readMore}>
              {isExpanded ? 'Ver menos' : 'Leer más'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  content: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  footer: {
    alignItems: 'flex-end',
  },
  readMore: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default TipCard;
