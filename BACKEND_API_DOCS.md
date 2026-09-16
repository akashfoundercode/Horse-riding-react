# 🏇 DERBY CASINO ARENA — ENTERPRISE BACKEND INTEGRATION SPECIFICATION

> **Version**: 1.0.0  
> **Target Audience**: Backend Developers, Casino Platform Operators, iGaming Aggregators  
> **Protocol**: REST (JSON) + Optional WebSocket (WSS)  
> **Auth Scheme**: Bearer JWT Authorization  

---

## 📌 Executive Architecture Summary

This frontend client is built with an **Enterprise Service-Oriented Architecture (SOA)**. It communicates with backend systems via unified services:
- **`src/services/authService.js`**: Player authentication, guest onboarding, token lifecycle.
- **`src/services/walletService.js`**: Real-time balance debit/credit, bet settlement, transaction ledger.
- **`src/services/gameApiService.js`**: Multi-runner round management, bet slips, result validation.
- **`src/api/apiClient.js`**: Centralized HTTP client with automatic JWT header injection, timeout handling, and smart fallback.

---

## ⚙️ Environment Configuration

In your frontend root, configure `.env`:

```env
# REST API Base URL
VITE_API_BASE_URL=https://api.yourcasinoplatform.com/v1

# Real-time WebSocket Server (Optional)
VITE_WS_URL=wss://api.yourcasinoplatform.com/ws

# Switch between Live API and Offline Standalone Simulation
VITE_USE_MOCK_API=false

# Operator & Currency Identification
VITE_OPERATOR_ID=operator_01
VITE_CURRENCY=COINS
```

---

## 🔐 1. Authentication Endpoints

### 1.1 User Login
* **Endpoint**: `POST /auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "player@example.com",
  "password": "SecurePassword123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_98a7sd8f7as6d8f",
    "user": {
      "id": "usr_9901",
      "username": "ChampionJockey",
      "email": "player@example.com",
      "phone": "+919876543210",
      "vipLevel": 2,
      "avatar": "/Bet_horses/horses7.png"
    },
    "wallet": {
      "balance": 25400,
      "currency": "COINS"
    }
  }
}
```

---

### 1.2 User Registration
* **Endpoint**: `POST /auth/register`
* **Request Body**:
```json
{
  "username": "LuckyRider7",
  "identifier": "newplayer@example.com",
  "password": "SecretPassword123"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "usr_9902",
      "username": "LuckyRider7",
      "vipLevel": 1
    },
    "wallet": {
      "balance": 10000,
      "currency": "COINS"
    }
  },
  "message": "Account registered with 10,000 welcome coins"
}
```

---

### 1.3 Instant 1-Click Guest Login
* **Endpoint**: `POST /auth/guest`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_guest_session_8819",
    "user": {
      "id": "guest_8819",
      "username": "Guest Jockey #8819",
      "isGuest": true,
      "vipLevel": 1
    },
    "wallet": {
      "balance": 10000,
      "currency": "COINS"
    }
  }
}
```

---

## 💰 2. Wallet & Financial Endpoints

### 2.1 Get Balance
* **Endpoint**: `GET /wallet/balance`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "balance": 15200.50,
    "currency": "COINS"
  }
}
```

---

### 2.2 Place Bet (Debit Wallet)
* **Endpoint**: `POST /game/derby/bet/place`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
```json
{
  "roundId": "RD_982312",
  "totalAmount": 500,
  "bets": {
    "7": 300,
    "4": 200
  }
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "balance": 14700.50,
    "transaction": {
      "id": "tx_bet_8819",
      "type": "bet",
      "amount": -500,
      "balanceAfter": 14700.50,
      "time": "04:30 PM",
      "timestamp": 1757892900000
    }
  }
}
```

---

### 2.3 Settle Round & Payout (Credit Wallet)
* **Endpoint**: `POST /game/derby/round/settle`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
```json
{
  "roundId": "RD_982312",
  "winningHorseNumber": 7,
  "winningHorseName": "LUCKY",
  "winningBetAmount": 300,
  "payoutMultiplier": 10
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "balance": 17700.50,
    "winnings": 3000,
    "transaction": {
      "id": "tx_win_9912",
      "type": "payout",
      "amount": 3000,
      "balanceAfter": 17700.50,
      "note": "Won 10X on Horse #7 LUCKY",
      "time": "04:31 PM",
      "timestamp": 1757892960000
    }
  }
}
```

---

### 2.4 Transaction History Ledger
* **Endpoint**: `GET /wallet/transactions?limit=50`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_win_9912",
        "type": "payout",
        "amount": 3000,
        "balanceAfter": 17700.50,
        "note": "Won 10X on Horse #7 LUCKY",
        "time": "04:31 PM"
      },
      {
        "id": "tx_bet_8819",
        "type": "bet",
        "amount": -500,
        "balanceAfter": 14700.50,
        "note": "Race Bet (Round #RD_982312)",
        "time": "04:30 PM"
      }
    ],
    "total": 2
  }
}
```

---

## ⚡ 3. Real-Time WebSocket Protocol (Optional)

Connect to `wss://api.yourcasinoplatform.com/ws?token=<TOKEN>`

### Client Incoming Messages:
1. **`ROUND_STATUS`**: Syncs countdown timer and betting status:
```json
{
  "type": "ROUND_STATUS",
  "payload": {
    "roundId": "RD_982313",
    "phase": "BETTING",
    "timerSeconds": 40
  }
}
```
2. **`ROUND_RESULT`**: Broadcasts official server-side winner:
```json
{
  "type": "ROUND_RESULT",
  "payload": {
    "roundId": "RD_982313",
    "winnerNumber": 7,
    "winnerName": "LUCKY"
  }
}
```

---

## 🛡️ Standalone Demo & Offline Guarantee

The codebase includes an intelligent **Mock Adapter (`src/api/mockAdapter.js`)**.  
If `VITE_USE_MOCK_API=true` or if the backend server experiences downtime:
1. The game seamlessly runs offline without crashing.
2. Players receive simulated JWT authentication, wallet balance, betting debit, 10X winnings, and full local persistence.
3. Once the live API is deployed, flipping `VITE_USE_MOCK_API=false` switches to live production traffic instantaneously.

