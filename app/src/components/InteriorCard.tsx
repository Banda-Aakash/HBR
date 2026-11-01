import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {InteriorDesign} from '../types';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

interface InteriorCardProps {
  design: InteriorDesign;
  onPress: (design: InteriorDesign) => void;
  onLike?: (designId: string) => void;
}

export const InteriorCard: React.FC<InteriorCardProps> = ({
  design,
  onPress,
  onLike,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(design)}
      activeOpacity={0.9}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${design.title} by ${design.designer}`}>
      <Image source={{uri: design.images[0]}} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.styleBadge}>
          <Text style={styles.styleText}>{design.style}</Text>
        </View>
        {onLike && (
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => onLike(design.id)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              design.isLiked ? 'Remove like' : 'Like this design'
            }>
            <Icon
              name={design.isLiked ? 'favorite' : 'favorite-border'}
              size={20}
              color={design.isLiked ? Colors.heart : Colors.textInverse}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {design.title}
        </Text>
        <Text style={styles.designer}>by {design.designer}</Text>
        <View style={styles.footer}>
          <View style={styles.tagsRow}>
            {design.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.likesContainer}>
            <Icon name="favorite" size={14} color={Colors.heart} />
            <Text style={styles.likesText}>{design.likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.borderLight,
  },
  overlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  styleBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  styleText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
  },
  likeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.base,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 2,
  },
  designer: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.small,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
});
