import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, SvgXml} from 'react-native-svg';
import {useTheme} from '../context/ThemeContext';
import {Colors, FestivalId, Fonts} from '../theme';
import {FESTIVE_ART} from '../theme/festiveArt';

// Artwork is drawn for a 390pt wide phone and scales with the screen
const ART_WIDTH = 390;
const STRIP_HEIGHT = 96;
// How far down the artwork reaches, measured across all the festivals
const STRIP_CLEARANCE = 66;
const SCENE_RATIO = 140 / 220;

const ICONS = {
  home: 'M3 11l9-7 9 7 M6 10v10h4v-5a2 2 0 0 1 4 0v5h4V10',
  visits: 'M7 5h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z M4 10h16 M8 3v4 M16 3v4',
  interiors: 'M6 11V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3 M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z M6 18v2 M18 18v2',
  you: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M5 20a7 7 0 0 1 14 0',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  back: 'M19 12H5 M12 19l-7-7 7-7',
  search: 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z M20 20l-3.5-3.5',
  filter: 'M4 7h10 M18 7h2 M4 17h2 M10 17h10 M18 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M10 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  down: 'M6 9l6 6 6-6',
  right: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12 M18 6L6 18',
  call: 'M21 16.5v3a2 2 0 0 1-2.2 2A18 18 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a1 1 0 0 1 1 .8l.7 3.2a1 1 0 0 1-.3 1L7.5 9.3a14 14 0 0 0 7.2 7.2l1.3-1.4a1 1 0 0 1 1-.3l3.2.7a1 1 0 0 1 .8 1z',
  whatsapp: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z',
};

export type ArchIconName = keyof typeof ICONS;

export const ArchIcon: React.FC<{
  name: ArchIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}> = ({name, size = 20, color = Colors.text, strokeWidth = 2, filled = false}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
    <Path d={ICONS[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SYMBOL_RATIO = 416 / 946;
const FULL_LOGO_RATIO = 670 / 1133;

/** The house and bridge on their own, for places too small for the name */
export const Logo: React.FC<{width?: number; onDark?: boolean}> = ({width = 60, onDark = false}) => (
  <Image
    source={onDark ? require('../assets/logo-symbol-on-dark.png') : require('../assets/logo-symbol.png')}
    style={{width, height: width * SYMBOL_RATIO}}
    accessibilityIgnoresInvertColors
  />
);

/** The stacked logo with the name, for dark backgrounds */
export const FullLogo: React.FC<{width: number}> = ({width}) => (
  <Image
    source={require('../assets/logo-full-on-dark.png')}
    style={{width, height: width * FULL_LOGO_RATIO}}
    accessibilityRole="image"
    accessibilityLabel="HomeBridge Reality"
    accessibilityIgnoresInvertColors
  />
);

/** The app's signature shape: a photo with a round top and a nearly square foot */
export const ArchImage: React.FC<{
  uri?: string;
  width: number;
  height: number;
  footRadius?: number;
  label?: string;
}> = ({uri, width, height, footRadius = 14, label}) => (
  <View
    style={[
      s.archClip,
      {
        width,
        height,
        borderTopLeftRadius: width / 2,
        borderTopRightRadius: width / 2,
        borderBottomLeftRadius: footRadius,
        borderBottomRightRadius: footRadius,
      },
    ]}>
    {uri ? (
      <Image source={{uri}} style={s.fill} accessibilityLabel={label} accessibilityIgnoresInvertColors />
    ) : null}
  </View>
);

export const PriceTag: React.FC<{price: string; small?: boolean}> = ({price, small}) => {
  const theme = useTheme();
  return (
    <View style={[s.priceTag, small && s.priceTagSmall, {backgroundColor: theme.primary}]}>
      <Text style={[s.priceText, small && s.priceTextSmall, {color: theme.priceText}]}>{price}</Text>
    </View>
  );
};

/** Where a festive band's content starts: below the status bar and the main run of decorations */
export const useStripHeight = () => {
  const {width} = useWindowDimensions();
  const {top} = useSafeAreaInsets();
  return top + (width / ART_WIDTH) * STRIP_CLEARANCE;
};

/** Hanging decorations across the top of a festive band. Never placed over a property photo. */
export const FestiveStrip: React.FC<{festival: FestivalId}> = ({festival}) => {
  const {width} = useWindowDimensions();
  const {top} = useSafeAreaInsets();
  // iOS blurs whatever sits under the status bar, so the decorations hang from just below it
  return (
    <View style={[s.strip, {top: top - 6}]} pointerEvents="none">
      <SvgXml xml={FESTIVE_ART[festival].top} width={width} height={(width / ART_WIDTH) * STRIP_HEIGHT} />
    </View>
  );
};

export const FestiveScene: React.FC<{festival: FestivalId; width: number}> = ({festival, width}) => (
  <SvgXml xml={FESTIVE_ART[festival].scene} width={width} height={width * SCENE_RATIO} />
);

export const BackButton: React.FC<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity style={s.roundBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel="Go back">
    <ArchIcon name="back" strokeWidth={2.2} />
  </TouchableOpacity>
);

export const RoundButton: React.FC<{
  onPress: () => void;
  label: string;
  bordered?: boolean;
  children: React.ReactNode;
}> = ({onPress, label, bordered, children}) => (
  <TouchableOpacity
    style={[s.roundBtn, bordered && s.roundBtnBordered]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    {children}
  </TouchableOpacity>
);

/** Screen title: a plain heading most of the year, a decorated band during a festival */
export const ScreenHeader: React.FC<{title: string; subtitle?: string; onBack?: () => void}> = ({
  title,
  subtitle,
  onBack,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripHeight = useStripHeight();

  if (!theme.festival) {
    return (
      <View style={[s.plainHeader, {paddingTop: insets.top + 12}]}>
        {onBack ? (
          <View style={s.plainBack}>
            <BackButton onPress={onBack} />
          </View>
        ) : null}
        <Text style={s.plainTitle} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={s.plainSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[s.band, {backgroundColor: theme.primary, paddingTop: stripHeight + 8}]}>
      <FestiveStrip festival={theme.festival} />
      <View style={s.bandScene} pointerEvents="none">
        <FestiveScene festival={theme.festival} width={110} />
      </View>
      {onBack ? (
        <View style={s.plainBack}>
          <BackButton onPress={onBack} />
        </View>
      ) : null}
      <Text style={s.bandTitle} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={s.bandSubtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  fill: {width: '100%', height: '100%'},
  archClip: {overflow: 'hidden', backgroundColor: Colors.border},
  priceTag: {position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10},
  priceTagSmall: {left: 8, bottom: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9},
  priceText: {fontFamily: Fonts.display, fontSize: 18},
  priceTextSmall: {fontSize: 15},
  strip: {position: 'absolute', left: 0, right: 0},
  roundBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center'},
  roundBtnBordered: {borderWidth: 1, borderColor: Colors.border},
  plainHeader: {paddingHorizontal: 20, paddingBottom: 12},
  plainBack: {marginBottom: 12},
  plainTitle: {fontFamily: Fonts.heavy, fontSize: 34, letterSpacing: -0.7, color: Colors.text},
  plainSubtitle: {fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 4},
  band: {paddingHorizontal: 20, paddingBottom: 16, overflow: 'hidden'},
  bandScene: {position: 'absolute', right: 4, bottom: 4},
  bandTitle: {fontFamily: Fonts.heavy, fontSize: 34, letterSpacing: -0.7, color: Colors.textInverse, maxWidth: 240},
  bandSubtitle: {fontFamily: Fonts.medium, fontSize: 15, color: Colors.textInverse, marginTop: 2, maxWidth: 240},
});
