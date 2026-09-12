import 'react-native-get-random-values';
import { NavigationContainer } from '@react-navigation/native';
import { RootStack } from './src/navigation/RootStack';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
