import React, { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { EncryptionService } from '../services/encryption.service';
import * as FileSystem from 'expo-file-system/legacy';

interface Props {
  encryptedUri: string;
  style?: any;
}

export const DecryptedImage: React.FC<Props> = ({ encryptedUri, style }) => {
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let tempPath = '';

    const decrypt = async () => {
      try {
        tempPath = await EncryptionService.decryptFileToTemp(encryptedUri);
        if (active) {
          setTempUri(tempPath);
        }
      } catch (e) {
        console.error("Error decrypting image:", e);
        if (active) setError(true);
      }
    };

    decrypt();

    return () => {
      active = false;
      // Limpiar el archivo temporal al desmontar para evitar dejar rastros legibles
      if (tempPath) {
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(console.error);
      }
    };
  }, [encryptedUri]);

  if (error) {
    return <View style={[styles.placeholder, style]} />;
  }

  if (!tempUri) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator color="#000" />
      </View>
    );
  }

  return <Image source={{ uri: tempUri }} style={style} />;
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
