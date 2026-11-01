import {Platform} from 'react-native';

// Android emulators reach the host machine through 10.0.2.2.
// On a physical device, replace this with your computer's LAN IP.
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Set this to the deployed backend before making a release build
const PRODUCTION_API_URL = 'https://api.example.com/api';

export const API_URL = __DEV__ ? `http://${DEV_HOST}:3001/api` : PRODUCTION_API_URL;

// The business's WhatsApp and phone number, with country code
export const SUPPORT_PHONE = '916281889589';

// Features that aren't ready for real users. Turning one on shows it in the app again.
export const FEATURES = {
  // Rental documents are placeholders with no real upload yet, see TransitionScreen
  rentals: false,
  socialLogin: false,
  passwordReset: false,
};
