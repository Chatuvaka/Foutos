import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumpadProps {
  onPress: (num: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const buttonSize = width * 0.2;

export const Numpad: React.FC<NumpadProps> = ({ onPress, onDelete, disabled }) => {
  const renderButton = (num: string) => (
    <TouchableOpacity
      key={num}
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => onPress(num)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {['1', '2', '3'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['4', '5', '6'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['7', '8', '9'].map(renderButton)}
      </View>
      <View style={styles.row}>
        <View style={styles.emptyButton} />
        {renderButton('0')}
        <TouchableOpacity
          style={styles.button}
          onPress={onDelete}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="backspace-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  emptyButton: {
    width: buttonSize,
    height: buttonSize,
    marginHorizontal: 15,
  }
});
