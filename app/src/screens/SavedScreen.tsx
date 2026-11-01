import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Typography, Spacing} from '../theme';

export const SavedScreen: React.FC = () => (
  <View style={s.container}>
    <View style={s.header}>
      <Text style={s.title}>Saved</Text>
      <Text style={s.sub}>Properties you've bookmarked</Text>
    </View>
    <View style={s.body}>
      <View style={s.circle}>
        <Icon name="bookmark-border" size={44} color={Colors.textLight} />
      </View>
      <Text style={s.emptyTitle}>No saved properties</Text>
      <Text style={s.emptyBody}>
        Tap the bookmark icon on any rental listing to save it here for later.
      </Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {
    paddingHorizontal: 20,
    paddingTop: Spacing.xxxl + 10,
    paddingBottom: 12,
  },
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5},
  sub: {...Typography.body, color: Colors.textSecondary, marginTop: 2},
  body: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80},
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8},
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
