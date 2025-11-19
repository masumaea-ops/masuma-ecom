
import axios from 'axios';
import { AppDataSource } from '../config/database';
import { SystemSetting } from '../entities/SystemSetting';

interface FiscalItem {
  hsCode: string;
  name: string;
  qty: number;
  unitPrice: number;
  taxRate: 16 | 0 | 8; 
}

export class EtimsService {
  private static settingsRepo = AppDataSource.getRepository(SystemSetting);

  private static async getSetting(key: string): Promise<string> {
      const s = await this.settingsRepo.findOneBy({ key });
      return s?.value || '';
  }
  
  static async signInvoice(invoiceId: string, items: FiscalItem[], total: number) {
    try {
      const deviceSerial = await this.getSetting('DEVICE_SERIAL') || process.env.KRA_DEVICE_SERIAL || 'DEV-SIMULATOR';
      const pin = await this.getSetting('KRA_PIN') || process.env.COMPANY_PIN || 'P000000000Z';
      const apiUrl = await this.getSetting('KRA_API_URL') || 'https://itax.kra.go.ke/eTIMS/api';

      console.log(`[eTIMS] Signing Invoice ${invoiceId} via ${deviceSerial} (PIN: ${pin})`);

      // MOCK IMPLEMENTATION
      // In real world, perform Axios POST to apiUrl with payload signed by private key
      
      const mockResponse = {
        controlCode: `${deviceSerial}-${invoiceId.substring(0, 8)}-${Date.now().toString().slice(-6)}`,
        qrCode: `https://itax.kra.go.ke/verify?pin=${pin}&invoice=${invoiceId}`,
        signature: `SIG_${Math.random().toString(36).substring(7).toUpperCase()}_${Date.now()}`,
        fiscalDate: new Date()
      };

      return mockResponse;

    } catch (error) {
      console.error('KRA eTIMS Error:', error);
      return null; 
    }
  }
}
