/**
 * Privacy utilities for redacting and restoring sensitive information
 * before sending data to AI services
 */

export interface RedactionMap {
    [placeholder: string]: string;
}

export interface RedactionResult {
    redactedText: string;
    redactionMap: RedactionMap;
}

/**
 * Redacts personally identifiable information (PII) from text
 * Returns the redacted text and a map to restore original values
 */
export function redactPII(text: string, context?: {
    clientName?: string;
    ndisNumber?: string;
    workerNames?: string[];
}): RedactionResult {
    let redactedText = text;
    const redactionMap: RedactionMap = {};

    // 1. Redact client name if provided in context
    if (context?.clientName) {
        const namePattern = new RegExp(escapeRegex(context.clientName), 'gi');
        if (namePattern.test(redactedText)) {
            redactionMap['[CLIENT_NAME]'] = context.clientName;
            redactedText = redactedText.replace(namePattern, '[CLIENT_NAME]');
        }
    }

    // 2. Redact NDIS number if provided in context
    if (context?.ndisNumber) {
        const ndisPattern = new RegExp(escapeRegex(context.ndisNumber), 'gi');
        if (ndisPattern.test(redactedText)) {
            redactionMap['[NDIS_NUMBER]'] = context.ndisNumber;
            redactedText = redactedText.replace(ndisPattern, '[NDIS_NUMBER]');
        }
    }

    // 3. Redact worker names if provided in context
    if (context?.workerNames && context.workerNames.length > 0) {
        context.workerNames.forEach((workerName, index) => {
            const workerPattern = new RegExp(escapeRegex(workerName), 'gi');
            if (workerPattern.test(redactedText)) {
                const placeholder = `[WORKER_${index + 1}]`;
                redactionMap[placeholder] = workerName;
                redactedText = redactedText.replace(workerPattern, placeholder);
            }
        });
    }

    // 4. Redact email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = redactedText.match(emailPattern) || [];
    emails.forEach((email, index) => {
        const placeholder = `[EMAIL_${index + 1}]`;
        redactionMap[placeholder] = email;
        redactedText = redactedText.replace(email, placeholder);
    });

    // 5. Redact phone numbers (various formats)
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    const phones = redactedText.match(phonePattern) || [];
    phones.forEach((phone, index) => {
        const placeholder = `[PHONE_${index + 1}]`;
        redactionMap[placeholder] = phone;
        redactedText = redactedText.replace(phone, placeholder);
    });

    // 6. Redact specific dates (various formats)
    // Match formats like: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Month DD, YYYY
    const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})\b/gi;
    const dates = redactedText.match(datePattern) || [];
    const uniqueDates = [...new Set(dates)]; // Remove duplicates
    uniqueDates.forEach((date, index) => {
        const placeholder = `[DATE_${index + 1}]`;
        redactionMap[placeholder] = date;
        const dateRegex = new RegExp(escapeRegex(date), 'gi');
        redactedText = redactedText.replace(dateRegex, placeholder);
    });

    // 7. Redact specific addresses/locations
    // Look for common address patterns (street numbers + street names)
    const addressPattern = /\b\d+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Place|Pl)\b/gi;
    const addresses = redactedText.match(addressPattern) || [];
    const uniqueAddresses = [...new Set(addresses)];
    uniqueAddresses.forEach((address, index) => {
        const placeholder = `[LOCATION_${index + 1}]`;
        redactionMap[placeholder] = address;
        const addressRegex = new RegExp(escapeRegex(address), 'gi');
        redactedText = redactedText.replace(addressRegex, placeholder);
    });

    // 8. Redact Australian postcodes in context (4 digits that might be postcodes)
    // Only if they appear with location context words
    const postcodePattern = /\b(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+(\d{4})\b/gi;
    const postcodes = redactedText.match(postcodePattern) || [];
    postcodes.forEach((postcode, index) => {
        const placeholder = `[POSTCODE_${index + 1}]`;
        redactionMap[placeholder] = postcode;
        redactedText = redactedText.replace(postcode, placeholder);
    });

    return {
        redactedText,
        redactionMap
    };
}

/**
 * Restores original values from redacted text using the redaction map
 */
export function restorePII(redactedText: string, redactionMap: RedactionMap): string {
    let restoredText = redactedText;

    // Replace all placeholders with original values
    Object.entries(redactionMap).forEach(([placeholder, originalValue]) => {
        const placeholderRegex = new RegExp(escapeRegex(placeholder), 'g');
        restoredText = restoredText.replace(placeholderRegex, originalValue);
    });

    return restoredText;
}

/**
 * Redacts PII from multiple text items and returns combined redaction map
 */
export function redactMultipleTexts(
    texts: string[],
    context?: {
        clientName?: string;
        ndisNumber?: string;
        workerNames?: string[];
    }
): { redactedTexts: string[]; combinedRedactionMap: RedactionMap } {
    const combinedRedactionMap: RedactionMap = {};
    const redactedTexts: string[] = [];

    texts.forEach(text => {
        const { redactedText, redactionMap } = redactPII(text, context);
        redactedTexts.push(redactedText);

        // Merge redaction maps
        Object.assign(combinedRedactionMap, redactionMap);
    });

    return {
        redactedTexts,
        combinedRedactionMap
    };
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Redacts observation data (handles JSON objects)
 */
export function redactObservationData(
    data: any,
    context?: {
        clientName?: string;
        ndisNumber?: string;
        workerNames?: string[];
    }
): { redactedData: any; redactionMap: RedactionMap } {
    const combinedRedactionMap: RedactionMap = {};

    function redactValue(value: any): any {
        if (typeof value === 'string') {
            const { redactedText, redactionMap } = redactPII(value, context);
            Object.assign(combinedRedactionMap, redactionMap);
            return redactedText;
        } else if (Array.isArray(value)) {
            return value.map(item => redactValue(item));
        } else if (typeof value === 'object' && value !== null) {
            const redactedObj: any = {};
            Object.keys(value).forEach(key => {
                redactedObj[key] = redactValue(value[key]);
            });
            return redactedObj;
        }
        return value;
    }

    const redactedData = redactValue(data);

    return {
        redactedData,
        redactionMap: combinedRedactionMap
    };
}
