/**
 * Utility to generate an authentic handwritten Indian Mandi "Kachha Bill" (कच्चा पर्चा)
 * as a high-resolution PNG data URL on an HTML5 canvas.
 * Allows 1-click testing of Multimodal Vision OCR by judges and users.
 */
export function generateSampleBillCanvas(
  variant: 'sharma' | 'gupta' | 'patel' = 'sharma'
): { dataUrl: string; mimeType: string; fileName: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { dataUrl: '', mimeType: 'image/png', fileName: 'sample_bill.png' };
  }

  // 1. Paper Background (Warm Aged Parchment with subtle noise/ruled lines)
  ctx.fillStyle = '#FAF7EE';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle ruled lines (blue notebook style)
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let y = 140; y < canvas.height - 80; y += 32) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width - 40, y);
    ctx.stroke();
  }

  // Vintage pink margin line on left
  ctx.strokeStyle = '#FECDD3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 40);
  ctx.lineTo(110, canvas.height - 40);
  ctx.stroke();

  // Outer border
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // 2. Header Text
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('॥ श्री गणेशाय नमः ॥', canvas.width / 2, 60);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px serif';
  ctx.fillText('कच्चा बिल / ESTIMATE MEMO (MANDI PARCHI)', canvas.width / 2, 95);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('श्री महाकाल ट्रेडिंग कंपनी • थोक किराना व जिंस विक्रेता • सियागंज, इंदौर (म.प्र.)', canvas.width / 2, 120);

  // 3. Bill Meta Details
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#1E293B';

  const today = new Date().toISOString().split('T')[0];

  if (variant === 'sharma') {
    ctx.fillText('बिल क्र.: KB-842 / FY26', 125, 165);
    ctx.fillText(`दिनांक: ${today}`, 560, 165);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ग्राहक / Party: मे. शर्मा किराना एंड जनरल स्टोर', 125, 205);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('स्थान / Beat: स्कीम नं. 54, विजय नगर, इंदौर | GST: 23AABCS1429B1Z5', 125, 230);

    // Table Header
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('क्र.', 55, 280);
    ctx.fillText('विवरण / Particulars', 125, 280);
    ctx.fillText('मात्रा / Qty', 440, 280);
    ctx.fillText('दर / Rate (₹)', 560, 280);
    ctx.fillText('रकम / Amount (₹)', 660, 280);

    // Divider line
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 295);
    ctx.lineTo(canvas.width - 40, 295);
    ctx.stroke();

    // Line 1
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText('1.', 55, 335);
    ctx.fillText('फॉर्च्यून सोयाबीन तेल 15L टिन', 125, 335);
    ctx.font = 'bold 15px monospace';
    ctx.fillText('20 पेटी', 440, 335);
    ctx.fillText('1,650.00', 560, 335);
    ctx.fillText('33,000.00', 660, 335);

    // Line 2
    ctx.font = '15px sans-serif';
    ctx.fillText('2.', 55, 385);
    ctx.fillText('मधुर शुद्ध शक्कर M-30 ग्रेड (50Kg)', 125, 385);
    ctx.font = 'bold 15px monospace';
    ctx.fillText('10 कट्टा', 440, 385);
    ctx.fillText('900.00', 560, 385);
    ctx.fillText('9,000.00', 660, 385);

    // Divider line
    ctx.beginPath();
    ctx.moveTo(40, 480);
    ctx.lineTo(canvas.width - 40, 480);
    ctx.stroke();

    // Totals section
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('कुल योग / Total Bill:', 440, 520);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('₹ 42,000.00', 650, 520);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.fillText('जमा नकद / Paid Amount (Cash):', 370, 560);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('- ₹ 15,000.00', 650, 560);

    // Stated Udhaar (Math Anomaly highlight)
    ctx.fillStyle = '#B91C1C';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('बाकी उधार (Stated in Parchi):', 380, 610);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('₹ 29,000.00', 650, 610);

    ctx.font = 'italic 13px sans-serif';
    ctx.fillStyle = '#991B1B';
    ctx.fillText('⚠️ (नोट: पर्ची में ₹29,000 लिखा गया, जबकि असली शेष ₹27,000 बनता है!)', 320, 640);
  } else if (variant === 'gupta') {
    ctx.fillText('बिल क्र.: GM-309 / FY26', 125, 165);
    ctx.fillText(`दिनांक: ${today}`, 560, 165);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ग्राहक / Party: गुप्ता मेडिकल एंड सर्जिकल स्टोर', 125, 205);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('स्थान / Beat: राजवाड़ा चौराहा, इंदौर | GST: 23AADCG4920E1ZT', 125, 230);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('क्र.', 55, 280);
    ctx.fillText('विवरण / Particulars', 125, 280);
    ctx.fillText('मात्रा / Qty', 440, 280);
    ctx.fillText('दर / Rate (₹)', 560, 280);
    ctx.fillText('रकम / Amount (₹)', 660, 280);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 295);
    ctx.lineTo(canvas.width - 40, 295);
    ctx.stroke();

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText('1.', 55, 335);
    ctx.fillText('Paracetamol 650mg Blister Strip', 125, 335);
    ctx.font = 'bold 15px monospace';
    ctx.fillText('30 बॉक्स', 440, 335);
    ctx.fillText('150.00', 560, 335);
    ctx.fillText('4,500.00', 660, 335);

    ctx.font = '15px sans-serif';
    ctx.fillText('2.', 55, 385);
    ctx.fillText('Electral WHO ORS Sachets (50s)', 125, 385);
    ctx.font = 'bold 15px monospace';
    ctx.fillText('15 पेटी', 440, 385);
    ctx.fillText('233.33', 560, 385);
    ctx.fillText('3,500.00', 660, 385);

    ctx.beginPath();
    ctx.moveTo(40, 480);
    ctx.lineTo(canvas.width - 40, 480);
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('कुल योग / Total Bill:', 440, 520);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('₹ 8,000.00', 650, 520);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.fillText('जमा PhonePe / Realized:', 400, 560);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('- ₹ 3,000.00', 650, 560);

    ctx.fillStyle = '#B91C1C';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('बाकी उधार (Claimed):', 430, 610);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('₹ 6,000.00', 650, 610);

    ctx.font = 'italic 13px sans-serif';
    ctx.fillStyle = '#991B1B';
    ctx.fillText('⚠️ (पर्ची में ₹6,000 लिखा, असली ₹5,000 है - ₹1,000 अंतर)', 390, 640);
  } else {
    ctx.fillText('बिल क्र.: PH-105 / FY26', 125, 165);
    ctx.fillText(`दिनांक: ${today}`, 560, 165);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ग्राहक / Party: पटेल हार्डवेयर एंड टूल्स', 125, 205);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('स्थान / Beat: भंवरकुआं मेन रोड, इंदौर | GST: 23AAICP5541L1Z9', 125, 230);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('क्र.', 55, 280);
    ctx.fillText('विवरण / Particulars', 125, 280);
    ctx.fillText('मात्रा / Qty', 440, 280);
    ctx.fillText('दर / Rate (₹)', 560, 280);
    ctx.fillText('रकम / Amount (₹)', 660, 280);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 295);
    ctx.lineTo(canvas.width - 40, 295);
    ctx.stroke();

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText('1.', 55, 335);
    ctx.fillText('Bosch HSS Professional Drill Bits (Pack 10)', 125, 335);
    ctx.font = 'bold 15px monospace';
    ctx.fillText('50 बॉक्स', 440, 335);
    ctx.fillText('300.00', 560, 335);
    ctx.fillText('15,000.00', 660, 335);

    ctx.beginPath();
    ctx.moveTo(40, 480);
    ctx.lineTo(canvas.width - 40, 480);
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('कुल योग / Total Bill:', 440, 520);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('₹ 15,000.00', 650, 520);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.fillText('जमा UPI / Paid:', 460, 560);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('- ₹ 12,000.00', 650, 560);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('बाकी उधार (Verified):', 430, 610);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('₹ 3,000.00', 650, 610);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.fillText('✓ गणितीय हिसाब 100% सही', 480, 640);
  }

  // 4. Mandi Munshi Signature & Stamp
  ctx.save();
  ctx.translate(140, 800);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2;
  ctx.strokeRect(-10, -10, 180, 70);
  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('सियागंज गल्ला मंडी', 10, 20);
  ctx.font = '11px monospace';
  ctx.fillText('सत्यापित / VERIFIED', 15, 40);
  ctx.restore();

  // Signature line
  ctx.fillStyle = '#334155';
  ctx.font = '13px cursive';
  ctx.fillText('मुंशी रामप्रसाद शर्मा (हस्ताक्षर)', 520, 840);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(500, 850);
  ctx.lineTo(720, 850);
  ctx.stroke();
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('अधिकृत मुनीम / Dispatch Clerk', 540, 870);

  const dataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl,
    mimeType: 'image/png',
    fileName: `kachha_bill_${variant}_${Date.now()}.png`,
  };
}
