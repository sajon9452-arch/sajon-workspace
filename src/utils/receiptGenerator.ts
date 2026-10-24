import { FundRecord, Member, OrganizationProfile } from '../types';
import { toBengaliNumber } from './helpers';

/**
 * Converts numeric amounts to Bengali words for receipt (up to lakhs)
 */
function numberToBengaliWords(num: number): string {
  if (num <= 0) return 'শূন্য টাকা মাত্র';
  
  const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  function convertSmall(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o > 0 ? ' ' + ones[o] : ''}`;
  }

  let words = '';
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (lakh > 0) words += `${convertSmall(lakh)} লাখ `;
  if (thousand > 0) words += `${convertSmall(thousand)} হাজার `;
  if (hundred > 0) words += `${convertSmall(hundred)} শত `;
  if (remainder > 0) words += `${convertSmall(remainder)} `;

  return `${words.trim()} টাকা মাত্র`;
}

/**
 * Loads an image with fallback
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates an official digital payment receipt and triggers direct download to device
 */
export async function generateAndDownloadReceipt(
  record: FundRecord,
  member?: Member,
  profile?: OrganizationProfile
): Promise<string> {
  // Dimensions for high-resolution 2x canvas (Retina clarity)
  const width = 850;
  const height = 1150;
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas rendering context not available');
  }

  // Scale all drawing operations by 2 for crisp resolution
  ctx.scale(scale, scale);

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Ornamental border
  ctx.strokeStyle = '#059669'; // Emerald-600
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = '#D1FAE5'; // Emerald-100 inner border
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Top header green banner strip
  const topGrad = ctx.createLinearGradient(24, 24, width - 24, 24);
  topGrad.addColorStop(0, '#064E3B'); // Emerald-900
  topGrad.addColorStop(0.5, '#047857'); // Emerald-700
  topGrad.addColorStop(1, '#065F46'); // Emerald-800
  ctx.fillStyle = topGrad;
  ctx.fillRect(24, 24, width - 48, 12);

  // Load logo if available
  const logoUrl = profile?.logoUrl;
  let logoImg: HTMLImageElement | null = null;
  if (logoUrl) {
    try {
      logoImg = await loadImage(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // 2. Organization Header Section
  let headerStartY = 60;
  if (logoImg) {
    // Preserve exact original aspect ratio of the logo
    const maxLogoW = 90;
    const maxLogoH = 75;
    let drawW = logoImg.width;
    let drawH = logoImg.height;
    const ratio = Math.min(maxLogoW / drawW, maxLogoH / drawH);
    drawW *= ratio;
    drawH *= ratio;

    const logoX = (width - drawW) / 2;
    ctx.drawImage(logoImg, logoX, headerStartY, drawW, drawH);
    headerStartY += drawH + 16;
  } else {
    headerStartY += 10;
  }

  // Organization Name
  ctx.fillStyle = '#064E3B';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(profile?.name || 'সিলেট মানবসেবা সংগঠন', width / 2, headerStartY);

  // Slogan
  headerStartY += 24;
  ctx.fillStyle = '#047857';
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(profile?.tagline || 'মানবতার কল্যাণে নিবেদিত প্রাণ', width / 2, headerStartY);

  // Address & Est. Year
  headerStartY += 20;
  ctx.fillStyle = '#4B5563';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const addressInfo = [
    profile?.address ? `ঠিকানা: ${profile.address}` : '',
    profile?.establishedYear ? `প্রতিষ্ঠা: ${profile.establishedYear}` : '',
    profile?.regNumber ? `রেজি: ${profile.regNumber}` : ''
  ].filter(Boolean).join(' • ');
  ctx.fillText(addressInfo || 'পতেঙ্গা, চট্টগ্রাম', width / 2, headerStartY);

  // Divider Line
  headerStartY += 18;
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, headerStartY);
  ctx.lineTo(width - 50, headerStartY);
  ctx.stroke();

  // 3. Receipt Title Banner (Pill Box)
  headerStartY += 28;
  const bannerW = 340;
  const bannerH = 38;
  const bannerX = (width - bannerW) / 2;
  
  ctx.fillStyle = '#ECFDF5';
  ctx.beginPath();
  ctx.roundRect(bannerX, headerStartY, bannerW, bannerH, 8);
  ctx.fill();
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('অফিসিয়াল চাঁদা ও আর্থিক জমা রশিদ', width / 2, headerStartY + 24);

  // 4. Memo No & Date Row
  headerStartY += 55;
  const actualUserId = member?.id || record.memberId || record.id || 'N/A';
  const voucherNo = `VCH-${actualUserId}-${record.month ? record.month.replace(/\s+/g, '-') : new Date().getFullYear()}`;
  const todayFormatted = new Date().toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`রশিদ নং: `, 50, headerStartY);
  ctx.font = '700 12px monospace';
  ctx.fillStyle = '#047857';
  ctx.fillText(voucherNo, 105, headerStartY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`তারিখ: `, width - 160, headerStartY);
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(todayFormatted, width - 50, headerStartY);

  // 5. Member Details Box
  headerStartY += 18;
  const boxX = 50;
  const boxW = width - 100;
  const boxH = 100;

  ctx.fillStyle = '#F9FAFB';
  ctx.beginPath();
  ctx.roundRect(boxX, headerStartY, boxW, boxH, 8);
  ctx.fill();
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Member Box Content
  ctx.textAlign = 'left';
  // Column 1
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('সদস্যের নাম:', boxX + 16, headerStartY + 28);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(record.memberName || 'সম্মানিত সদস্য', boxX + 105, headerStartY + 28);

  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('সদস্য আইডি:', boxX + 16, headerStartY + 56);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 14px monospace';
  // Actual User ID from database
  ctx.fillText(actualUserId, boxX + 105, headerStartY + 56);

  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('মোবাইল নম্বর:', boxX + 16, headerStartY + 82);
  ctx.fillStyle = '#111827';
  ctx.font = '500 13px monospace';
  ctx.fillText(record.phone || member?.phone || 'সংযুক্ত নেই', boxX + 105, headerStartY + 82);

  // Column 2
  const col2X = boxX + boxW / 2 + 10;
  const actualDesignation = member?.designation || record.designation || 'সাধারণ সদস্য';
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('পদবী / পদ:', col2X, headerStartY + 28);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  // Actual Designation from database
  ctx.fillText(actualDesignation, col2X + 75, headerStartY + 28);

  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('রক্তের গ্রুপ:', col2X, headerStartY + 56);
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(member?.bloodGroup || 'অজানা', col2X + 75, headerStartY + 56);

  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('পেমেন্ট ধরণ:', col2X, headerStartY + 82);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('মাসিক কল্যাণ চাঁদা (পরিশোধিত)', col2X + 75, headerStartY + 82);

  // 6. Payment Breakdown Table
  headerStartY += boxH + 24;
  const tableX = 50;
  const tableW = width - 100;

  // Table Header
  ctx.fillStyle = '#064E3B';
  ctx.fillRect(tableX, headerStartY, tableW, 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('বিবরণ / খাত', tableX + 16, headerStartY + 23);
  ctx.fillText('মাস / সময়কাল', tableX + 250, headerStartY + 23);
  ctx.textAlign = 'right';
  ctx.fillText('মোট দাবি', tableX + tableW - 220, headerStartY + 23);
  ctx.fillText('জমা / পরিশোধ', tableX + tableW - 110, headerStartY + 23);
  ctx.fillText('বকেয়া', tableX + tableW - 16, headerStartY + 23);

  // Table Row 1
  const rowY = headerStartY + 36;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(tableX, rowY, tableW, 44);
  ctx.strokeStyle = '#E5E7EB';
  ctx.strokeRect(tableX, rowY, tableW, 44);

  const paidVal = Number(record.paidAmount || (record.status === 'Paid' ? record.amount : 0)) || 0;
  const dueVal = Number(record.dueAmount || 0) || 0;
  const totalVal = Number(record.amount || (paidVal + dueVal) || 500);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1F2937';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('সংগঠনের মাসিক কল্যাণ চাঁদা', tableX + 16, rowY + 27);

  ctx.fillStyle = '#4B5563';
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(record.paidMonths || record.month || 'মার্চ ২০২৬', tableX + 250, rowY + 27);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#374151';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳ ${toBengaliNumber(totalVal)}`, tableX + tableW - 220, rowY + 27);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳ ${toBengaliNumber(paidVal)}`, tableX + tableW - 110, rowY + 27);

  ctx.fillStyle = dueVal > 0 ? '#DC2626' : '#6B7280';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳ ${toBengaliNumber(dueVal)}`, tableX + tableW - 16, rowY + 27);

  // Table Total Summary Row
  const totalY = rowY + 44;
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(tableX, totalY, tableW, 40);
  ctx.strokeRect(tableX, totalY, tableW, 40);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('মোট প্রাপ্তি (সর্বমোট পরিশোধিত):', tableX + 16, totalY + 25);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳ ${toBengaliNumber(paidVal)}`, tableX + tableW - 16, totalY + 26);

  // 7. Amount in Words Box
  headerStartY = totalY + 54;
  ctx.fillStyle = '#ECFDF5';
  ctx.fillRect(tableX, headerStartY, tableW, 36);
  ctx.strokeStyle = '#A7F3D0';
  ctx.strokeRect(tableX, headerStartY, tableW, 36);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('কথায়:', tableX + 16, headerStartY + 23);

  ctx.fillStyle = '#047857';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(numberToBengaliWords(paidVal), tableX + 60, headerStartY + 23);

  // 8. Official Seal & Three Designated Signature and Name Areas
  // Requirement 7: Must feature three designated signature and name areas at the bottom for:
  // 1. সভাপতি (President)
  // 2. সাধারণ সম্পাদক (General Secretary)
  // 3. অর্থ বিষয়ক সম্পাদক (Finance Secretary)
  // Populated dynamically with English names edited and saved from the Admin Panel.
  headerStartY += 65;

  // Background subtle verification watermark banner
  ctx.fillStyle = '#F9FAFB';
  ctx.beginPath();
  ctx.roundRect(tableX, headerStartY, tableW, 115, 12);
  ctx.fill();
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Signature Coordinates
  const sigY = headerStartY + 50;
  const colWidth = tableW / 3;
  const leftX = tableX + colWidth * 0.5;
  const midX = tableX + colWidth * 1.5;
  const rightX = tableX + colWidth * 2.5;

  // Fetch dynamic names from organization profile
  const presidentName = (profile?.presidentName || '').trim() || 'President';
  const generalSecretaryName = (profile?.generalSecretaryName || '').trim() || 'General Secretary';
  const financeSecretaryName = (profile?.financeSecretaryName || '').trim() || 'Finance Secretary';

  // --- Signature Block 1: সভাপতি (President) ---
  ctx.textAlign = 'center';
  // Digital signature seal glyph
  ctx.fillStyle = '#047857';
  ctx.font = 'italic bold 14px "Brush Script MT", cursive, sans-serif';
  ctx.fillText(presidentName, leftX, sigY - 8);

  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX - 85, sigY);
  ctx.lineTo(leftX + 85, sigY);
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(presidentName, leftX, sigY + 18);

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('সভাপতি (President)', leftX, sigY + 33);

  ctx.fillStyle = '#6B7280';
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.fillText('সিলেট মানবসেবা সংগঠন', leftX, sigY + 46);

  // --- Signature Block 2: সাধারণ সম্পাদক (General Secretary) ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#047857';
  ctx.font = 'italic bold 14px "Brush Script MT", cursive, sans-serif';
  ctx.fillText(generalSecretaryName, midX, sigY - 8);

  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX - 85, sigY);
  ctx.lineTo(midX + 85, sigY);
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(generalSecretaryName, midX, sigY + 18);

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('সাধারণ সম্পাদক (General Secretary)', midX, sigY + 33);

  ctx.fillStyle = '#6B7280';
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.fillText('সিলেট মানবসেবা সংগঠন', midX, sigY + 46);

  // --- Signature Block 3: অর্থ বিষয়ক সম্পাদক (Finance Secretary) ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#047857';
  ctx.font = 'italic bold 14px "Brush Script MT", cursive, sans-serif';
  ctx.fillText(financeSecretaryName, rightX, sigY - 8);

  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX - 85, sigY);
  ctx.lineTo(rightX + 85, sigY);
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(financeSecretaryName, rightX, sigY + 18);

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('অর্থ বিষয়ক সম্পাদক (Finance Secretary)', rightX, sigY + 33);

  ctx.fillStyle = '#6B7280';
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.fillText('সিলেট মানবসেবা সংগঠন', rightX, sigY + 46);

  // 9. Bottom Footer Disclaimer Strip
  const footerY = height - 55;
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, footerY);
  ctx.lineTo(width - 40, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B7280';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'এটি একটি কম্পিউটার-জেনারেটেড ডিজিটাল পেমেন্ট রশিদ। সংগঠন কর্তৃক অনুমোদিত ও ভেরিফাইড।',
    width / 2,
    footerY + 18
  );

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `কারিগরি সহায়তা: ${profile?.name || 'সিলেট মানবসেবা সংগঠন'} ডিজিটাল সিস্টেম • হেল্পলাইন: ${profile?.hotline || profile?.phone || '01886122678'}`,
    width / 2,
    footerY + 32
  );

  // 10. Generate PNG Data URL and Trigger Download directly to phone/device
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        const dataUrl = canvas.toDataURL('image/png');
        downloadViaAnchor(dataUrl, record);
        resolve(dataUrl);
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      downloadViaAnchor(blobUrl, record);
      resolve(blobUrl);
    }, 'image/png');
  });
}

function downloadViaAnchor(url: string, record: FundRecord) {
  const memberNameClean = (record.memberName || 'Member').replace(/\s+/g, '_');
  const monthClean = (record.paidMonths || record.month || 'Receipt').replace(/\s+/g, '_');
  const filename = `Receipt_${memberNameClean}_${monthClean}.png`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
