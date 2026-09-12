import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AuthService } from '../services/auth.service';
import { SecurityService } from '../services/security.service';
import * as ScreenCapture from 'expo-screen-capture';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../components/Numpad';

type LockScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Lock'>;
interface Props { navigation: LockScreenNavigationProp; }

export const LockScreen: React.FC<Props> = ({ navigation }) => {
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    ScreenCapture.allowScreenCaptureAsync();
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    const hasSetup = await SecurityService.hasPinSetup();
    if (!hasSetup) navigation.replace('PinSetup');
    else handleBiometricUnlock();
  };

  const handleBiometricUnlock = async () => {
    const result = await AuthService.authenticateAsync();
    if (result.success) {
      await SecurityService.getMasterKey();
      navigation.replace('Vault');
    } else setShowPinFallback(true);
  };

  const handlePinUnlock = async (currentPin: string) => {
    if (await SecurityService.validatePin(currentPin)) {
      await SecurityService.getMasterKey();
      navigation.replace('Vault');
    } else {
      Alert.alert('Error', 'PIN incorrecto');
      setPin('');
    }
  };

  const onNumpadPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      // Auto submit on 6 digits
      if (newPin.length === 6) {
        handlePinUnlock(newPin);
      }
    }
  };

  const onNumpadDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  // Renders small dots for pin input
  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
      );
    }
    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={64} color="#8b5cf6" style={styles.icon} />
        <Text style={styles.title}>Foutos</Text>
        <Text style={styles.subtitle}>Bóveda Segura</Text>
      </View>

      <View style={styles.content}>
        {showPinFallback ? (
          <View style={styles.pinContainer}>
            <Text style={styles.instruction}>Ingresa tu PIN maestro</Text>
            {renderPinDots()}
            <Numpad onPress={onNumpadPress} onDelete={onNumpadDelete} />
            
            <TouchableOpacity onPress={handleBiometricUnlock} style={styles.biometricRetry}>
              <Ionicons name="finger-print" size={24} color="#8b5cf6" />
              <Text style={styles.biometricRetryText}>Usar Biometría</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.unlockButton} onPress={handleBiometricUnlock} activeOpacity={0.8}>
            <Ionicons name="finger-print" size={32} color="#fff" />
            <Text style={styles.unlockButtonText}>Toca para Desbloquear</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.15, marginBottom: 20 },
  icon: { marginBottom: 15 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#a5b4fc', letterSpacing: 0.5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  unlockButton: { flexDirection: 'row', backgroundColor: '#8b5cf6', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  unlockButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  pinContainer: { width: '100%', alignItems: 'center' },
  instruction: { color: '#a5b4fc', fontSize: 16, marginBottom: 20 },
  dotsContainer: { flexDirection: 'row', marginBottom: 30 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dotFilled: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 },
  biometricRetry: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 10 },
  biometricRetryText: { color: '#8b5cf6', marginLeft: 8, fontSize: 16, fontWeight: '500' }
});
