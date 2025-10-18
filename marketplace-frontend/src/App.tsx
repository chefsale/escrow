import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import QRCode from 'qrcode';
import './App.css';

// Contract ABI
import MarketplaceEscrowABI from './contracts/MarketplaceEscrow.json';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Deployed contract address

interface EscrowPayment {
  buyer: string;
  seller: string;
  amount: string;
  itemDescription: string;
  createdAt: number;
  releaseTime: number;
  isReleased: boolean;
  isRefunded: boolean;
  isBlocked: boolean;
  blockReason: string;
  qrCodeData: string | null;
  qrCodeGenerated: boolean;
  escrowId: number;
}

function App() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<any>(null);
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Switch to Hardhat local network
  const switchToHardhatNetwork = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7A69', // 31337 in hex
            chainName: 'Hardhat Local',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18
            }
          }]
        });
      }
    } catch (err: any) {
      console.error('Failed to add network:', err);
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check if we're on the correct network (Hardhat local)
        const chainId = await web3Instance.eth.getChainId();
        if (Number(chainId) !== 31337) {
          setError('Please switch to Hardhat local network (Chain ID: 31337). Click "Add Network" to add it to MetaMask.');
          return;
        }
        
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        setWeb3(web3Instance);
        
        // Initialize contract
        const contractInstance = new web3Instance.eth.Contract(
          MarketplaceEscrowABI.abi,
          CONTRACT_ADDRESS
        );
        setContract(contractInstance);
        
        setError('');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err: any) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  // Disconnect from MetaMask
  const disconnectWallet = async () => {
    try {
      // Clear local state
      setAccount('');
      setWeb3(null);
      setContract(null);
      setEscrowPayments([]);
      setError('');
      
      // Try to disconnect from MetaMask (if supported)
      if (window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      // Even if MetaMask disconnect fails, we still clear local state
    }
  };

  // Create escrow payment
  const createEscrowPayment = async (sellerAddress: string, itemDescription: string, amount: string) => {
    if (!contract || !web3) return;
    
    setLoading(true);
    try {
      const weiAmount = web3.utils.toWei(amount, 'ether');
      await contract.methods.createEscrowPayment(sellerAddress, itemDescription)
        .send({ from: account, value: weiAmount });
      
      // Refresh escrow payments
      await loadEscrowPayments();
    } catch (err: any) {
      setError('Failed to create escrow payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load escrow payments
  const loadEscrowPayments = useCallback(async () => {
    if (!contract) return;
    
    try {
      const nextEscrowId = await contract.methods.nextEscrowId().call();
      const payments: EscrowPayment[] = [];
      
      for (let i = 1; i < nextEscrowId; i++) {
        const payment = await contract.methods.getEscrowPayment(i).call();
        
        // Generate QR code for this payment
        let qrCodeImage = null;
        try {
          // Generate QR code data on the frontend
          const qrData = `Marketplace Escrow Payment
ID: ${i}
Buyer: ${payment.buyer}
Seller: ${payment.seller}
Amount: ${web3?.utils.fromWei(payment.amount, 'ether') || '0'} ETH
Item: ${payment.itemDescription}
Created: ${new Date(parseInt(payment.createdAt) * 1000).toLocaleString()}
Status: ${payment.isReleased ? 'Released' : payment.isRefunded ? 'Refunded' : payment.isBlocked ? 'Blocked' : 'Active'}

Verify at: https://marketplace-escrow.vercel.app/verify/${i}
Contract: ${CONTRACT_ADDRESS}
Network: Hardhat Local (Chain ID: 31337)`;
          qrCodeImage = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (err) {
          console.error('Error generating QR code for payment', i, err);
        }
        
        payments.push({
          buyer: payment.buyer,
          seller: payment.seller,
          amount: web3?.utils.fromWei(payment.amount, 'ether') || '0',
          itemDescription: payment.itemDescription,
          createdAt: parseInt(payment.createdAt),
          releaseTime: parseInt(payment.releaseTime),
          isReleased: payment.isReleased,
          isRefunded: payment.isRefunded,
          isBlocked: payment.isBlocked,
          blockReason: payment.blockReason,
          qrCodeData: qrCodeImage,
          qrCodeGenerated: payment.qrCodeGenerated,
          escrowId: i
        });
      }
      
      setEscrowPayments(payments);
    } catch (err: any) {
      setError('Failed to load escrow payments: ' + err.message);
    }
  }, [contract, web3]);

  // Generate and store QR code in contract
  const generateAndStoreQRCode = async (escrowId: number) => {
    try {
      if (!contract || !account) return;
      
      // Generate QR code data
      const payment = await contract.methods.getEscrowPayment(escrowId).call();
      const qrData = `Marketplace Escrow Payment
ID: ${escrowId}
Buyer: ${payment.buyer}
Seller: ${payment.seller}
Amount: ${web3?.utils.fromWei(payment.amount, 'ether') || '0'} ETH
Item: ${payment.itemDescription}
Created: ${new Date(parseInt(payment.createdAt) * 1000).toLocaleString()}
Status: ${payment.isReleased ? 'Released' : payment.isRefunded ? 'Refunded' : payment.isBlocked ? 'Blocked' : 'Active'}

Verify at: https://marketplace-escrow.vercel.app/verify/${escrowId}
Contract: ${CONTRACT_ADDRESS}
Network: Hardhat Local (Chain ID: 31337)`;
      
      // Store QR code data in contract
      await contract.methods.generateQRCode(escrowId, qrData).send({ from: account });
      
      // Reload payments to show updated QR code
      await loadEscrowPayments();
      
      alert('QR code generated and stored successfully!');
    } catch (err: any) {
      console.error('Error generating and storing QR code:', err);
      alert('Error generating QR code: ' + (err.message || err));
    }
  };

  // Release payment
  const releasePayment = async (escrowId: number) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      await contract.methods.releasePayment(escrowId).send({ from: account });
      await loadEscrowPayments();
    } catch (err: any) {
      setError('Failed to release payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refund payment
  const refundPayment = async (escrowId: number) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      await contract.methods.refundPayment(escrowId).send({ from: account });
      await loadEscrowPayments();
    } catch (err: any) {
      setError('Failed to refund payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      loadEscrowPayments();
    }
  }, [contract, loadEscrowPayments]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Marketplace Escrow System</h1>
        <p>Secure payments for Base network marketplace</p>
        
        {!account ? (
          <div className="wallet-actions">
            <button onClick={connectWallet} className="connect-button">
              Connect MetaMask
            </button>
            <button onClick={switchToHardhatNetwork} className="network-button">
              Add Hardhat Network
            </button>
          </div>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account}</p>
            <p>Network: Hardhat Local (Chain ID: 31337)</p>
            <button onClick={disconnectWallet}>Disconnect</button>
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
      </header>

      <main className="App-main">
        {account && contract && (
          <div className="escrow-interface">
            <CreateEscrowForm onCreateEscrow={createEscrowPayment} loading={loading} />
            <EscrowPaymentsList 
              payments={escrowPayments}
              onRelease={releasePayment}
              onRefund={refundPayment}
              onGenerateQRCode={generateAndStoreQRCode}
              currentAccount={account}
              loading={loading}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// Create Escrow Form Component
interface CreateEscrowFormProps {
  onCreateEscrow: (seller: string, item: string, amount: string) => void;
  loading: boolean;
}

const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({ onCreateEscrow, loading }) => {
  const [sellerAddress, setSellerAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellerAddress && itemDescription && amount) {
      onCreateEscrow(sellerAddress, itemDescription, amount);
      setSellerAddress('');
      setItemDescription('');
      setAmount('');
    }
  };

  return (
    <div className="create-escrow-form">
      <h2>Create Escrow Payment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Seller Address:</label>
          <input
            type="text"
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <div className="form-group">
          <label>Item Description:</label>
          <input
            type="text"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Describe the item..."
            required
          />
        </div>
        
        <div className="form-group">
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
    </div>
  );
};

// Escrow Payments List Component
interface EscrowPaymentsListProps {
  payments: EscrowPayment[];
  onRelease: (id: number) => void;
  onRefund: (id: number) => void;
  onGenerateQRCode: (id: number) => void;
  currentAccount: string;
  loading: boolean;
}

const EscrowPaymentsList: React.FC<EscrowPaymentsListProps> = ({ 
  payments, 
  onRelease, 
  onRefund, 
  onGenerateQRCode,
  currentAccount,
  loading 
}) => {
  return (
    <div className="escrow-payments-list">
      <h2>Escrow Payments</h2>
      {payments.length === 0 ? (
        <p>No escrow payments found.</p>
      ) : (
        <div className="payments-grid">
          {payments.map((payment, index) => (
            <div key={index} className="payment-card">
              <h3>Escrow #{index + 1}</h3>
              <p><strong>Item:</strong> {payment.itemDescription}</p>
              <p><strong>Amount:</strong> {payment.amount} ETH</p>
              <p><strong>Buyer:</strong> {payment.buyer}</p>
              <p><strong>Seller:</strong> {payment.seller}</p>
              <p><strong>Status:</strong> {
                payment.isReleased ? 'Released' :
                payment.isRefunded ? 'Refunded' :
                payment.isBlocked ? 'Blocked' : 'Active'
              }</p>
              
              {payment.isBlocked && (
                <p><strong>Block Reason:</strong> {payment.blockReason}</p>
              )}
              
              <p><strong>Created:</strong> {new Date(payment.createdAt * 1000).toLocaleString()}</p>
              <p><strong>Release Time:</strong> {new Date(payment.releaseTime * 1000).toLocaleString()}</p>
              
              {/* QR Code Display */}
              {payment.qrCodeData && (
                <div className="qr-code-section">
                  <h4>📱 QR Code for Payment Verification</h4>
                  <img 
                    src={payment.qrCodeData} 
                    alt="QR Code for escrow payment" 
                    className="qr-code-image"
                  />
                  <p className="qr-code-note">
                    <strong>Scan this QR code to:</strong><br/>
                    • View payment details<br/>
                    • Verify transaction status<br/>
                    • Access verification link
                  </p>
                </div>
              )}
              
              <div className="payment-actions">
                {!payment.isReleased && !payment.isRefunded && !payment.isBlocked && (
                  <>
                    {payment.buyer.toLowerCase() === currentAccount.toLowerCase() && (
                      <button 
                        onClick={() => onRelease(index + 1)}
                        disabled={loading}
                        className="release-button"
                      >
                        Release Payment
                      </button>
                    )}
                    {payment.buyer.toLowerCase() === currentAccount.toLowerCase() && (
                      <button 
                        onClick={() => onRefund(index + 1)}
                        disabled={loading}
                        className="refund-button"
                      >
                        Refund Payment
                      </button>
                    )}
                    {(payment.buyer.toLowerCase() === currentAccount.toLowerCase() || 
                      payment.seller.toLowerCase() === currentAccount.toLowerCase()) && (
                      <button 
                        onClick={() => onGenerateQRCode(index + 1)}
                        disabled={loading}
                        className="qr-button"
                      >
                        Generate QR Code
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;