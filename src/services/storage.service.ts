import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { EncryptionService } from './encryption.service';

// Directorio raíz de la bóveda
export const VAULT_DIR = `${FileSystem.documentDirectory}foutos_vault/`;

export interface VaultFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  uri: string; // Ubicación cifrada permanente
  originalUri?: string; 
  mimeType?: string;
  size?: number;
}

export class StorageService {
  static async initVaultDir() {
    const dirInfo = await FileSystem.getInfoAsync(VAULT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
    }
  }

  static async saveFile(sourceUri: string, name: string, type: VaultFile['type'], mimeType?: string, size?: number): Promise<VaultFile> {
    await this.initVaultDir();
    // Reemplazamos Crypto.randomUUID() por un ID generado en JS puro
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Extraer extensión de forma segura (los URIs content:// pueden tener formatos raros)
    let extension = sourceUri.includes('.') ? sourceUri.split('.').pop() || '' : '';
    extension = extension.replace(/[^a-zA-Z0-9]/g, ''); // Quitar slashes o caracteres inválidos
    
    if (!extension || extension.length > 5) {
      extension = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'bin';
    }

    const safeName = `${id}.${extension}.enc`; // Añadimos .enc para identificar que está cifrado
    const destinationUri = VAULT_DIR + safeName;

    // Cifrar el archivo (en lugar de solo copiar)
    await EncryptionService.encryptFile(sourceUri, destinationUri);

    return {
      id,
      name,
      type,
      uri: destinationUri,
      originalUri: sourceUri,
      mimeType,
      size
    };
  }

  static async getFiles(): Promise<VaultFile[]> {
    await this.initVaultDir();
    const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
    
    return files.map(file => {
      // Remover .enc para la inferencia de tipo básica
      const originalName = file.replace('.enc', '');
      return {
        id: file,
        name: originalName,
        type: originalName.match(/\.(jpg|jpeg|png)$/i) ? 'image' : originalName.match(/\.(mp4|mov)$/i) ? 'video' : 'document',
        uri: VAULT_DIR + file
      };
    });
  }

  static async deleteFile(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
