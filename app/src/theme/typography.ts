import {TextStyle} from 'react-native';

// Named by weight because Android picks a font by file name and ignores fontWeight here
export const Fonts = {
  heavy: 'BricolageGrotesque-ExtraBold',
  display: 'BricolageGrotesque-Bold',
  displaySemi: 'BricolageGrotesque-SemiBold',
  regular: 'InstrumentSans-Regular',
  medium: 'InstrumentSans-Medium',
  semibold: 'InstrumentSans-SemiBold',
  bold: 'InstrumentSans-Bold',
};

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: Fonts.heavy,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  small: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    lineHeight: 14,
  },
};
