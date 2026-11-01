import {Colors} from './colors';
import {FESTIVE_ART} from './festiveArt';

export type FestivalId = keyof typeof FESTIVE_ART;

export interface AppTheme {
  festival: FestivalId | null;
  wish: string | null;
  // Bands, selected chips and price tags
  primary: string;
  // Prices and active tab labels on the light background
  ink: string;
  // Main buttons
  accent: string;
  onAccent: string;
  // Screen background
  soft: string;
  priceText: string;
  tabIcon: string;
  filterIcon: string;
}

/** The everyday look, used whenever no festival is on */
export const ARCH_THEME: AppTheme = {
  festival: null,
  wish: null,
  primary: Colors.primary,
  ink: Colors.primary,
  accent: Colors.primary,
  onAccent: Colors.textInverse,
  soft: Colors.background,
  priceText: Colors.gold,
  tabIcon: '#7A5F0E',
  filterIcon: Colors.gold,
};

const festival = (
  id: FestivalId,
  wish: string,
  primary: string,
  ink: string,
  accent: string,
  onAccent: string,
  soft: string,
): AppTheme => ({
  festival: id,
  wish,
  primary,
  ink,
  accent,
  onAccent,
  soft,
  priceText: Colors.textInverse,
  tabIcon: ink,
  filterIcon: Colors.textInverse,
});

export const FESTIVALS: Record<FestivalId, AppTheme> = {
  diwali: festival('diwali', 'Happy Diwali', '#2A0F3D', '#4A1A6B', '#FFC83D', '#2A0F3D', '#FFF6E5'),
  holi: festival('holi', 'Happy Holi', '#5B1A8C', '#5B1A8C', '#FF5FA2', '#2A0A33', '#FFF3F8'),
  navratri: festival('navratri', 'Happy Navratri', '#8E0E3A', '#8E0E3A', '#FFB300', '#3B0A1E', '#FFF4EC'),
  durga: festival('durga', 'Shubho Pujo', '#A1121F', '#A1121F', '#F6C945', '#3B0A0A', '#FFF5F2'),
  ganesh: festival('ganesh', 'Happy Ganesh Chaturthi', '#A63A06', '#A63A06', '#FFC83D', '#3D1502', '#FFF5E8'),
  onam: festival('onam', 'Happy Onam', '#14532D', '#14532D', '#F7C948', '#0F2E1B', '#FFFBEA'),
  pongal: festival('pongal', 'Happy Pongal', '#713F12', '#713F12', '#F59E0B', '#2B1605', '#FFF8E6'),
  eid: festival('eid', 'Eid Mubarak', '#064E3B', '#064E3B', '#E8C76B', '#042F24', '#F1FAF6'),
  christmas: festival('christmas', 'Merry Christmas', '#0F3D2E', '#0F3D2E', '#C1121F', '#FFFFFF', '#F5FAF7'),
  rakhi: festival('rakhi', 'Happy Rakhi', '#9D174D', '#9D174D', '#FBBF24', '#3B0620', '#FFF4F8'),
  ugadi: festival('ugadi', 'Happy New Year', '#166534', '#166534', '#FACC15', '#0F2E1B', '#F7FBEA'),
  baisakhi: festival('baisakhi', 'Happy Baisakhi', '#92400E', '#92400E', '#FBBF24', '#2B1605', '#FFFAEB'),
  bihu: festival('bihu', 'Happy Bihu', '#991B1B', '#991B1B', '#FDE68A', '#450A0A', '#FFF7F2'),
  janmashtami: festival('janmashtami', 'Happy Janmashtami', '#1E3A8A', '#1E3A8A', '#FBBF24', '#0F1B4D', '#F2F6FF'),
  bathukamma: festival('bathukamma', 'Happy Bathukamma', '#86198F', '#86198F', '#FDE047', '#3B0A3F', '#FDF4FF'),
  national: festival('national', 'Happy Independence Day', '#0F172A', '#0F172A', '#FF9933', '#0F172A', '#F8FAFC'),
};
