export const useWhatsApp = () => {
  const MESSAGES = {
    docReminder: (name, docType, docNo, expiry) =>
      `Dear ${name}, your ${docType} (No: ${docNo}) expires on ${expiry}. Please contact us to initiate renewal.`,
    invoiceReady: (name, invNo, amount) =>
      `Dear ${name}, your invoice ${invNo} for AED ${amount} is ready. Please arrange payment at your earliest convenience.`,
    general: (name) =>
      `Dear ${name}, greetings from DocClear Management.`,
  };

  /**
   * Cleans a phone number and builds a WhatsApp link
   * @param {string} phone - The phone number
   * @param {string} message - The message to pre-fill
   * @returns {string} - The WhatsApp URL
   */
  const buildWhatsAppLink = (phone, message = '') => {
    if (!phone) return `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Strip all non-digits except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove leading 0 if present (common in some formats after country code)
    // Or if it starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }
    
    return `https://wa.me/${cleaned.replace('+', '')}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = (phone, message = '') => {
    const link = buildWhatsAppLink(phone, message);
    if (link) {
      window.open(link, '_blank');
    }
  };

  return {
    buildWhatsAppLink,
    openWhatsApp,
    MESSAGES
  };
};
