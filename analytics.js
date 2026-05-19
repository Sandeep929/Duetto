/**
 * Vercel Web Analytics initialization for vanilla JavaScript
 * This file imports and initializes the @vercel/analytics package
 */

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

console.log('✅ Vercel Analytics initialized');
