import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArchIcon, ArchIconName} from '../components/Arch';
import {useAuth} from '../context/AuthContext';
import {useRole} from '../context/RoleContext';
import {useTheme} from '../context/ThemeContext';
import {FEATURES} from '../config';
import {Colors, Fonts} from '../theme';
import {
  RootStackParamList,
  AuthStackParamList,
  OwnerTabParamList,
  TenantTabParamList,
} from '../types';

// Auth Screens
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';

// Shared Screens
import {ProfileScreen} from '../screens/ProfileScreen';
import {PropertyDetailScreen} from '../screens/PropertyDetailScreen';
import {BookingScreen} from '../screens/BookingScreen';
import {BookingConfirmationScreen} from '../screens/BookingConfirmationScreen';
import {BookingsTabScreen} from '../screens/BookingsTabScreen';
import {AddPropertyScreen} from '../screens/AddPropertyScreen';

// Owner Screens
import {HomeScreen} from '../screens/HomeScreen';
import {InteriorsScreen} from '../screens/InteriorsScreen';
import {InteriorDetailScreen} from '../screens/InteriorDetailScreen';
import {RentalListScreen} from '../screens/RentalListScreen';
import {TenancyDetailScreen} from '../screens/TenancyDetailScreen';
import {TransitionScreen} from '../screens/TransitionScreen';

// Tenant Screens
import {RentalBrowseScreen} from '../screens/RentalBrowseScreen';
import {RentalPropertyDetailScreen} from '../screens/RentalPropertyDetailScreen';
import {SavedScreen} from '../screens/SavedScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OwnerTab = createBottomTabNavigator<OwnerTabParamList>();
const TenantTab = createBottomTabNavigator<TenantTabParamList>();

const TAB_ICONS: Record<string, ArchIconName> = {
  Home: 'home',
  Bookings: 'visits',
  Rentals: 'home',
  Interiors: 'interiors',
  Profile: 'you',
  BrowseRentals: 'home',
  Saved: 'heart',
};

const useTabOptions = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return ({route}: {route: {name: string}}) => ({
    headerShown: false,
    tabBarIcon: ({focused}: {focused: boolean}) => (
      <ArchIcon
        name={TAB_ICONS[route.name]}
        size={23}
        strokeWidth={focused ? 2.2 : 2}
        color={focused ? theme.tabIcon : Colors.textSecondary}
      />
    ),
    tabBarActiveTintColor: theme.ink,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarLabelStyle: {fontFamily: Fonts.semibold, fontSize: 12},
    tabBarStyle: {
      backgroundColor: Colors.surface,
      borderTopColor: Colors.border,
      paddingTop: 6,
      height: 60 + insets.bottom,
    },
  });
};

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{headerShown: false}}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ── Owner/Investor Tab Navigator ──
// Home, Visits, Rentals (my properties), Interiors, You
const OwnerTabNavigator: React.FC = () => {
  const tabOptions = useTabOptions();
  return (
    <OwnerTab.Navigator screenOptions={tabOptions}>
      <OwnerTab.Screen name="Home" component={HomeScreen} />
      <OwnerTab.Screen name="Bookings" options={{tabBarLabel: 'Visits'}}>
        {() => <BookingsTabScreen />}
      </OwnerTab.Screen>
      {FEATURES.rentals ? (
        <OwnerTab.Screen
          name="Rentals"
          component={RentalListScreen}
          options={{tabBarLabel: 'My Rentals'}}
        />
      ) : null}
      <OwnerTab.Screen name="Interiors" component={InteriorsScreen} />
      <OwnerTab.Screen name="Profile" component={ProfileScreen} options={{tabBarLabel: 'You'}} />
    </OwnerTab.Navigator>
  );
};

// ── Tenant/Renter Tab Navigator ──
// Browse Rentals, Saved, You
const TenantTabNavigator: React.FC = () => {
  const tabOptions = useTabOptions();
  return (
    <TenantTab.Navigator screenOptions={tabOptions}>
      <TenantTab.Screen
        name="BrowseRentals"
        component={RentalBrowseScreen}
        options={{tabBarLabel: 'Rentals'}}
      />
      <TenantTab.Screen name="Saved">
        {() => <SavedScreen />}
      </TenantTab.Screen>
      <TenantTab.Screen name="Profile" component={ProfileScreen} options={{tabBarLabel: 'You'}} />
    </TenantTab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const {isOwner} = useRole();
  return isOwner ? <OwnerTabNavigator /> : <TenantTabNavigator />;
};

export const AppNavigator: React.FC = () => {
  const {isAuthenticated} = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={{animation: 'slide_from_right'}}
            />
            <RootStack.Screen
              name="BookingScreen"
              component={BookingScreen}
              options={{animation: 'slide_from_right'}}
            />
            <RootStack.Screen
              name="BookingConfirmation"
              component={BookingConfirmationScreen}
              options={{animation: 'fade'}}
            />
            <RootStack.Screen
              name="TenancyDetail"
              component={TenancyDetailScreen}
              options={{animation: 'slide_from_right'}}
            />
            <RootStack.Screen
              name="TenancyTransition"
              component={TransitionScreen}
              options={{animation: 'slide_from_bottom'}}
            />
            <RootStack.Screen
              name="RentalPropertyDetail"
              component={RentalPropertyDetailScreen}
              options={{animation: 'slide_from_right'}}
            />
            <RootStack.Screen name="MyBookings" options={{animation: 'slide_from_right'}}>
              {() => <BookingsTabScreen showBack />}
            </RootStack.Screen>
            <RootStack.Screen name="Saved" options={{animation: 'slide_from_right'}}>
              {() => <SavedScreen showBack />}
            </RootStack.Screen>
            <RootStack.Screen
              name="InteriorDetail"
              component={InteriorDetailScreen}
              options={{animation: 'slide_from_right'}}
            />
            <RootStack.Screen
              name="AddProperty"
              component={AddPropertyScreen}
              options={{animation: 'slide_from_bottom'}}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
