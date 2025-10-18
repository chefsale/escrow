// Frontend integration example for MarketplaceEscrow contract
// This file shows how to interact with the escrow contract from a web application

import { ethers } from 'ethers';

class MarketplaceEscrowIntegration {
  constructor(contractAddress, provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.contract = null;
    this.signer = null;
  }

  // Initialize the contract with a signer
  async initialize(signer) {
    this.signer = signer;
    
    // Contract ABI (you would get this from the compiled contract)
    const contractABI = [
      // ... ABI would go here - truncated for brevity
      "function createEscrowPayment(address _seller, string memory _itemDescription) external payable",
      "function generateQRCode(uint256 _escrowId, string memory _qrCodeData) external",
      "function releasePayment(uint256 _escrowId) external",
      "function refundPayment(uint256 _escrowId) external",
      "function getEscrowPayment(uint256 _escrowId) external view returns (tuple(address buyer, address seller, uint256 amount, string itemDescription, uint256 createdAt, uint256 releaseTime, bool isReleased, bool isRefunded, bool isBlocked, string blockReason, string qrCodeData, bool qrCodeGenerated))",
      "event PaymentDeposited(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, string itemDescription)",
      "event QRCodeGenerated(uint256 indexed escrowId, string qrCodeData)",
      "event PaymentReleased(uint256 indexed escrowId, address indexed seller, uint256 amount)"
    ];

    this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
  }

  // Create a new escrow payment
  async createEscrowPayment(sellerAddress, itemDescription, amountInEth) {
    try {
      const amount = ethers.utils.parseEther(amountInEth.toString());
      
      const tx = await this.contract.createEscrowPayment(sellerAddress, itemDescription, {
        value: amount
      });

      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Get the escrow ID from the event
      const event = receipt.events.find(e => e.event === 'PaymentDeposited');
      const escrowId = event.args.escrowId;

      return {
        success: true,
        escrowId: escrowId.toString(),
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error creating escrow payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate QR code for item receipt confirmation
  async generateQRCode(escrowId, qrCodeData) {
    try {
      const tx = await this.contract.generateQRCode(escrowId, qrCodeData);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Release payment to seller
  async releasePayment(escrowId) {
    try {
      const tx = await this.contract.releasePayment(escrowId);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error releasing payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment to buyer
  async refundPayment(escrowId) {
    try {
      const tx = await this.contract.refundPayment(escrowId);
      await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get escrow payment details
  async getEscrowPayment(escrowId) {
    try {
      const payment = await this.contract.getEscrowPayment(escrowId);
      
      return {
        success: true,
        data: {
          buyer: payment.buyer,
          seller: payment.seller,
          amount: ethers.utils.formatEther(payment.amount),
          itemDescription: payment.itemDescription,
          createdAt: new Date(payment.createdAt * 1000),
          releaseTime: new Date(payment.releaseTime * 1000),
          isReleased: payment.isReleased,
          isRefunded: payment.isRefunded,
          isBlocked: payment.isBlocked,
          blockReason: payment.blockReason,
          qrCodeData: payment.qrCodeData,
          qrCodeGenerated: payment.qrCodeGenerated
        }
      };
    } catch (error) {
      console.error('Error getting escrow payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate QR code data for frontend display
  generateQRCodeData(escrowId, buyer, seller, amount, itemDescription) {
    const qrData = {
      escrowId: escrowId,
      buyer: buyer,
      seller: seller,
      amount: amount,
      itemDescription: itemDescription,
      timestamp: Date.now(),
      confirmationCode: this.generateConfirmationCode(escrowId, buyer, seller)
    };

    return JSON.stringify(qrData);
  }

  // Generate confirmation code
  generateConfirmationCode(escrowId, buyer, seller) {
    const data = `${escrowId}-${buyer}-${seller}-ESCROW_CONFIRM`;
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
    return hash.substring(2, 10); // Take first 8 characters
  }

  // Listen for contract events
  setupEventListeners() {
    // Listen for new payments
    this.contract.on('PaymentDeposited', (escrowId, buyer, seller, amount, itemDescription) => {
      console.log('New payment deposited:', {
        escrowId: escrowId.toString(),
        buyer,
        seller,
        amount: ethers.utils.formatEther(amount),
        itemDescription
      });
    });

    // Listen for QR code generation
    this.contract.on('QRCodeGenerated', (escrowId, qrCodeData) => {
      console.log('QR code generated for escrow:', escrowId.toString());
    });

    // Listen for payment releases
    this.contract.on('PaymentReleased', (escrowId, seller, amount) => {
      console.log('Payment released:', {
        escrowId: escrowId.toString(),
        seller,
        amount: ethers.utils.formatEther(amount)
      });
    });
  }

  // Remove event listeners
  removeEventListeners() {
    this.contract.removeAllListeners();
  }
}

// Example usage in a React component
export const useEscrowContract = (contractAddress) => {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeEscrow = async () => {
      try {
        setLoading(true);
        
        // Connect to MetaMask or other wallet
        if (window.ethereum) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          const escrowIntegration = new MarketplaceEscrowIntegration(contractAddress, provider);
          await escrowIntegration.initialize(signer);
          
          setEscrow(escrowIntegration);
          setError(null);
        } else {
          throw new Error('MetaMask not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeEscrow();
  }, [contractAddress]);

  return { escrow, loading, error };
};

// Example React component for creating escrow payments
export const CreateEscrowPayment = ({ escrow, onPaymentCreated }) => {
  const [sellerAddress, setSellerAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!escrow) return;

    setLoading(true);
    try {
      const result = await escrow.createEscrowPayment(
        sellerAddress,
        itemDescription,
        parseFloat(amount)
      );

      if (result.success) {
        onPaymentCreated(result.escrowId);
        setSellerAddress('');
        setItemDescription('');
        setAmount('');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Seller Address:</label>
        <input
          type="text"
          value={sellerAddress}
          onChange={(e) => setSellerAddress(e.target.value)}
          placeholder="0x..."
          required
        />
      </div>
      
      <div>
        <label>Item Description:</label>
        <input
          type="text"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Describe the item..."
          required
        />
      </div>
      
      <div>
        <label>Amount (ETH):</label>
        <input
          type="number"
          step="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.1"
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Escrow Payment'}
      </button>
    </form>
  );
};

export default MarketplaceEscrowIntegration;
