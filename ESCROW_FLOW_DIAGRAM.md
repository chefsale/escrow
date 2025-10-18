# Marketplace Escrow System Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MARKETPLACE ESCROW SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Smart Contract: MarketplaceEscrow.sol                                         │
│  Network: Base (Ethereum L2)                                                   │
│  Features: QR Code Confirmation, 3-Day Auto-Release, Admin Controls            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Main Actors

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   BUYER     │    │   SELLER    │    │   ADMIN     │    │  PLATFORM  │
│             │    │             │    │             │    │   WALLET    │
│ - Creates   │    │ - Receives  │    │ - Blocks    │    │ - Receives  │
│   escrow    │    │   payment   │    │   payments  │    │   fees      │
│ - Pays ETH  │    │ - Confirms  │    │ - Unblocks  │    │ - Platform  │
│ - Confirms  │    │   delivery  │    │   payments  │    │   revenue   │
│   receipt   │    │ - Generates │    │ - Emergency │    │             │
│ - Releases  │    │   QR codes  │    │   controls  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Complete Escrow Flow

### Phase 1: Payment Creation
```
1. BUYER creates escrow payment
   ┌─────────────────┐
   │ createEscrowPayment() │
   │ - Seller address      │
   │ - Item description    │
   │ - ETH amount          │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Payment held in │
   │ escrow contract │
   │ (3-day timer    │
   │  starts)        │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Event:          │
   │ PaymentDeposited│
   └─────────────────┘
```

### Phase 2: QR Code Generation
```
2. SELLER/BUYER generates QR code
   ┌─────────────────┐
   │ generateQRCode() │
   │ - Escrow ID      │
   │ - QR data        │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ QR Code Data:   │
   │ {               │
   │   "escrowId": 1,│
   │   "buyer": "0x.."│
   │   "seller": "0x."│
   │   "amount": "1.5"│
   │   "item": "iPhone"│
   │   "confirmationCode": "ABC123"│
   │ }               │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Event:          │
   │ QRCodeGenerated │
   └─────────────────┘
```

### Phase 3: Item Delivery & Confirmation
```
3. ITEM DELIVERY PROCESS
   ┌─────────────────┐
   │ Seller ships    │
   │ item to buyer   │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Buyer scans QR  │
   │ code to confirm │
   │ item received   │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Buyer releases  │
   │ payment         │
   └─────────────────┘
```

### Phase 4: Payment Release
```
4. PAYMENT RELEASE OPTIONS

   Option A: Immediate Release (by Buyer)
   ┌─────────────────┐
   │ releasePayment()│
   │ (Buyer calls)   │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Payment split:  │
   │ - Seller: 97.5% │
   │ - Platform: 2.5%│
   └─────────────────┘

   Option B: Auto-Release (after 3 days)
   ┌─────────────────┐
   │ 3 days pass     │
   │ Anyone can call │
   │ releasePayment()│
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Same payment    │
   │ split as above  │
   └─────────────────┘

   Option C: Refund (before 3 days)
   ┌─────────────────┐
   │ refundPayment() │
   │ (Buyer only)    │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Full amount     │
   │ returned to     │
   │ buyer           │
   └─────────────────┘
```

## Admin Controls Flow

```
5. ADMIN DISPUTE RESOLUTION
   ┌─────────────────┐
   │ Admin detects   │
   │ issue/problem   │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ blockPayment()  │
   │ - Escrow ID     │
   │ - Reason        │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Payment blocked │
   │ (cannot release │
   │  or refund)     │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ Admin resolves  │
   │ dispute         │
   └─────────────────┘
           │
           ▼
   ┌─────────────────┐
   │ forceReleasePayment() │
   │ OR unblockPayment()   │
   └─────────────────┘
```

## Contract State Machine

```
┌─────────────┐
│   CREATED   │ ← createEscrowPayment()
└─────────────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ ← QR code generated
│ (3-day timer│
│  running)   │
└─────────────┘
       │
       ├─ releasePayment() ──► ┌─────────────┐
       │                       │  RELEASED   │
       │                       └─────────────┘
       │
       ├─ refundPayment() ────► ┌─────────────┐
       │                       │  REFUNDED   │
       │                       └─────────────┘
       │
       └─ blockPayment() ─────► ┌─────────────┐
                                │   BLOCKED   │
                                └─────────────┘
                                      │
                                      ▼
                                ┌─────────────┐
                                │  RELEASED   │ ← forceReleasePayment()
                                └─────────────┘
```

## Security Features

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. ReentrancyGuard    │ Prevents reentrancy attacks            │
│ 2. Ownable           │ Admin access control                    │
│ 3. Pausable          │ Emergency pause functionality           │
│ 4. Input Validation  │ All inputs validated                    │
│ 5. Event Logging     │ Full transparency via events            │
│ 6. Time Locks        │ 3-day release mechanism                 │
│ 7. Fee Controls      │ Configurable platform fees              │
└─────────────────────────────────────────────────────────────────┘
```

## Gas Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BUYER         │    │   CONTRACT      │    │   SELLER        │
│                 │    │                 │    │                 │
│ Pays: 1.0 ETH   │───►│ Holds: 1.0 ETH  │───►│ Receives:       │
│                 │    │                 │    │ 0.975 ETH       │
│                 │    │                 │    │ (97.5%)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  PLATFORM       │
                       │  WALLET         │
                       │                 │
                       │ Receives:       │
                       │ 0.025 ETH       │
                       │ (2.5%)          │
                       └─────────────────┘
```

## Event Timeline

```
Time 0:    PaymentDeposited
Time 0:    QRCodeGenerated (optional)
Time 0-3d: releasePayment() (buyer can call anytime)
Time 0-3d: refundPayment() (buyer can call before 3 days)
Time 3d:   releasePayment() (anyone can call after 3 days)
Any time:  blockPayment() (admin only)
Any time:  forceReleasePayment() (admin only)
```

## Frontend Integration Points

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REACT APP     │    │   WALLET        │    │   SMART         │
│                 │    │   CONNECTION    │    │   CONTRACT      │
│ - Create escrow │◄──►│ - MetaMask      │◄──►│ - Base Network  │
│ - Generate QR   │    │ - WalletConnect │    │ - Escrow logic  │
│ - Release funds │    │ - Coinbase      │    │ - Event listening│
│ - Monitor status│    │ - Other wallets │    │ - Gas estimation│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Error Handling

```
┌─────────────────┐
│   ERROR TYPES   │
├─────────────────┤
│ • Insufficient  │
│   funds         │
│ • Invalid       │
│   addresses     │
│ • Payment       │
│   already       │
│   processed     │
│ • Unauthorized  │
│   access        │
│ • Contract      │
│   paused        │
│ • Gas issues    │
└─────────────────┘
```

This diagram shows the complete flow of the marketplace escrow system, from payment creation to final settlement, including all the security features and admin controls.
