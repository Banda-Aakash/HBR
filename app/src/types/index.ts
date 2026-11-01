export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: 'month' | 'total';
  type: 'apartment' | 'house' | 'villa' | 'condo' | 'penthouse';
  status: 'available' | 'booked' | 'sold';
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: 'sqft' | 'sqm';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isFavorite: boolean;
  agent: Agent;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  yearBuilt: number;
  parkingSpaces: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  rating: number;
  propertiesCount: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface InteriorDesign {
  id: string;
  title: string;
  category: InteriorCategory;
  description: string;
  images: string[];
  designer: string;
  style: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
}

export type InteriorCategory =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'outdoor';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  savedProperties: string[];
  bookings: Booking[];
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PropertyDetail: {propertyId: string};
  BookingScreen: {propertyId: string};
  BookingConfirmation: {booking: Booking};
  InteriorDetail: {designId: string};
  TenancyDetail: {tenancyId: string};
  TenancyTransition: {tenancyId: string};
  RentalPropertyDetail: {tenancyId: string};
  MyBookings: undefined;
  Saved: undefined;
  AddProperty: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Owner/Investor sees: Home, Bookings, Rentals (while that feature is on), Interiors, Profile
export type OwnerTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Rentals: undefined;
  Interiors: undefined;
  Profile: undefined;
};

// Tenant sees: Browse Rentals, Saved, Profile
export type TenantTabParamList = {
  BrowseRentals: undefined;
  Saved: undefined;
  Profile: undefined;
};
