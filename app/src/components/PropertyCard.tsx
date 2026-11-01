import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Property} from '../types';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';
import {formatPrice} from '../utils/format';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.base * 2;

interface PropertyCardProps {
  property: Property;
  onPress: (property: Property) => void;
  onFavorite?: (propertyId: string) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onFavorite,
  variant = 'default',
}) => {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => onPress(property)}
        activeOpacity={0.85}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`View ${property.title}`}>
        <Image
          source={{uri: property.images[0]}}
          style={styles.compactImage}
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={14} color={Colors.textSecondary} />
            <Text style={styles.compactLocation} numberOfLines={1}>
              {property.city}, {property.state}
            </Text>
          </View>
          <Text style={styles.compactPrice}>
            {formatPrice(property.price, property.priceUnit)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, isFeatured && styles.featuredCard]}
      onPress={() => onPress(property)}
      activeOpacity={0.9}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${property.title}, ${formatPrice(property.price, property.priceUnit)}`}>
      <View style={styles.imageContainer}>
        <Image source={{uri: property.images[0]}} style={styles.image} />
        <View style={styles.imageOverlay}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            </Text>
          </View>
          {onFavorite && (
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={() => onFavorite(property.id)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                property.isFavorite
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }>
              <Icon
                name={property.isFavorite ? 'favorite' : 'favorite-border'}
                size={22}
                color={property.isFavorite ? Colors.heart : Colors.textInverse}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            {formatPrice(property.price, property.priceUnit)}
          </Text>
          {property.priceUnit === 'month' && (
            <Text style={styles.priceUnitText}>/mo</Text>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location-on" size={16} color={Colors.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {property.address}, {property.city}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="king-bed" size={18} color={Colors.textSecondary} />
            <Text style={styles.statText}>{property.bedrooms} Beds</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="bathtub" size={18} color={Colors.textSecondary} />
            <Text style={styles.statText}>{property.bathrooms} Baths</Text>
          </View>
          <View style={styles.stat}>
            <Icon
              name="square-foot"
              size={18}
              color={Colors.textSecondary}
            />
            <Text style={styles.statText}>
              {property.area} {property.areaUnit}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            {property.reviewCount > 0 && (
              <>
                <Icon name="star" size={16} color={Colors.star} />
                <Text style={styles.ratingText}>{property.rating}</Text>
                <Text style={styles.reviewText}>({property.reviewCount})</Text>
              </>
            )}
          </View>
          <View style={styles.agentInfo}>
            <Image
              source={{uri: property.agent.avatar}}
              style={styles.agentAvatar}
            />
            <Text style={styles.agentName}>{property.agent.name}</Text>
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
    marginBottom: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  featuredCard: {
    width: CARD_WIDTH * 0.85,
    marginRight: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.borderLight,
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    ...Typography.subtitle,
    color: Colors.textInverse,
  },
  priceUnitText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginLeft: 2,
  },
  info: {
    padding: Spacing.base,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  location: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  reviewText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  agentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  agentName: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // Compact variant styles
  compactCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.borderLight,
  },
  compactInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  compactTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 4,
  },
  compactLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  compactPrice: {
    ...Typography.subtitle,
    color: Colors.primary,
    marginTop: 4,
  },
});
