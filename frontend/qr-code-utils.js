// QR Code utilities for frontend integration
// This file provides helper functions for generating and displaying QR codes

import QRCode from 'qrcode'; // You'll need to install: npm install qrcode

/**
 * Generate QR code for escrow confirmation
 * @param {Object} escrowData - Escrow payment data
 * @param {string} escrowData.escrowId - Escrow ID
 * @param {string} escrowData.buyer - Buyer address
 * @param {string} escrowData.seller - Seller address
 * @param {string} escrowData.amount - Amount in ETH
 * @param {string} escrowData.itemDescription - Item description
 * @returns {Promise<string>} QR code data URL
 */
export async function generateQRCodeImage(escrowData) {
  try {
    const qrData = {
      escrowId: escrowData.escrowId,
      buyer: escrowData.buyer,
      seller: escrowData.seller,
      amount: escrowData.amount,
      itemDescription: escrowData.itemDescription,
      timestamp: Date.now(),
      confirmationCode: generateConfirmationCode(escrowData.escrowId, escrowData.buyer, escrowData.seller)
    };

    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate confirmation code for escrow
 * @param {string} escrowId - Escrow ID
 * @param {string} buyer - Buyer address
 * @param {string} seller - Seller address
 * @returns {string} Confirmation code
 */
export function generateConfirmationCode(escrowId, buyer, seller) {
  const data = `${escrowId}-${buyer}-${seller}-ESCROW_CONFIRM`;
  const hash = btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return hash.toUpperCase();
}

/**
 * Display QR code in a modal or popup
 * @param {string} qrCodeDataURL - QR code data URL
 * @param {string} title - Modal title
 */
export function displayQRCodeModal(qrCodeDataURL, title = 'Escrow Confirmation QR Code') {
  // Create modal element
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
    width: 90%;
  `;

  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.marginBottom = '20px';

  const qrImage = document.createElement('img');
  qrImage.src = qrCodeDataURL;
  qrImage.style.cssText = `
    max-width: 100%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  `;

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };

  modalContent.appendChild(titleElement);
  modalContent.appendChild(qrImage);
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

/**
 * Download QR code as image
 * @param {string} qrCodeDataURL - QR code data URL
 * @param {string} filename - Filename for download
 */
export function downloadQRCode(qrCodeDataURL, filename = 'escrow-qr-code.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = qrCodeDataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate QR code data
 * @param {string} qrCodeString - QR code string to validate
 * @returns {Object} Validation result
 */
export function validateQRCodeData(qrCodeString) {
  try {
    const data = JSON.parse(qrCodeString);
    
    const requiredFields = ['escrowId', 'buyer', 'seller', 'amount', 'itemDescription', 'confirmationCode'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate addresses
    if (!isValidAddress(data.buyer) || !isValidAddress(data.seller)) {
      return {
        valid: false,
        error: 'Invalid buyer or seller address'
      };
    }

    // Validate amount
    if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      return {
        valid: false,
        error: 'Invalid amount'
      };
    }

    return {
      valid: true,
      data: data
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON format'
    };
  }
}

/**
 * Check if address is valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format escrow data for display
 * @param {Object} escrowData - Escrow data
 * @returns {Object} Formatted data
 */
export function formatEscrowData(escrowData) {
  return {
    escrowId: escrowData.escrowId,
    buyer: escrowData.buyer,
    seller: escrowData.seller,
    amount: parseFloat(escrowData.amount).toFixed(4) + ' ETH',
    itemDescription: escrowData.itemDescription,
    timestamp: new Date(escrowData.timestamp).toLocaleString(),
    confirmationCode: escrowData.confirmationCode
  };
}

/**
 * Generate QR code for mobile app scanning
 * @param {Object} escrowData - Escrow data
 * @returns {Promise<string>} QR code data URL
 */
export async function generateMobileQRCode(escrowData) {
  // Generate a simpler QR code for mobile scanning
  const mobileData = {
    type: 'escrow_confirmation',
    escrowId: escrowData.escrowId,
    confirmationCode: generateConfirmationCode(escrowData.escrowId, escrowData.buyer, escrowData.seller),
    timestamp: Date.now()
  };

  const qrString = JSON.stringify(mobileData);
  return await QRCode.toDataURL(qrString, {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

// React hook for QR code generation
export const useQRCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQRCode = async (escrowData) => {
    setLoading(true);
    setError(null);
    
    try {
      const qrCodeDataURL = await generateQRCodeImage(escrowData);
      return qrCodeDataURL;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateQRCode, loading, error };
};

export default {
  generateQRCodeImage,
  generateConfirmationCode,
  displayQRCodeModal,
  downloadQRCode,
  validateQRCodeData,
  formatEscrowData,
  generateMobileQRCode,
  useQRCode
};
