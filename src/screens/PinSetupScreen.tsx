import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SecurityService } from '../services/security.service';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../components/Numpad';

type PinSetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PinSetup'>;
interface Props { navigation: PinSetupScreenNavigationProp; }

export const PinSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleSetupPin = async (finalPin: string) => {
    try {
      await SecurityService.setupPin(finalPin);
      navigation.replace('Vault');
    } catch (e) {
      Alert.alert('Error', 'No se pudo configurar el PIN');
    }
  };

  const onNumpadPress = (num: string) => {
    if (step === 1) {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep(2), 200); // Transition to confirm step
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newPin = confirmPin + num;
        setConfirmPin(newPin);
        if (newPin.length === 6) {
          if (pin === newPin) {
            handleSetupPin(newPin);
          } else {
            Alert.alert('Error', 'Los PINs no coinciden. Inténtalo de nuevo.');
            setPin('');
            setConfirmPin('');
            setStep(1);
          }
        }
      }
    }
  };

  const onNumpadDelete = () => {
    if (step === 1 && pin.length > 0) {
      setPin(pin.slice(0, -1));
    } else if (step === 2 && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const currentLength = step === 1 ? pin.length : confirmPin.length;

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View key={i} style={[styles.dot, i < currentLength && styles.dotFilled]} />
      );
    }
    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="keypad" size={64} color="#8b5cf6" style={styles.icon} />
        <Text style={styles.title}>Configurar PIN</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Ingresa un PIN de 6 dígitos' : 'Confirma tu PIN'}
        </Text>
      </View>

      <View style={styles.content}>
        {renderPinDots()}
        <Numpad onPress={onNumpadPress} onDelete={onNumpadDelete} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.15, marginBottom: 20 },
  icon: { marginBottom: 15 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#a5b4fc', letterSpacing: 0.5 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  dotsContainer: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dotFilled: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 },
});
