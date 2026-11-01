import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';
import {useRole} from '../context/RoleContext';
import {FEATURES} from '../config';
import {Colors, Typography} from '../theme';
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
import {BookingsListScreen} from '../screens/BookingsListScreen';
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

const tabBarStyle = {
  backgroundColor: Colors.surface,
  borderTopColor: Colors.borderLight,
  paddingTop: 8,
  paddingBottom: 28,
  height: 80,
};

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{headerShown: false}}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ── Owner/Investor Tab Navigator ──
// Home, Bookings, Rentals (my properties), Interiors, Profile
const OwnerTabNavigator: React.FC = () => (
  <OwnerTab.Navigator
    screenOptions={({route}) => ({
      headerShown: false,
      tabBarIcon: ({focused, color, size}) => {
        let iconName: string;
        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Bookings':
            iconName = 'event-note';
            break;
          case 'Rentals':
            iconName = 'home-work';
            break;
          case 'Saved':
            iconName = 'bookmark';
            break;
          case 'Interiors':
            iconName = 'palette';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'home';
        }
        return (
          <Icon
            name={iconName}
            size={focused ? size + 2 : size}
            color={color}
          />
        );
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textLight,
      tabBarLabelStyle: {
        ...Typography.small,
        marginTop: -2,
      },
      tabBarStyle,
    })}>
    <OwnerTab.Screen name="Home" component={HomeScreen} />
    <OwnerTab.Screen
      name="Bookings"
      component={BookingsTabScreen}
      options={{tabBarLabel: 'Bookings'}}
    />
    {FEATURES.rentals ? (
      <OwnerTab.Screen
        name="Rentals"
        component={RentalListScreen}
        options={{tabBarLabel: 'My Rentals'}}
      />
    ) : (
      <OwnerTab.Screen name="Saved" component={SavedScreen} />
    )}
    <OwnerTab.Screen name="Interiors" component={InteriorsScreen} />
    <OwnerTab.Screen name="Profile" component={ProfileScreen} />
  </OwnerTab.Navigator>
);

// ── Tenant/Renter Tab Navigator ──
// Browse Rentals, Bookings, Saved, Profile
const TenantTabNavigator: React.FC = () => (
  <TenantTab.Navigator
    screenOptions={({route}) => ({
      headerShown: false,
      tabBarIcon: ({focused, color, size}) => {
        let iconName: string;
        switch (route.name) {
          case 'BrowseRentals':
            iconName = 'apartment';
            break;
          case 'Saved':
            iconName = 'bookmark';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'apartment';
        }
        return (
          <Icon
            name={iconName}
            size={focused ? size + 2 : size}
            color={color}
          />
        );
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textLight,
      tabBarLabelStyle: {
        ...Typography.small,
        marginTop: -2,
      },
      tabBarStyle,
    })}>
    <TenantTab.Screen
      name="BrowseRentals"
      component={RentalBrowseScreen}
      options={{tabBarLabel: 'Rentals'}}
    />
    <TenantTab.Screen name="Saved" component={SavedScreen} />
    <TenantTab.Screen name="Profile" component={ProfileScreen} />
  </TenantTab.Navigator>
);

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
            <RootStack.Screen
              name="MyBookings"
              component={BookingsListScreen}
              options={{animation: 'slide_from_right'}}
            />
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
