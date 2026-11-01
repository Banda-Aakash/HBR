import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Typography, Fonts} from '../theme';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({message, onRetry}) => (
  <View style={s.body}>
    <Icon name="cloud-off" size={44} color={Colors.textLight} />
    <Text style={s.title}>Something went wrong</Text>
    <Text style={s.message}>{message}</Text>
    <TouchableOpacity style={s.retryBtn} onPress={onRetry} accessibilityRole="button">
      <Text style={s.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const s = StyleSheet.create({
  body: {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 48},
  title: {fontSize: 18, fontFamily: Fonts.bold, color: Colors.text, marginTop: 16, marginBottom: 8},
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  retryText: {color: Colors.textInverse, fontFamily: Fonts.bold},
});
