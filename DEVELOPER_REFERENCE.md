# 📚 AffTok Developer Reference
## Complete Documentation - December 2024

---

# Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Quick Start](#quick-start)
4. [Tracking Flow](#tracking-flow)
5. [Smart Routing](#smart-routing)
6. [API Reference](#api-reference)
   - [Authentication](#authentication)
   - [Offers API](#offers-api)
   - [Postbacks API](#postbacks-api)
   - [Stats API](#stats-api)
7. [Conversion Tracking System](#conversion-tracking-system)
8. [SDKs](#sdks)
   - [Web SDK](#web-sdk)
   - [Flutter SDK](#flutter-sdk)
   - [Android SDK](#android-sdk)
   - [iOS SDK](#ios-sdk)
9. [Webhooks](#webhooks)
10. [Platform Integration](#platform-integration)
11. [Production URLs](#production-urls)

---

# Introduction

AffTok is an enterprise-grade affiliate tracking platform designed for high-performance, real-time tracking of clicks, conversions, and affiliate attribution. It operates as a **Two-Sided Marketplace** connecting promoters with advertisers.

## What is AffTok?

AffTok provides a complete tracking infrastructure for:

- **Promoters (مروّجين)** - Market offers, track performance, earn points, compete in leaderboards
- **Advertisers (معلنين)** - Create offers, manage campaigns, track promoter performance
- **Admins** - Full platform management, approval workflows, analytics

## Business Model

AffTok is **100% free** for both promoters and advertisers:
- No subscription fees
- No transaction fees
- Platform focuses on **tracking only**
- Companies pay promoters directly
- AffTok earns commission from companies

## Key Features

### 🚀 High-Performance Tracking
- Process millions of clicks per day
- Sub-50ms redirect latency
- Global CDN edge routing
- Zero-drop tracking guarantee

### 🔐 Enterprise Security
- HMAC-SHA256 signed tracking links
- API key authentication with rotation
- Rate limiting and fraud detection
- Geo-blocking and IP allowlisting
- Multi-tenant data isolation

### 📊 Real-Time Analytics
- Live click and conversion stats
- Daily/weekly/monthly breakdowns
- Offer-level and user-level metrics
- Fraud detection insights

### 🤖 AI Assistant
- Personal statistics dashboard
- Smart offer suggestions
- Performance analysis with recommendations
- Success tips and strategies
- Points & levels gamification
- BYOK (Bring Your Own Key) for advanced chat

### 👥 Teams & Contests
- Create and join teams
- Global leaderboard rankings
- Competitive contests with prizes
- Team-based challenges

### 🏢 Advertisers Portal
- Advertiser registration and onboarding
- Offer creation with approval workflow
- Performance analytics
- Promoter management

### 🔄 Flexible Integrations
- Native SDKs (Android, iOS, Flutter, React Native, Web)
- Server-to-server postback support
- Webhook delivery with retry logic
- RESTful API for all operations

## Platform Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        AffTok Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Mobile     │  │   Backend    │  │   Admin      │          │
│  │   App        │──│   (Go)       │──│   Panel      │          │
│  │  (Flutter)   │  │              │  │   (React)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   AI         │  │   Redis      │  │   PostgreSQL │          │
│  │   Assistant  │──│   Cache      │──│   Database   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Observability Layer                 │          │
│  │     (Logging, Metrics, Fraud Detection)          │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| Promoter | Markets offers using tracking links | Mobile App |
| Advertiser | Creates and manages offers | Mobile App |
| Admin | Platform administrator | Admin Panel |

---

# System Architecture

AffTok is built on a modern, scalable architecture designed for high-throughput tracking with enterprise-grade reliability.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │           Client Layer              │
                                    ├─────────────────────────────────────┤
                                    │  Mobile Apps │ Web │ Landing Pages  │
                                    │  (SDK)       │(SDK)│ (JS/Pixel)     │
                                    └───────────────┬─────────────────────┘
                                                    │
                                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              Edge Layer (CDN)                                 │
├───────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Cloudflare │  │   Fastly    │  │   Vercel    │  │   Custom    │          │
│  │   Worker    │  │   Compute   │  │   Edge      │  │   Edge      │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                │                  │
│         └────────────────┴────────────────┴────────────────┘                  │
│                                   │                                           │
│  Features:                        │                                           │
│  • Link Validation               │                                           │
│  • Bot Detection                 │                                           │
│  • Geo Validation                │                                           │
│  • Smart Routing                 │                                           │
│  • Instant Redirect              │                                           │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            API Gateway Layer                                  │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Rate Limiter   │  │  Auth Middleware│  │  Tenant Resolver│               │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘               │
│           │                    │                    │                         │
│           └────────────────────┴────────────────────┘                         │
│                                │                                              │
└────────────────────────────────┬──────────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Click     │  │  Conversion │  │   Stats     │  │   Admin     │          │
│  │   Handler   │  │   Handler   │  │   Handler   │  │   Handler   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                │                  │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐          │
│  │   Click     │  │  Postback   │  │  Analytics  │  │   Webhook   │          │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                │                  │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐          │
│  │   Link      │  │   Fraud     │  │   Geo Rule  │  │   API Key   │          │
│  │   Signing   │  │   Detection │  │   Service   │  │   Service   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             Data Layer                                        │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐            │
│  │         PostgreSQL          │  │           Redis             │            │
│  ├─────────────────────────────┤  ├─────────────────────────────┤            │
│  │ • Users                     │  │ • Session Cache             │            │
│  │ • Offers                    │  │ • Click Deduplication       │            │
│  │ • Clicks (Partitioned)      │  │ • Rate Limit Counters       │            │
│  │ • Conversions               │  │ • Stats Cache               │            │
│  │ • API Keys                  │  │ • Geo Rules Cache           │            │
│  │ • Geo Rules                 │  │ • Replay Protection         │            │
│  │ • Webhooks                  │  │ • Stream Queues             │            │
│  │ • Tenants                   │  │                             │            │
│  └─────────────────────────────┘  └─────────────────────────────┘            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Edge | Cloudflare Workers, TypeScript |
| Backend | Go 1.21+, Gin Framework |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| Message Queue | Redis Streams |
| Container | Docker, Kubernetes |
| CDN | Cloudflare, Fastly |

---

# Quick Start

## Step 1: Generate API Key

### Via Dashboard
1. Log in to AffTok Dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy and securely store your API key

### API Key Format
```
afftok_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
       │    │  └── 32-character random string
       │    └── Secret key indicator
       └── Environment (live/test)
```

## Step 2: Create Your First Offer

### Via API

```bash
curl -X POST https://go.afftokapp.com/api/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Offer",
    "description": "Test offer for integration",
    "destination_url": "https://example.com/landing",
    "payout": 5.00,
    "currency": "USD",
    "status": "active"
  }'
```

## Step 3: Join the Offer (Get Tracking Link)

```bash
curl -X POST https://go.afftokapp.com/api/offers/off_abc123def456/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_offer_id": "uo_xyz789",
    "offer_id": "off_abc123def456",
    "tracking_code": "abc123",
    "tracking_url": "https://go.afftokapp.com/c/abc123",
    "signed_link": "https://go.afftokapp.com/c/abc123.1699876543210.nonce123.sig456"
  }
}
```

## Step 4: Track Conversions

```bash
curl -X POST https://go.afftokapp.com/api/postback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: afftok_live_sk_xxxxx" \
  -d '{
    "api_key": "afftok_live_sk_xxxxx",
    "advertiser_id": "adv_123456",
    "offer_id": "off_abc123def456",
    "transaction_id": "txn_unique_123",
    "click_id": "clk_abc123",
    "amount": 49.99,
    "currency": "USD",
    "status": "approved"
  }'
```

---

# Tracking Flow

## Click → Conversion Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Complete Tracking Lifecycle                           │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  Click  │────▶│  Visit  │────▶│ Action  │────▶│Postback │────▶│Conversion│
  │  Event  │     │  Page   │     │ (Buy)   │     │  Sent   │     │ Recorded │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
       │               │               │               │               │
       ▼               ▼               ▼               ▼               ▼
  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ Click   │     │ Landing │     │ Checkout│     │ Server  │     │  Stats  │
  │ Tracked │     │  Page   │     │  Flow   │     │  Call   │     │ Updated │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Phase 1: Click Tracking

### Signed Tracking Link Structure
```
https://go.afftokapp.com/c/abc123.1699876543210.nonce123.signature456
                          │      │              │         │
                          │      │              │         └── HMAC Signature
                          │      │              └── Random Nonce
                          │      └── Timestamp (ms)
                          └── Tracking Code
```

### Click Event Structure
```json
{
  "click_id": "clk_abc123def456",
  "user_offer_id": "uo_xyz789",
  "offer_id": "off_123",
  "user_id": "usr_456",
  "tracking_code": "abc123",
  "timestamp": 1699876543210,
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...",
  "device": "mobile",
  "browser": "Safari",
  "os": "iOS",
  "country": "US",
  "city": "New York"
}
```

## Phase 2: Conversion Tracking

### Postback Request
```http
POST /api/postback HTTP/1.1
Host: go.afftokapp.com
Content-Type: application/json
X-API-Key: afftok_live_sk_xxxxxxxxxxxxx

{
  "api_key": "afftok_live_sk_xxxxxxxxxxxxx",
  "advertiser_id": "adv_123456",
  "offer_id": "off_123",
  "transaction_id": "txn_abc123def456",
  "click_id": "clk_abc123def456",
  "amount": 49.99,
  "currency": "USD",
  "status": "approved",
  "timestamp": 1699876600000,
  "nonce": "random32characterstring12345678",
  "signature": "hmac_sha256_signature_here"
}
```

## Timing Summary

| Phase | Typical Duration |
|-------|------------------|
| Edge validation | < 5ms |
| Redirect | < 20ms total |
| Click processing | < 50ms |
| User journey | Minutes to days |
| Postback processing | < 100ms |
| Stats update | < 10ms |
| Webhook delivery | < 500ms (first attempt) |

---

# Conversion Tracking System

## نظام التتبع المحكم (Robust Tracking System)

AffTok يدعم نظام تتبع متكامل يشمل:

### 1. E-commerce Platform Webhooks

#### Shopify Integration
```
POST /api/webhook/shopify/:advertiser_id
```

#### Salla Integration (سلة)
```
POST /api/webhook/salla/:advertiser_id
```

#### Zid Integration (زد)
```
POST /api/webhook/zid/:advertiser_id
```

### 2. Postback URL (للمواقع المخصصة)
```
GET/POST /api/postback?click_id={click_id}&amount={amount}&status=approved
```

أو:
```
POST /api/conversion/postback
```

### 3. Tracking Pixel (JavaScript)

للمعلنين الذين يريدون تضمين كود بسيط في صفحة "شكراً للشراء":

```html
<script src="https://go.afftokapp.com/pixel.js"></script>
<script>
  AffTokPixel.trackConversion({
    advertiser_id: 'ADV_ID',
    offer_id: 'OFFER_ID',
    amount: ORDER_TOTAL
  });
</script>
```

### كيف يعمل التتبع؟

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          تدفق التتبع الكامل                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. المستخدم يضغط على رابط المروج                                           │
│     ↓                                                                       │
│  2. يتم تسجيل النقرة + إنشاء click_id                                       │
│     ↓                                                                       │
│  3. يتم إضافة click_id للرابط وتخزينه في Cookie                             │
│     ↓                                                                       │
│  4. المستخدم يتصفح ويشتري                                                   │
│     ↓                                                                       │
│  5. عند الشراء: Webhook أو Pixel يرسل التحويل                               │
│     ↓                                                                       │
│  6. نربط التحويل بـ click_id = نعرف المروج                                  │
│     ↓                                                                       │
│  7. تحديث الإحصائيات والفواتير                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### شروط المعلنين المتوافقين

| المنصة | طريقة التكامل | الجاهزية |
|--------|---------------|----------|
| Shopify | Webhook | ✅ جاهز |
| Salla (سلة) | Webhook | ✅ جاهز |
| Zid (زد) | Webhook | ✅ جاهز |
| WooCommerce | Webhook/Plugin | ✅ جاهز |
| Custom Website | Pixel/Postback | ✅ جاهز |

---

# API Reference

## Authentication

### JWT Authentication

```bash
curl -X POST https://go.afftokapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### API Key Authentication

**Header Method:**
```bash
curl -X POST https://go.afftokapp.com/api/sdk/click \
  -H "Content-Type: application/json" \
  -H "X-API-Key: afftok_live_sk_xxxxx" \
  -d '{...}'
```

### Signature Generation

```javascript
const crypto = require('crypto');

function signRequest(apiKey, advertiserId) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const dataToSign = `${apiKey}|${advertiserId}|${timestamp}|${nonce}`;
  const signature = crypto.createHmac('sha256', apiKey).update(dataToSign).digest('hex');
  
  return { timestamp, nonce, signature };
}
```

### Rate Limits

| Authentication | Limit | Window |
|----------------|-------|--------|
| JWT Token | 1000 req | per minute |
| API Key (default) | 60 req | per minute |
| Per IP | 100 req | per minute |

---

## Offers API

### List Available Offers

```
GET /api/offers
```

### Get Offer Details

```
GET /api/offers/:id
```

### Join Offer

```
POST /api/offers/:id/join
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined offer",
  "data": {
    "user_offer_id": "uo_xyz789",
    "offer_id": "off_abc123def456",
    "tracking_code": "tc_a1b2c3d4e5f6",
    "short_link": "https://go.afftokapp.com/c/a1b2c3",
    "signed_link": "https://go.afftokapp.com/c/a1b2c3.1699876543000.n1o2n3c4e5.sig123abc",
    "tracking_url": "https://go.afftokapp.com/api/c/tc_a1b2c3d4e5f6"
  }
}
```

### Get My Offers

```
GET /api/offers/my
```

### Leave Offer

```
DELETE /api/offers/:id/leave
```

### Get Offer Stats

```
GET /api/offers/:id/stats
```

---

## Postbacks API

### Send Postback

```
POST /api/postback
```

**Request Body:**
```json
{
  "api_key": "afftok_live_sk_xxxxx",
  "advertiser_id": "adv_123456",
  "offer_id": "off_abc123",
  "transaction_id": "txn_unique_123456",
  "click_id": "clk_abc123def456",
  "amount": 49.99,
  "currency": "USD",
  "payout": 5.00,
  "status": "approved",
  "timestamp": 1699876600000,
  "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "signature": "hmac_sha256_signature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversion tracked successfully",
  "data": {
    "conversion_id": "conv_xyz789abc123",
    "offer_id": "off_abc123",
    "transaction_id": "txn_unique_123456",
    "amount": 49.99,
    "payout": 5.00,
    "status": "approved"
  }
}
```

### Postback URL Template

```
https://go.afftokapp.com/api/postback?api_key={api_key}&advertiser_id={advertiser_id}&offer_id={offer_id}&transaction_id={transaction_id}&click_id={click_id}&amount={amount}&status=approved
```

### Conversion Statuses

| Status | Description | Earnings Impact |
|--------|-------------|-----------------|
| `pending` | Awaiting approval | Not counted |
| `approved` | Confirmed conversion | Added to earnings |
| `rejected` | Declined/reversed | Not counted |

---

## Stats API

### Get User Stats

```
GET /api/stats/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "period": "month",
    "overview": {
      "total_clicks": 15000,
      "total_conversions": 300,
      "conversion_rate": 2.28,
      "total_earnings": 1425.00
    },
    "today": {
      "clicks": 520,
      "conversions": 12,
      "earnings": 60.00
    }
  }
}
```

### Get Daily Stats

```
GET /api/stats/daily?start_date=2024-01-01&end_date=2024-01-31
```

### Get Earnings Summary

```
GET /api/earnings/summary
```

---

# SDKs

## Web SDK

### Installation

```html
<script src="https://cdn.afftok.com/sdk/afftok.min.js"></script>
```

### Initialization

```javascript
Afftok.init({
  apiKey: 'afftok_live_sk_xxxxx',
  debug: true,
  enableOfflineQueue: true
});
```

### Track Click

```javascript
Afftok.trackClick('tc_abc123def456', {
  campaign: 'summer_sale',
  source: 'email'
});
```

### Track Conversion

```javascript
Afftok.trackConversion({
  offerId: 'off_xyz789',
  transactionId: 'order_12345',
  amount: 49.99,
  currency: 'USD'
});
```

---

## Flutter SDK

### Installation

```yaml
dependencies:
  afftok_sdk: ^1.0.0
```

### Initialization

```dart
import 'package:afftok_sdk/afftok_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Afftok.init(
    apiKey: 'afftok_live_sk_xxxxx',
    config: AfftokConfig(
      debug: kDebugMode,
      enableOfflineQueue: true
    ),
  );
  
  runApp(MyApp());
}
```

### Track Click

```dart
await Afftok.trackClick(
  trackingCode: 'tc_abc123def456',
  metadata: {
    'campaign': 'summer_sale',
    'source': 'push_notification'
  },
);
```

### Track Conversion

```dart
await Afftok.trackConversion(
  offerId: 'off_xyz789',
  transactionId: 'order_12345',
  amount: 49.99,
  currency: 'USD',
  status: ConversionStatus.approved
);
```

---

## Android SDK

### Installation

```kotlin
dependencies {
    implementation("com.afftok:sdk:1.0.0")
}
```

### Initialization

```kotlin
import com.afftok.Afftok
import com.afftok.AfftokConfig

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        Afftok.init(
            context = this,
            apiKey = "afftok_live_sk_xxxxx",
            config = AfftokConfig(
                debug = BuildConfig.DEBUG,
                enableOfflineQueue = true
            )
        )
    }
}
```

### Track Click

```kotlin
Afftok.trackClick(
    trackingCode = "tc_abc123def456",
    metadata = mapOf(
        "campaign" to "summer_sale",
        "source" to "push_notification"
    )
)
```

### Track Conversion

```kotlin
Afftok.trackConversion(
    offerId = "off_xyz789",
    transactionId = "order_12345",
    amount = 49.99,
    currency = "USD",
    status = ConversionStatus.APPROVED
)
```

---

## iOS SDK

### Installation (Swift Package Manager)

```swift
dependencies: [
    .package(url: "https://github.com/afftok/afftok-ios-sdk.git", from: "1.0.0")
]
```

### Initialization

```swift
import Afftok

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        Afftok.shared.initialize(
            apiKey: "afftok_live_sk_xxxxx",
            config: AfftokConfig(
                debug: true,
                enableOfflineQueue: true
            )
        )
        
        return true
    }
}
```

### Track Click

```swift
Afftok.shared.trackClick(
    trackingCode: "tc_abc123def456",
    metadata: [
        "campaign": "summer_sale",
        "source": "push_notification"
    ]
)
```

### Track Conversion

```swift
try await Afftok.shared.trackConversion(
    offerId: "off_xyz789",
    transactionId: "order_12345",
    amount: 49.99,
    currency: "USD",
    status: .approved
)
```

---

# Webhooks

## Supported Events

| Event | Description |
|-------|-------------|
| `click.tracked` | A click was successfully tracked |
| `conversion.created` | A new conversion was created |
| `conversion.approved` | A conversion was approved |
| `conversion.rejected` | A conversion was rejected |
| `fraud.detected` | Fraud was detected |

## Webhook Payload Structure

```json
{
  "id": "evt_abc123def456",
  "type": "conversion.created",
  "timestamp": "2024-01-15T10:30:45Z",
  "api_version": "2024-01-01",
  "data": {
    "conversion_id": "conv_abc123",
    "click_id": "clk_xyz789",
    "offer_id": "off_def456",
    "user_id": "usr_ghi789",
    "transaction_id": "txn_123456",
    "amount": 49.99,
    "currency": "USD",
    "payout": 5.00,
    "status": "pending"
  }
}
```

## Retry Policy

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 10 seconds |
| 4 | 30 seconds |
| 5 | 1 minute |
| 6 | 5 minutes |
| 7 | 30 minutes |
| 8 | 1 hour |

## Webhook Handler Example (Node.js)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhooks/afftok', (req, res) => {
  // Verify signature
  const signature = req.headers['x-afftok-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event
  const event = req.body;
  
  switch (event.type) {
    case 'conversion.created':
      handleConversionCreated(event.data);
      break;
    case 'conversion.approved':
      handleConversionApproved(event.data);
      break;
  }

  res.status(200).json({ received: true });
});

app.listen(3000);
```

---

# Production URLs

## API Endpoints

| Service | URL |
|---------|-----|
| **Backend API** | `https://go.afftokapp.com/api` |
| **Admin Panel** | `https://admin.afftokapp.com` |
| **Website** | `https://afftokapp.com` |
| **Tracking Links** | `https://go.afftokapp.com/c/:code` |

## Conversion Webhooks

| Platform | Webhook URL |
|----------|-------------|
| Shopify | `https://go.afftokapp.com/api/webhook/shopify/:advertiser_id` |
| Salla | `https://go.afftokapp.com/api/webhook/salla/:advertiser_id` |
| Zid | `https://go.afftokapp.com/api/webhook/zid/:advertiser_id` |
| Generic Postback | `https://go.afftokapp.com/api/postback` |
| Pixel | `https://go.afftokapp.com/api/pixel/convert` |

## Tracking Pixel

```html
<script src="https://go.afftokapp.com/pixel.js"></script>
```

---

# Support

- **Email**: support@afftokapp.com
- **Website**: [afftokapp.com](https://afftokapp.com)
- **Twitter**: [@afftokapp](https://twitter.com/afftokapp)
- **Instagram**: [@afftokapp](https://instagram.com/afftokapp)

---

*Last updated: December 2025*
*Version: 2.0*
Abdul Aziz Aljapah

