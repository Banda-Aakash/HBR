import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {RoleProvider} from './src/context/RoleContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {AppNavigator} from './src/navigation/AppNavigator';

// Screens are light all year, but sit under a dark band during a festival
const ThemedStatusBar: React.FC = () => {
  const {festival} = useTheme();
  return <StatusBar barStyle={festival ? 'light-content' : 'dark-content'} />;
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AuthProvider>
          <RoleProvider>
            <AppNavigator />
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
