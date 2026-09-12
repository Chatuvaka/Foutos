import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { LockScreen } from '../screens/LockScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';
import { ChangePinScreen } from '../screens/ChangePinScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStack = () => {
  return (
    <Stack.Navigator initialRouteName="Lock" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Lock" component={LockScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="Vault" component={VaultScreen} />
      <Stack.Screen name="ChangePin" component={ChangePinScreen} />
    </Stack.Navigator>
  );
};
