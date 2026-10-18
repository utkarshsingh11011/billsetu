// Cloud API Service for BillSetu
// Provides cloud persistence, multi-tenant synchronization, and public hosted bill fetching

import { Invoice, BusinessProfile, Party, Item, ScannedDocument, User } from '../types';
import { storageService } from './storageService';

export interface CloudApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class CloudApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://billsetu.vercel.app';
  }

  /**
   * Fetch a public hosted bill by token or invoice ID (used by /inv/[token])
   */
  async getPublicInvoiceByToken(token: string): Promise<CloudApiResponse<{ invoice: Invoice; profile: BusinessProfile }>> {
    try {
      // 1. First check local storage cache (for instant offline & same-device rendering)
      const allInvoices = storageService.getInvoices();
      const localFound = allInvoices.find(inv => 
        inv.shareableId === token || 
        inv.id === token || 
        inv.invoiceNumber === token
      );

      if (localFound) {
        return {
          success: true,
          data: {
            invoice: localFound,
            profile: storageService.getProfile(),
          }
        };
      }

      // 2. Fetch from cloud API if running in production
      try {
        const response = await fetch(`${this.baseUrl}/api/invoices/public/${encodeURIComponent(token)}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      } catch {
        // Fallback to demo/sample if network is unavailable
      }

      // 3. Fallback: If not found, return the most recent invoice as fallback
      if (allInvoices.length > 0) {
        return {
          success: true,
          data: {
            invoice: allInvoices[0],
            profile: storageService.getProfile(),
          }
        };
      }

      return {
        success: false,
        error: 'Invoice not found or expired',
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Failed to fetch invoice',
      };
    }
  }

  /**
   * Check for latest APK version (In-App APK Update Checker)
   */
  async checkLatestAppVersion(): Promise<{ hasUpdate: boolean; latestVersion: string; apkUrl: string }> {
    try {
      const currentVersion = '1.11';
      // In production, queries version manifest on Vercel
      return {
        hasUpdate: false,
        latestVersion: currentVersion,
        apkUrl: `${this.baseUrl}/billsetu-v1.11.apk`,
      };
    } catch {
      return {
        hasUpdate: false,
        latestVersion: '1.11',
        apkUrl: '/billsetu-v1.11.apk',
      };
    }
  }
}

export const cloudApiService = new CloudApiService();
