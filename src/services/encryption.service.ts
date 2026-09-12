import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import * as FileSystem from 'expo-file-system/legacy';
import { SecurityService } from './security.service';
import * as Crypto from 'expo-crypto';

export class EncryptionService {
  /**
   * Lee un archivo plano, lo cifra usando AES-256 y lo guarda en el destino.
   * Borra el archivo fuente si deleteSource es true.
   */
  static async encryptFile(sourceUri: string, destUri: string, deleteSource: boolean = false): Promise<void> {
    const masterKeyBase64 = await SecurityService.getMasterKey();
    if (!masterKeyBase64) throw new Error("Clave maestra no disponible");

    // 1. Manejo de URIs de Android (content://)
    // readAsStringAsync no soporta content:// directamente en algunas versiones de Expo.
    let fileToRead = sourceUri;
    if (sourceUri.startsWith('content://')) {
      fileToRead = FileSystem.cacheDirectory + 'temp_read_' + Date.now() + '.tmp';
      await FileSystem.copyAsync({ from: sourceUri, to: fileToRead });
    }

    // 2. Leer el archivo como Base64
    const fileBase64 = await FileSystem.readAsStringAsync(fileToRead, { encoding: FileSystem.EncodingType.Base64 });

    // Borrar el temporal si lo creamos
    if (fileToRead !== sourceUri) {
      await FileSystem.deleteAsync(fileToRead, { idempotent: true });
    }

    // 2. Cifrar (Usando un IV derivado del timestamp para evitar que CryptoJS intente usar el RNG nativo que falla)
    const ivString = Date.now().toString(16).padEnd(32, '0');
    const iv = CryptoJS.enc.Hex.parse(ivString);
    const encrypted = CryptoJS.AES.encrypt(fileBase64, masterKeyBase64, { iv: iv }).toString();

    // Guardamos el IV al principio del archivo o junto a él, pero por simplicidad de esta demo 
    // y como el masterKeyBase64 se usó como passphrase (String) en lugar de un Key puro (WordArray),
    // CryptoJS deriva un IV y un Salt. Para forzar que NO derive, necesitamos pasar key y iv como WordArrays.
    
    // Mejor solución: cifrado usando una clave derivada directamente y un IV estático
    const key = CryptoJS.SHA256(masterKeyBase64); // WordArray
    const encryptedData = CryptoJS.AES.encrypt(fileBase64, key, { 
      iv: iv,
      mode: CryptoJS.mode.CBC
    });
    
    // El formato será iv + "::" + ciphertext
    const finalContent = ivString + "::" + encryptedData.toString();

    // 3. Guardar el archivo cifrado
    await FileSystem.writeAsStringAsync(destUri, finalContent, { encoding: FileSystem.EncodingType.UTF8 });

    // 4. (Opcional) Borrar la fuente
    if (deleteSource) {
      await FileSystem.deleteAsync(sourceUri, { idempotent: true });
    }
  }

  /**
   * Descifra un archivo cifrado y lo guarda en una ubicación temporal.
   * Retorna el URI del archivo descifrado temporal.
   * IMPORTANTE: El archivo temporal debe ser borrado después de su uso.
   */
  static async decryptFileToTemp(encryptedUri: string): Promise<string> {
    const masterKeyBase64 = await SecurityService.getMasterKey();
    if (!masterKeyBase64) throw new Error("Clave maestra no disponible");

    // 1. Leer contenido cifrado (formato: ivString::ciphertext)
    const fileContent = await FileSystem.readAsStringAsync(encryptedUri, { encoding: FileSystem.EncodingType.UTF8 });
    
    // Si era un archivo cifrado antes de nuestro parche, el split fallará o no tendrá "::". 
    // Para retrocompatibilidad (aunque no es necesario aquí porque no se pudo cifrar nada), intentamos el descifrado antiguo
    let decryptedBytes;
    if (fileContent.includes("::")) {
      const parts = fileContent.split("::");
      const ivString = parts[0];
      const ciphertext = parts[1];
      
      const key = CryptoJS.SHA256(masterKeyBase64);
      const iv = CryptoJS.enc.Hex.parse(ivString);
      
      decryptedBytes = CryptoJS.AES.decrypt(ciphertext, key, { iv: iv, mode: CryptoJS.mode.CBC });
    } else {
      // Fallback a descifrado original
      decryptedBytes = CryptoJS.AES.decrypt(fileContent, masterKeyBase64);
    }

    const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedBase64) {
      throw new Error("No se pudo descifrar el archivo (clave incorrecta o datos corruptos)");
    }

    // 3. Guardar en directorio temporal (Caché)
    const tempFileName = (Date.now().toString(36) + Math.random().toString(36).substring(2)) + ".tmp";
    const tempUri = FileSystem.cacheDirectory + tempFileName;

    await FileSystem.writeAsStringAsync(tempUri, decryptedBase64, { encoding: FileSystem.EncodingType.Base64 });

    return tempUri;
  }
}
