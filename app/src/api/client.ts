/**
 * API Client — single interface to the Express backend.
 *
 * Every screen calls these functions instead of importing mock data.
 * Auth token and userId are injected via setAuth() after login.
 * The API address is set in src/config.ts.
 */
import {API_URL} from '../config';

const REQUEST_TIMEOUT_MS = 15000;

let _userId: string | null = null;
let _token: string | null = null;
let _onSessionExpired: (() => void) | null = null;

export function setAuth(userId: string | null, token: string | null) {
  _userId = userId;
  _token = token;
}

export function getAuthUserId(): string | null {
  return _userId;
}

/** Called when the server rejects the stored token, so the app can log out */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  _onSessionExpired = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && _token) {
    _onSessionExpired?.();
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  roles: string[];
  createdAt: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    }),

  register: (name: string, email: string, password: string, phone?: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({name, email, password, phone}),
    }),

  me: () => request<{user: ApiUser}>('/auth/me'),

  deleteAccount: (password: string) =>
    request<void>('/auth/me', {
      method: 'DELETE',
      body: JSON.stringify({password}),
    }),
};

// ══════════════════════════════════════
// PROPERTIES
// ══════════════════════════════════════

export interface ApiProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: 'month' | 'total';
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: string;
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
  agent: {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    email: string;
    rating: number;
    propertiesCount: number;
  };
  coordinates: {latitude: number; longitude: number};
  yearBuilt: number;
  parkingSpaces: number;
}

export const propertiesApi = {
  list: (params?: {
    type?: string;
    city?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    sort?: string;
    page?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type && params.type !== 'all') {qs.set('type', params.type);}
    if (params?.city) {qs.set('city', params.city);}
    if (params?.search) {qs.set('search', params.search);}
    if (params?.featured) {qs.set('featured', 'true');}
    if (params?.minPrice) {qs.set('minPrice', String(params.minPrice));}
    if (params?.maxPrice) {qs.set('maxPrice', String(params.maxPrice));}
    if (params?.bedrooms) {qs.set('bedrooms', String(params.bedrooms));}
    if (params?.sort) {qs.set('sort', params.sort);}
    if (params?.page) {qs.set('page', String(params.page));}
    const q = qs.toString();
    return request<{count: number; total: number; hasMore: boolean; properties: ApiProperty[]}>(
      `/properties${q ? `?${q}` : ''}`,
    );
  },

  getById: (id: string) => request<ApiProperty>(`/properties/${id}`),

  /** Cities that have listings right now */
  cities: () => request<{cities: string[]}>('/properties/cities'),
};

// ══════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════

export interface ApiBooking {
  id: string;
  userId: string;
  propertyId: string;
  date: string;
  time: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  property?: {id: string; title: string; city: string; image: string};
}

export const bookingsApi = {
  list: (mode?: 'owner' | 'tenant') => {
    const q = mode ? `?mode=${mode}` : '';
    return request<{count: number; bookings: ApiBooking[]}>(`/bookings${q}`);
  },

  create: (propertyId: string, date: string, time: string, notes?: string, mode?: string) =>
    request<{booking: ApiBooking; property: any}>('/bookings', {
      method: 'POST',
      body: JSON.stringify({propertyId, date, time, notes, mode}),
    }),

  cancel: (id: string) =>
    request<ApiBooking>(`/bookings/${id}/cancel`, {method: 'PATCH'}),
};

// ══════════════════════════════════════
// FAVORITES
// ══════════════════════════════════════

export const favoritesApi = {
  list: () =>
    request<{count: number; favorites: string[]; properties: ApiProperty[]}>('/favorites'),

  toggle: (propertyId: string) =>
    request<{propertyId: string; isFavorite: boolean}>('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({propertyId}),
    }),
};

// ══════════════════════════════════════
// INTERIORS
// ══════════════════════════════════════

export interface ApiInterior {
  id: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  designer: string;
  style: string;
  tags: string[];
  likes: number;
  isLiked?: boolean;
}

export const interiorsApi = {
  list: (category?: string) => {
    const q = category && category !== 'all' ? `?category=${category}` : '';
    return request<{count: number; interiors: ApiInterior[]}>(`/interiors${q}`);
  },

  getById: (id: string) => request<ApiInterior>(`/interiors/${id}`),

  like: (id: string) =>
    request<ApiInterior>(`/interiors/${id}/like`, {method: 'POST'}),
};

// ══════════════════════════════════════
// RENTALS
// ══════════════════════════════════════

export interface ApiRental {
  id: string;
  state: string;
  rent: number;
  deposit: number;
  maintenanceSpendLimit?: number;
  startDate?: string;
  endDate?: string;
  escalationPct?: number;
  ownerApproval: boolean;
  depositReceived: boolean;
  depositSettled: boolean;
  duesCleared: boolean;
  createdAt: string;
  property: {
    id: string;
    type: string;
    unitNo: string;
    tower?: string;
    block?: string;
    floor: number;
    carpetArea: number;
    facing?: string;
    address: string;
    locality: string;
    city: string;
    image: string;
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
    residencyStatus: string;
    avatar?: string;
  };
  tenant?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    residencyStatus: string;
    avatar?: string;
  };
  documents: {
    id: string;
    type: string;
    fileName: string;
    isOnFile: boolean;
    createdAt: string;
  }[];
  inspections: {
    id: string;
    type: string;
    conductedBy: string;
    conductedAt: string;
    items: {id: string; room: string; item: string; condition: string}[];
  }[];
  ledger: {
    id: string;
    date: string;
    direction: 'in' | 'out';
    amount: number;
    category: string;
    description: string;
  }[];
}

export const rentalsApi = {
  /** My rentals (filtered by logged-in user on backend) */
  list: (state?: string) => {
    const q = state && state !== 'all' ? `?state=${state}` : '';
    return request<{count: number; rentals: ApiRental[]}>(`/rentals${q}`);
  },

  /** All rentals for tenant browsing (no user filter) */
  browseAll: (params?: {search?: string; page?: number}) => {
    const qs = new URLSearchParams();
    if (params?.search) {qs.set('search', params.search);}
    if (params?.page) {qs.set('page', String(params.page));}
    const q = qs.toString();
    return request<{count: number; total: number; available: number; hasMore: boolean; rentals: ApiRental[]}>(
      `/rentals/browse/all${q ? `?${q}` : ''}`,
    );
  },

  getById: (id: string) => request<ApiRental>(`/rentals/${id}`),

  /** Create a new rental property */
  create: (data: {
    address: string;
    unitNo: string;
    city: string;
    rent: number;
    tower?: string;
    floor?: number;
    carpetArea?: number;
    facing?: string;
    locality?: string;
    deposit?: number;
    maintenanceSpendLimit?: number;
    type?: string;
  }) =>
    request<ApiRental>('/rentals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  transition: (id: string) =>
    request<any>(`/rentals/${id}/transition`, {method: 'POST'}),

  addDocument: (id: string, type: string, fileName: string) =>
    request<any>(`/rentals/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify({type, fileName}),
    }),

  update: (id: string, fields: Record<string, any>) =>
    request<ApiRental>(`/rentals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),
};
