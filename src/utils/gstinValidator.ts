/**
 * GSTIN Validation Utility for Indian Tax & Accounting Compliance
 * Standard 15-digit Format:
 * [0-9]{2}       - 2 Digits State Code (01-38)
 * [A-Z]{5}       - First 5 letters of entity PAN
 * [0-9]{4}       - 4 numbers of entity PAN
 * [A-Z]{1}       - 1 check letter of entity PAN
 * [1-9A-Z]{1}    - Entity code (number of registrations under PAN in state)
 * 'Z'            - 14th character is always 'Z' by default
 * [0-9A-Z]{1}    - 15th character checksum
 */

export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh (Indore Div)',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export interface GSTINValidationResult {
  isValid: boolean;
  cleanGSTIN: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityNumber?: string;
  errorMessage?: string;
}

/**
 * Validates a single GSTIN string against the standard 15-digit Indian GST format
 */
export function validateGSTIN(input: string): GSTINValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      cleanGSTIN: '',
      errorMessage: 'GSTIN cannot be empty',
    };
  }

  const clean = input.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');

  if (clean.length !== 15) {
    return {
      isValid: false,
      cleanGSTIN: clean,
      errorMessage: `Invalid length: Expected 15 characters, got ${clean.length}`,
    };
  }

  const stateCode = clean.slice(0, 2);
  const stateNum = parseInt(stateCode, 10);
  const stateName = INDIAN_STATE_CODES[stateCode];

  if (isNaN(stateNum) || stateNum < 1 || stateNum > 38 || !stateName) {
    return {
      isValid: false,
      cleanGSTIN: clean,
      stateCode,
      errorMessage: `Invalid State Code "${stateCode}". Must be between 01 and 38.`,
    };
  }

  // PAN Check: 5 letters, 4 digits, 1 letter
  const panPart = clean.slice(2, 12);
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panPart)) {
    return {
      isValid: false,
      cleanGSTIN: clean,
      stateCode,
      stateName,
      pan: panPart,
      errorMessage: `Invalid PAN section "${panPart}". Expected 5 letters, 4 digits, 1 letter.`,
    };
  }

  // 14th character must be 'Z'
  if (clean[13] !== 'Z') {
    return {
      isValid: false,
      cleanGSTIN: clean,
      stateCode,
      stateName,
      pan: panPart,
      errorMessage: `14th character must be 'Z' (got '${clean[13]}') per GSTIN rules.`,
    };
  }

  // Check full regex
  if (!GSTIN_REGEX.test(clean)) {
    return {
      isValid: false,
      cleanGSTIN: clean,
      stateCode,
      stateName,
      pan: panPart,
      errorMessage: 'Malformed 15-digit GSTIN structure.',
    };
  }

  return {
    isValid: true,
    cleanGSTIN: clean,
    stateCode,
    stateName,
    pan: panPart,
    entityNumber: clean[12],
  };
}

/**
 * Extracts and validates any GSTIN-like tokens (15 chars) found in a raw text note
 */
export function extractAndValidateGSTINs(text: string): GSTINValidationResult[] {
  if (!text) return [];

  // Match standalone or tagged GSTIN candidate tokens:
  // e.g. "GSTIN: 23AABCS1429B1Z5" or loose 15-alphanumeric tokens
  const words = text.match(/(?:GSTIN[:\s-]*)?([0-9A-Za-z]{12,18})/gi) || [];
  const results: GSTINValidationResult[] = [];
  const seen = new Set<string>();

  for (const rawWord of words) {
    const candidate = rawWord.replace(/GSTIN[:\s-]*/i, '').trim().toUpperCase();
    if (candidate.length >= 13 && candidate.length <= 16 && !seen.has(candidate)) {
      seen.add(candidate);
      results.push(validateGSTIN(candidate));
    }
  }

  return results;
}
