import * as LocalAuthentication from 'expo-local-authentication';

export class AuthService {
  static async hasHardwareAsync(): Promise<boolean> {
    return await LocalAuthentication.hasHardwareAsync();
  }

  static async isEnrolledAsync(): Promise<boolean> {
    return await LocalAuthentication.isEnrolledAsync();
  }

  static async authenticateAsync(promptMessage: string = 'Desbloquea tu bóveda'): Promise<LocalAuthentication.LocalAuthenticationResult> {
    const hasHardware = await this.hasHardwareAsync();
    const isEnrolled = await this.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return { success: false, error: 'not_available' as any };

    return await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar PIN',
      disableDeviceFallback: true,
      cancelLabel: 'Cancelar',
    });
  }
}
