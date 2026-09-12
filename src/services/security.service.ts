import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

const MASTER_KEY_ALIAS = 'foutos_master_key';
const HAS_PIN_SETUP_KEY = 'foutos_has_pin_setup';
const PIN_HASH_KEY = 'foutos_pin_hash';
const PIN_SALT_KEY = 'foutos_pin_salt';

export class SecurityService {
  static async generateAndStoreMasterKey(): Promise<void> {
    const existingKey = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    if (!existingKey) {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const base64Key = Buffer.from(randomBytes).toString('base64');
      await SecureStore.setItemAsync(MASTER_KEY_ALIAS, base64Key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      });
    }
  }

  static async getMasterKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
  }

  static async setupPin(pin: string): Promise<void> {
    const salt = Buffer.from(await Crypto.getRandomBytesAsync(16)).toString('base64');
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await SecureStore.setItemAsync(HAS_PIN_SETUP_KEY, 'true');
    await this.generateAndStoreMasterKey();
  }

  static async hasPinSetup(): Promise<boolean> {
    const hasSetup = await SecureStore.getItemAsync(HAS_PIN_SETUP_KEY);
    return hasSetup === 'true';
  }

  static async validatePin(pin: string): Promise<boolean> {
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
    const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!salt || !storedHash) return false;
    const inputHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt);
    return inputHash === storedHash;
  }
}
