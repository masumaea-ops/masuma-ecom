
import axios from 'axios';
import { CacheService } from '../lib/cache';

const RATES_CACHE_KEY = 'forex_rates_kes_base';
const CACHE_TTL = 3600; // 1 Hour

// Fallback rates in case external API fails
const FALLBACK_RATES = {
    KES: 1,
    USD: 0.0076, // Approx 130 KES
    UGX: 28.5,
    TZS: 19.5,
    RWF: 9.8
};

export class ExchangeRateService {
    static async getRates() {
        return CacheService.getOrSet(RATES_CACHE_KEY, async () => {
            try {
                // Using open.er-api.com (Free, no key required for basic use)
                // Base currency KES
                const response = await axios.get('https://open.er-api.com/v6/latest/KES');
                
                if (response.data && response.data.result === 'success') {
                    const rates = response.data.rates;
                    return {
                        KES: 1,
                        USD: rates.USD,
                        UGX: rates.UGX,
                        TZS: rates.TZS,
                        RWF: rates.RWF
                    };
                }
                throw new Error('Invalid API response');
            } catch (error) {
                console.error('Forex API Error, using fallback rates:', error);
                return FALLBACK_RATES;
            }
        }, CACHE_TTL);
    }
}
