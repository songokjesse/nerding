/**
 * Simple test script for privacy utilities
 * Run with: npx tsx test-privacy-utils.ts
 */

import { redactPII, restorePII, redactObservationData } from './lib/privacy-utils';

console.log('🔒 Testing Privacy Utilities\n');

// Test 1: Basic redaction
console.log('Test 1: Basic PII Redaction');
const testText1 = 'John Smith had a great day. His NDIS number is 123456789. He lives at 123 Main Street.';
const context1 = {
    clientName: 'John Smith',
    ndisNumber: '123456789'
};

const result1 = redactPII(testText1, context1);
console.log('Original:', testText1);
console.log('Redacted:', result1.redactedText);
console.log('Map:', result1.redactionMap);

const restored1 = restorePII(result1.redactedText, result1.redactionMap);
console.log('Restored:', restored1);
console.log('Match:', restored1 === testText1 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Email and phone redaction
console.log('Test 2: Email and Phone Redaction');
const testText2 = 'Contact me at john@example.com or call 0412-345-678';
const result2 = redactPII(testText2);
console.log('Original:', testText2);
console.log('Redacted:', result2.redactedText);
console.log('Map:', result2.redactionMap);

const restored2 = restorePII(result2.redactedText, result2.redactionMap);
console.log('Restored:', restored2);
console.log('Match:', restored2 === testText2 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Date redaction
console.log('Test 3: Date Redaction');
const testText3 = 'The appointment was on 15/11/2024 and the next one is November 27, 2024';
const result3 = redactPII(testText3);
console.log('Original:', testText3);
console.log('Redacted:', result3.redactedText);
console.log('Map:', result3.redactionMap);

const restored3 = restorePII(result3.redactedText, result3.redactionMap);
console.log('Restored:', restored3);
console.log('Match:', restored3 === testText3 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Worker names redaction
console.log('Test 4: Worker Names Redaction');
const testText4 = 'Sarah helped John today. Later, Mike also assisted.';
const context4 = {
    clientName: 'John',
    workerNames: ['Sarah', 'Mike']
};
const result4 = redactPII(testText4, context4);
console.log('Original:', testText4);
console.log('Redacted:', result4.redactedText);
console.log('Map:', result4.redactionMap);

const restored4 = restorePII(result4.redactedText, result4.redactionMap);
console.log('Restored:', restored4);
console.log('Match:', restored4 === testText4 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 5: Observation data redaction
console.log('Test 5: Observation Data Redaction');
const observationData = {
    type: 'BOWEL_MONITORING',
    consistency: 'normal',
    notes: 'John Smith had a normal bowel movement at 123 Main Street',
    time: '10:30 AM'
};
const context5 = {
    clientName: 'John Smith'
};
const result5 = redactObservationData(observationData, context5);
console.log('Original:', JSON.stringify(observationData, null, 2));
console.log('Redacted:', JSON.stringify(result5.redactedData, null, 2));
console.log('Map:', result5.redactionMap);
console.log('');

// Test 6: No PII in text
console.log('Test 6: No PII in Text');
const testText6 = 'The weather was nice today. Had a good walk.';
const result6 = redactPII(testText6);
console.log('Original:', testText6);
console.log('Redacted:', result6.redactedText);
console.log('Map:', result6.redactionMap);
console.log('No changes:', result6.redactedText === testText6 && Object.keys(result6.redactionMap).length === 0 ? '✅ PASS' : '❌ FAIL');
console.log('');

console.log('✅ All privacy utility tests completed!');
