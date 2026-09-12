import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SecurityService } from '../services/security.service';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Numpad } from '../components/Numpad';

type ChangePinScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChangePin'>;
interface Props { navigation: ChangePinScreenNavigationProp; }

export const ChangePinScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleVerifyCurrentPin = async (pin: string) => {
    const isValid = await SecurityService.validatePin(pin);
    if (isValid) {
      setTimeout(() => setStep(2), 200);
    } else {
      Alert.alert('Error', 'El PIN actual es incorrecto.');
      setCurrentPin('');
    }
  };

  const handleSetupNewPin = async (finalPin: string) => {
    try {
      await SecurityService.setupPin(finalPin);
      Alert.alert('Éxito', 'PIN actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo configurar el nuevo PIN');
    }
  };

  const onNumpadPress = (num: string) => {
    if (step === 1) {
      if (currentPin.length < 6) {
        const pin = currentPin + num;
        setCurrentPin(pin);
        if (pin.length === 6) {
          handleVerifyCurrentPin(pin);
        }
      }
    } else if (step === 2) {
      if (newPin.length < 6) {
        const pin = newPin + num;
        setNewPin(pin);
        if (pin.length === 6) {
          setTimeout(() => setStep(3), 200);
        }
      }
    } else if (step === 3) {
      if (confirmPin.length < 6) {
        const pin = confirmPin + num;
        setConfirmPin(pin);
        if (pin.length === 6) {
          if (newPin === pin) {
            handleSetupNewPin(pin);
          } else {
            Alert.alert('Error', 'Los PINs no coinciden. Inténtalo de nuevo.');
            setNewPin('');
            setConfirmPin('');
            setStep(2);
          }
        }
      }
    }
  };

  const onNumpadDelete = () => {
    if (step === 1 && currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
    } else if (step === 2 && newPin.length > 0) {
      setNewPin(newPin.slice(0, -1));
    } else if (step === 3 && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const currentLength = step === 1 ? currentPin.length : step === 2 ? newPin.length : confirmPin.length;

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View key={i} style={[styles.dot, i < currentLength && styles.dotFilled]} />
      );
    }
    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  const getTitle = () => {
    switch (step) {
      case 1: return 'PIN Actual';
      case 2: return 'Nuevo PIN';
      case 3: return 'Confirmar PIN';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 1: return 'Ingresa tu PIN actual de 6 dígitos';
      case 2: return 'Ingresa un nuevo PIN de 6 dígitos';
      case 3: return 'Confirma tu nuevo PIN';
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={64} color="#8b5cf6" style={styles.icon} />
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
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
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  header: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.12, marginBottom: 20 },
  icon: { marginBottom: 15 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#a5b4fc', letterSpacing: 0.5 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  dotsContainer: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dotFilled: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 },
});
