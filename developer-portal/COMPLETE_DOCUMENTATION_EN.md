# 📘 AffTok Platform - Complete Technical Documentation

**Version:** 2.0.0  
**Date:** December 2025  
**Author:** Abdulaziz Aljapah  
**Language:** English  
**Status:** Production Ready

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Backend API](#4-backend-api)
5. [Click Tracking Service](#5-click-tracking-service)
6. [Mobile Application (Flutter)](#6-mobile-application)
7. [Admin Panel (React + RBAC)](#7-admin-panel)
8. [Advertiser Integration Portal](#8-advertiser-integration-portal)
9. [Security & Fraud Detection](#9-security--fraud-detection)
10. [GeoIP & Geo-Targeting](#10-geoip--geo-targeting)
11. [Installation & Deployment](#11-installation--deployment)
12. [Testing Guide & Scenarios](#12-testing-guide--scenarios)
13. [Troubleshooting & Common Errors](#13-troubleshooting--common-errors)
14. [API Reference & Rate Limits](#14-api-reference--rate-limits)
15. [Migration Guide](#15-migration-guide)
16. [Glossary](#16-glossary)
17. [FAQ](#17-faq)
18. [Changelog](#18-changelog)

---

## 1. Project Overview

### 🎯 What is AffTok?

**AffTok** is an enterprise-grade affiliate marketing platform that connects advertisers with promoters (affiliates) to drive product sales and conversions. The platform provides a complete ecosystem for managing offers, tracking clicks and conversions, calculating commissions, and analyzing performance metrics.

### 🌟 Key Features

#### For Advertisers:
- Create and manage marketing offers with detailed targeting
- Track campaign performance in real-time
- Set commission structures and payment terms
- Geo-targeting: Target specific countries or block certain regions
- Multiple integration methods: Shopify, Salla, Zid, WooCommerce, Custom API
- Access comprehensive analytics and reports
- Fraud protection with multi-layer detection

#### For Promoters (Affiliates):
- Browse and apply for available offers
- Generate unique, secure tracking links (HMAC-signed)
- Monitor clicks and conversions in real-time
- Track earnings and commission payments
- Participate in gamification (badges, teams, leaderboards)
- Set audience countries for better offer matching
- Access performance analytics and insights

#### For Administrators (RBAC System):
| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Super Admin** | Full | All features + user management + audit logs |
| **Finance Admin** | Financial | Invoices, revenue analytics, financial reports |
| **Tech Admin** | Technical | Monitoring, logs, webhooks, fraud detection |
| **Advertiser Manager** | Campaigns | Offers, networks, campaigns management |
| **Promoter Support** | Support | User support, teams, contests viewing |
| **Fraud Reviewer** | Security | Fraud detection, geo rules, suspicious activity |

### 📊 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Backend API** | Go (Golang) | 1.21+ | Main application server |
| **Web Framework** | Gin | 1.9+ | HTTP routing and middleware |
| **Database** | PostgreSQL (Neon) | 15+ | Primary data storage |
| **Cache** | Redis (RedisLabs) | 7.0+ | Session and data caching |
| **Mobile App** | Flutter | 3.16+ | Cross-platform mobile application |
| **Admin Panel** | React + TypeScript | 18+ | Web-based administration interface |
| **API Layer** | tRPC | 11+ | Type-safe API communication |
| **ORM** | Drizzle ORM + GORM | Latest | Database query builder |
| **UI Framework** | Tailwind CSS | 4+ | Utility-first CSS framework |
| **Authentication** | JWT | Latest | Secure token-based auth |
| **GeoIP** | ip-api.com + MaxMind | Free/Paid | IP to country resolution |
| **Deployment** | Railway | Latest | Cloud deployment platform |

### 📂 Project Structure

```
afftok/
├── backend/                    # Go Backend API
│   ├── cmd/api/main.go        # Application entry point
│   ├── internal/
│   │   ├── handlers/          # HTTP request handlers
│   │   ├── models/            # Data models (GORM)
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Custom middleware (auth, security)
│   │   └── database/          # Database connection
│   └── public/                # Static HTML templates
│
├── admin/                      # React Admin Panel
│   ├── client/src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   └── lib/               # tRPC client
│   ├── server/
│   │   ├── routers.ts         # tRPC procedures
│   │   └── db.ts              # Database queries
│   └── drizzle/schema.ts      # Database schema
│
├── mobile/                     # Flutter Mobile App
│   ├── lib/
│   │   ├── screens/           # Application screens
│   │   ├── models/            # Data models
│   │   ├── services/          # API services
│   │   ├── providers/         # State management
│   │   └── widgets/           # Reusable widgets
│   ├── android/               # Android native code
│   └── ios/                   # iOS native code
│
├── developer-portal/           # Documentation
├── diagrams/                   # System diagrams (Mermaid)
└── tests/                      # Test suites
```

### 📈 Key Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Users** | Registered promoters | `COUNT(users)` |
| **Total Offers** | Active offers | `COUNT(offers WHERE status='active')` |
| **Total Clicks** | Tracked clicks | `COUNT(clicks)` |
| **Total Conversions** | Approved conversions | `COUNT(conversions WHERE status='approved')` |
| **Conversion Rate (CR)** | Click to conversion rate | `(conversions / clicks) × 100` |
| **Earnings Per Click (EPC)** | Average earnings | `total_commissions / total_clicks` |
| **Fraud Rate** | Detected fraud percentage | `(fraudulent_clicks / total_clicks) × 100` |

---

## 2. System Architecture

### 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────┬─────────────────────┬────────────────────────────┤
│   Mobile App        │    Admin Panel      │   Public Landing Pages     │
│   (Flutter)         │    (React + tRPC)   │   (HTML Templates)         │
│   iOS & Android     │    RBAC System      │   Promoter/Team Pages      │
└──────────┬──────────┴──────────┬──────────┴─────────────┬──────────────┘
           │                     │                         │
           │ HTTPS/REST          │ HTTPS/tRPC             │ HTTPS
           │                     │                         │
┌──────────▼─────────────────────▼─────────────────────────▼──────────────┐
│                     LOAD BALANCER / CDN (Cloudflare)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                        RAILWAY CLOUD PLATFORM                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      GO BACKEND API                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │  │
│  │  │    Auth     │ │   Offers    │ │   Clicks    │ │  Webhooks  │ │  │
│  │  │   Service   │ │   Service   │ │   Service   │ │  Service   │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │  │
│  │  │   Fraud     │ │   GeoIP     │ │    Link     │ │   Audit    │ │  │
│  │  │  Detection  │ │   Service   │ │   Signing   │ │    Log     │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────┬──────────────────────────────────┬────────────────────┘
                 │                                   │
┌────────────────▼────────────────┐   ┌────────────▼────────────────────┐
│       PostgreSQL (Neon)         │   │        Redis (RedisLabs)        │
│  ┌───────────────────────────┐  │   │  ┌───────────────────────────┐  │
│  │ • users                   │  │   │  │ • Session Cache (15min)   │  │
│  │ • offers                  │  │   │  │ • Click Buffer (10sec)    │  │
│  │ • clicks                  │  │   │  │ • GeoIP Cache (24hr)      │  │
│  │ • conversions             │  │   │  │ • Rate Limiting           │  │
│  │ • teams                   │  │   │  │ • Tracking Code Mapping   │  │
│  │ • admin_users             │  │   │  └───────────────────────────┘  │
│  │ • audit_logs              │  │   └─────────────────────────────────┘
│  │ • advertiser_integrations │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 🔄 Request Flow

```
User Request → Cloudflare CDN → Railway Load Balancer → Go Backend
                                                            │
                    ┌───────────────────────────────────────┤
                    │                                       │
                    ▼                                       ▼
            Rate Limiter                              Auth Middleware
                    │                                       │
                    ▼                                       ▼
            Security Headers                          JWT Validation
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                                   Handler Layer
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              Service Layer      Redis Cache         PostgreSQL
                    │                   │                   │
                    └───────────────────┴───────────────────┘
                                        │
                                        ▼
                                   Response
```

### 📊 Data Flow: Click Tracking

```
1. User clicks: https://go.afftokapp.com/c/ABC123
                            │
                            ▼
2. ┌─────────────────────────────────────────────────────────────┐
   │                    FRAUD DETECTION                           │
   │  • Bot Detection (User-Agent analysis)                      │
   │  • IP Fingerprinting (Datacenter detection)                 │
   │  • Cookie Stuffing Detection                                │
   │  • Click Pattern Anomaly                                    │
   │  • Referer Spoofing Detection                               │
   └─────────────────────────────────────────────────────────────┘
                            │
                            ▼
3. ┌─────────────────────────────────────────────────────────────┐
   │                    GEOIP RESOLUTION                          │
   │  Priority: CF-IPCountry → X-Country → ip-api.com → MaxMind  │
   └─────────────────────────────────────────────────────────────┘
                            │
                            ▼
4. ┌─────────────────────────────────────────────────────────────┐
   │                  GEO-TARGETING CHECK                         │
   │  • Is country in target_countries? ✓                        │
   │  • Is country in blocked_countries? ✗                       │
   └─────────────────────────────────────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
          Valid Click              Blocked Click
               │                         │
               ▼                         ▼
   Store in Redis Buffer          Return 403 Forbidden
               │
               ▼
   Batch Write to PostgreSQL (every 10s)
               │
               ▼
   302 Redirect to Offer URL
               │
               ▼
   Fire Webhook to Advertiser (async)
```

---

## 3. Database Design

### 📊 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │     networks     │       │      offers      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ username         │       │ name             │       │ network_id (FK)  │
│ email            │       │ description      │       │ title            │
│ password_hash    │       │ logo_url         │       │ title_ar         │
│ role             │       │ status           │       │ description      │
│ country          │       │ created_at       │       │ payout           │
│ audience_countries│      └────────┬─────────┘       │ target_countries │
│ unique_code      │                │                 │ blocked_countries│
│ points           │                │                 │ status           │
│ level            │                └─────────────────│ created_at       │
└────────┬─────────┘                                  └────────┬─────────┘
         │                                                     │
         │         ┌──────────────────┐                       │
         │         │   user_offers    │                       │
         │         ├──────────────────┤                       │
         └────────►│ id (PK)          │◄──────────────────────┘
                   │ user_id (FK)     │
                   │ offer_id (FK)    │
                   │ tracking_url     │
                   │ created_at       │
                   └────────┬─────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
         ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│      clicks      │                 │   conversions    │
├──────────────────┤                 ├──────────────────┤
│ id (PK)          │                 │ id (PK)          │
│ user_id (FK)     │                 │ click_id (FK)    │
│ offer_id (FK)    │                 │ user_id (FK)     │
│ user_offer_id(FK)│                 │ offer_id (FK)    │
│ tracking_code    │                 │ amount           │
│ ip_address       │                 │ commission       │
│ country          │                 │ transaction_id   │
│ fraud_score      │                 │ status           │
│ clicked_at       │                 │ converted_at     │
└──────────────────┘                 └──────────────────┘
```

### 📋 Core Tables Schema

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'promoter' CHECK (role IN ('promoter', 'advertiser', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_earnings DECIMAL(12, 2) DEFAULT 0.00,
  country VARCHAR(2),
  audience_countries TEXT[],
  unique_code VARCHAR(50) UNIQUE,
  team_id INTEGER REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_unique_code (unique_code),
  INDEX idx_users_country (country)
);
```

#### offers
```sql
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200),
  description TEXT,
  description_ar TEXT,
  category VARCHAR(50),
  
  -- Financial
  payout DECIMAL(10, 2) NOT NULL,
  payout_type VARCHAR(20) DEFAULT 'cpa' CHECK (payout_type IN ('cpa', 'cpl', 'cps', 'hybrid')),
  
  -- Media
  logo_url VARCHAR(500),
  destination_url VARCHAR(1000) NOT NULL,
  
  -- Targeting
  target_countries TEXT[],
  blocked_countries TEXT[],
  
  -- Terms
  terms TEXT,
  additional_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  
  -- Stats (denormalized for performance)
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_offers_network (network_id),
  INDEX idx_offers_status (status),
  INDEX idx_offers_category (category),
  INDEX idx_offers_target_countries USING GIN (target_countries)
);
```

#### clicks
```sql
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  user_offer_id INTEGER REFERENCES user_offers(id),
  
  -- Tracking
  tracking_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Visitor Info
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(1000),
  country VARCHAR(2),
  
  -- Fraud Detection
  fraud_score DECIMAL(3, 2) DEFAULT 0.00,
  fraud_reasons TEXT[],
  is_valid BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_clicks_user (user_id),
  INDEX idx_clicks_offer (offer_id),
  INDEX idx_clicks_tracking_code (tracking_code),
  INDEX idx_clicks_clicked_at (clicked_at),
  INDEX idx_clicks_country (country),
  INDEX idx_clicks_valid (is_valid)
);

-- Partition by month for performance
CREATE TABLE clicks_2025_01 PARTITION OF clicks
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### conversions
```sql
CREATE TABLE conversions (
  id SERIAL PRIMARY KEY,
  click_id INTEGER REFERENCES clicks(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  offer_id INTEGER NOT NULL REFERENCES offers(id),
  
  -- Transaction
  amount DECIMAL(12, 2) NOT NULL,
  commission DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  transaction_id VARCHAR(100) UNIQUE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reversed')),
  rejection_reason TEXT,
  
  -- Timestamps
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_conversions_user (user_id),
  INDEX idx_conversions_offer (offer_id),
  INDEX idx_conversions_status (status),
  INDEX idx_conversions_transaction (transaction_id),
  INDEX idx_conversions_converted_at (converted_at)
);
```

#### admin_users (RBAC)
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN (
    'super_admin', 
    'finance_admin', 
    'tech_admin', 
    'advertiser_manager', 
    'promoter_support', 
    'fraud_reviewer'
  )),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_admin_users_email (email),
  INDEX idx_admin_users_role (role)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES admin_users(id),
  
  -- Action Details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  
  -- Change Tracking
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_audit_logs_admin (admin_user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created_at (created_at)
);
```

---

## 4. Backend API

### 🔐 Authentication

#### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "username": "ahmed_ali",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "full_name": "Ahmed Ali",
  "role": "promoter",
  "country": "SA"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "ahmed_ali",
      "email": "ahmed@example.com",
      "role": "promoter",
      "unique_code": "usr_abc123xyz"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-12-15T10:30:00Z"
  }
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| username | 3-50 chars, alphanumeric, unique |
| email | Valid email format, unique |
| password | Min 8 chars, 1 uppercase, 1 number |
| role | `promoter` or `advertiser` |
| country | ISO 3166-1 alpha-2 code |

#### POST /api/auth/login

**Request:**
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "ahmed_ali",
      "email": "ahmed@example.com",
      "role": "promoter",
      "points": 1500,
      "level": 5,
      "country": "SA",
      "audience_countries": ["SA", "AE", "KW"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-12-08T11:00:00Z"
  }
}
```

### 🎯 Offers API

#### GET /api/offers

List offers with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, max: 100) |
| `status` | string | Filter by status |
| `category` | string | Filter by category |
| `country` | string | Filter by target country |
| `sort` | string | Sort field (created_at, payout) |
| `order` | string | Sort order (asc, desc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": 1,
        "title": "Amazon Prime Membership",
        "title_ar": "عضوية أمازون برايم",
        "payout": 15.00,
        "payout_type": "cpa",
        "category": "subscription",
        "target_countries": ["SA", "AE"],
        "status": "active",
        "stats": {
          "clicks": 5420,
          "conversions": 187,
          "conversion_rate": 3.45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### POST /api/offers/:id/join

Join an offer and receive tracking link.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_offer_id": 456,
    "tracking_url": "https://go.afftokapp.com/c/xK9mN2pQ",
    "short_link": "https://go.afftokapp.com/c/xK9mN2pQ",
    "qr_code": "data:image/png;base64,..."
  }
}
```

### 📊 Click Tracking

#### GET /c/:code

Track click and redirect.

**Response Codes:**
| Code | Description |
|------|-------------|
| 302 | Success - Redirect to offer URL |
| 403 | Blocked - Country not allowed |
| 404 | Not Found - Invalid tracking code |
| 410 | Gone - Offer no longer active |
| 429 | Too Many Requests - Rate limited |

**Headers Set:**
```
X-Click-ID: abc123
X-Fraud-Score: 0.15
X-Country: SA
```

### 🔔 Webhooks/Postbacks

#### POST /api/postback

Receive conversion notification.

**Request:**
```json
{
  "click_id": "xK9mN2pQ",
  "transaction_id": "TXN-2025-001234",
  "amount": 299.99,
  "currency": "SAR",
  "status": "approved",
  "customer_type": "new",
  "timestamp": "2025-12-08T10:30:00Z",
  "signature": "a1b2c3d4e5f6..."
}
```

**Signature Verification:**
```go
// HMAC-SHA256 signature
expectedSig := hmac.New(sha256.New, []byte(secretKey))
expectedSig.Write([]byte(click_id + transaction_id + amount))
isValid := hmac.Equal(signature, expectedSig.Sum(nil))
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversion_id": 789,
    "commission": 29.99,
    "status": "pending"
  }
}
```

---

## 5. Click Tracking Service

### 🚀 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLICK TRACKING SERVICE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │   Handler   │────────►│   Redis     │                       │
│  │   Layer     │         │   Buffer    │                       │
│  └──────┬──────┘         └─────────────┘                       │
│         │                       │                               │
│         │                       │ Batch (10s)                   │
│  ┌──────▼──────┐         ┌─────▼───────┐                       │
│  │   Fraud     │         │ PostgreSQL  │                       │
│  │  Detection  │         │  Database   │                       │
│  └─────────────┘         └─────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📈 Performance Benchmarks

| Metric | Value | Notes |
|--------|-------|-------|
| **Throughput** | 10,000 req/s | Per instance |
| **Latency (p50)** | 2ms | Normal conditions |
| **Latency (p95)** | 8ms | Under load |
| **Latency (p99)** | 15ms | Peak traffic |
| **Redis Write** | <1ms | Buffered |
| **DB Batch Write** | ~50ms | Every 10 seconds |

### 🔒 Link Signing (HMAC)

```go
// Generate signed tracking link
func GenerateTrackingCode(userOfferID uint) string {
    timestamp := time.Now().Unix()
    data := fmt.Sprintf("%d:%d", userOfferID, timestamp)
    
    mac := hmac.New(sha256.New, []byte(secretKey))
    mac.Write([]byte(data))
    signature := hex.EncodeToString(mac.Sum(nil))[:12]
    
    // Store mapping in Redis
    redis.Set(ctx, "track:"+signature, userOfferID, 90*24*time.Hour)
    
    return signature
}

// Verify and decode tracking code
func DecodeTrackingCode(code string) (uint, error) {
    userOfferID, err := redis.Get(ctx, "track:"+code).Uint64()
    if err != nil {
        return 0, ErrInvalidTrackingCode
    }
    return uint(userOfferID), nil
}
```

---

## 6. Mobile Application

### 📱 Flutter Architecture

```
lib/
├── main.dart                 # App entry point
├── config/
│   ├── env.dart             # Environment configuration
│   ├── routes.dart          # Route definitions
│   └── theme.dart           # App theme
├── models/
│   ├── user.dart            # User model
│   ├── offer.dart           # Offer model
│   └── user_offer.dart      # UserOffer model
├── providers/
│   ├── auth_provider.dart   # Authentication state
│   ├── offer_provider.dart  # Offers state
│   └── theme_provider.dart  # Theme state
├── services/
│   ├── api_service.dart     # HTTP client
│   ├── auth_service.dart    # Auth API calls
│   └── storage_service.dart # Secure storage
├── screens/
│   ├── splash_screen.dart   # App loading
│   ├── auth/                # Login, Register
│   ├── home/                # Home feed
│   ├── offers/              # Offer listing
│   ├── profile/             # User profile
│   └── settings/            # App settings
└── widgets/
    ├── offer_card.dart      # Offer card widget
    └── loading_indicator.dart
```

### 🔐 Authentication Flow

```dart
class AuthService {
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  
  Future<AuthResponse> login(String email, String password) async {
    final response = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });
    
    // Store tokens securely
    await _storage.write(key: 'access_token', value: response.token);
    await _storage.write(key: 'refresh_token', value: response.refreshToken);
    
    return response;
  }
  
  Future<void> logout() async {
    await _storage.deleteAll();
    // Navigate to login
  }
  
  Future<String?> getToken() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return null;
    
    // Check expiry
    if (isTokenExpired(token)) {
      return await _refreshToken();
    }
    return token;
  }
}
```

### 📤 Share Functionality

```dart
void shareTrackingLink(UserOffer offer) async {
  final trackingUrl = offer.trackingUrl ?? offer.userReferralLink;
  
  await Share.share(
    '🔥 Check out this amazing offer!\n\n'
    '${offer.title}\n'
    '💰 Earn rewards when you sign up!\n\n'
    '👉 $trackingUrl',
    subject: offer.title,
  );
  
  // Track share event
  analytics.logEvent('offer_shared', {
    'offer_id': offer.offerId,
    'method': 'native_share',
  });
}
```

---

## 7. Admin Panel

### 🖥️ RBAC Implementation

```typescript
// Role permissions matrix
const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  finance_admin: ['dashboard', 'invoices', 'analytics.revenue', 'offers.view', 'contests.view'],
  tech_admin: ['dashboard', 'monitoring', 'logs', 'webhooks', 'fraud_detection', 'geo_rules'],
  advertiser_manager: ['dashboard', 'offers', 'networks', 'teams', 'contests', 'badges', 'analytics.basic'],
  promoter_support: ['dashboard', 'users', 'teams.view', 'contests.view'],
  fraud_reviewer: ['fraud_detection', 'geo_rules', 'logs.view'],
};

// Permission check hook
function usePermission(permission: string): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission) || permissions.includes('*');
}

// Protected route component
function ProtectedRoute({ permission, children }) {
  const hasPermission = usePermission(permission);
  
  if (!hasPermission) {
    return <AccessDenied />;
  }
  
  return children;
}
```

### 📊 Dashboard Components

```typescript
// Real-time stats card
function StatsCard({ title, value, change, icon }) {
  return (
    <Card>
      <CardHeader>
        <Icon>{icon}</Icon>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatNumber(value)}</div>
        <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 8. Advertiser Integration Portal

### 🔗 Integration Methods

#### 1. Shopify Integration

```javascript
// Shopify webhook handler
app.post('/api/webhooks/shopify/:advertiserId', async (req, res) => {
  const { advertiserId } = req.params;
  const hmac = req.headers['x-shopify-hmac-sha256'];
  
  // Verify webhook signature
  const isValid = verifyShopifySignature(req.body, hmac, shopifySecret);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const order = req.body;
  
  // Find click by customer email or order note
  const click = await findClickByCustomer(order.customer.email);
  if (!click) {
    return res.status(200).json({ message: 'No affiliate click found' });
  }
  
  // Create conversion
  await createConversion({
    clickId: click.id,
    transactionId: order.id.toString(),
    amount: parseFloat(order.total_price),
    currency: order.currency,
  });
  
  res.status(200).json({ success: true });
});
```

#### 2. Salla Integration

```javascript
// Salla webhook handler
app.post('/api/webhooks/salla/:advertiserId', async (req, res) => {
  const { event, data } = req.body;
  
  if (event !== 'order.created' && event !== 'order.paid') {
    return res.status(200).json({ message: 'Event ignored' });
  }
  
  // Process order
  await processConversion({
    platform: 'salla',
    orderId: data.id,
    amount: data.total.amount,
    currency: data.total.currency,
  });
  
  res.status(200).json({ success: true });
});
```

#### 3. Custom Pixel Integration

```html
<!-- AffTok Pixel Code -->
<script>
(function(w,d,s,o,f,js,fjs){
  w['AffTokObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
  w[o].l=1*new Date();js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
  js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
})(window,document,'script','afftok','https://go.afftokapp.com/pixel.js');

afftok('init', 'ADV_123456');
afftok('track', 'PageView');
</script>

<!-- Track conversion on thank you page -->
<script>
afftok('track', 'Purchase', {
  transaction_id: 'ORDER_123',
  amount: 99.99,
  currency: 'SAR'
});
</script>
```

### 📋 Postback URL Structure

```
https://go.afftokapp.com/api/postback
  ?click_id={click_id}
  &transaction_id={order_id}
  &amount={total_amount}
  &currency={currency}
  &status=approved
  &sig={hmac_signature}
```

---

## 9. Security & Fraud Detection

### 🛡️ Multi-Layer Fraud Detection

```go
type FraudDetector struct {
    botPatterns      []string
    datacenterRanges []*net.IPNet
    cache            *cache.Cache
}

func (f *FraudDetector) AnalyzeClick(ctx context.Context, click *Click) FraudResult {
    var score float64
    var reasons []string
    
    // Layer 1: Bot Detection
    if f.isBot(click.UserAgent) {
        score += 0.9
        reasons = append(reasons, "bot_detected")
    }
    
    // Layer 2: Datacenter IP Detection
    if f.isDatacenterIP(click.IPAddress) {
        score += 0.7
        reasons = append(reasons, "datacenter_ip")
    }
    
    // Layer 3: Click Velocity Check
    if f.isHighVelocity(click.UserID, click.IPAddress) {
        score += 0.5
        reasons = append(reasons, "high_velocity")
    }
    
    // Layer 4: Cookie Stuffing Detection
    if f.isCookieStuffing(click) {
        score += 0.8
        reasons = append(reasons, "cookie_stuffing")
    }
    
    // Layer 5: Referer Spoofing Detection
    if f.isRefererSpoofed(click.Referrer, click.UserAgent) {
        score += 0.6
        reasons = append(reasons, "referer_spoofing")
    }
    
    return FraudResult{
        Score:    math.Min(score, 1.0),
        Reasons:  reasons,
        IsValid:  score < 0.5,
    }
}
```

### 🔒 Security Headers

```go
func SecurityMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // HSTS
        c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        // XSS Protection
        c.Header("X-XSS-Protection", "1; mode=block")
        
        // Content Type Options
        c.Header("X-Content-Type-Options", "nosniff")
        
        // Frame Options
        c.Header("X-Frame-Options", "DENY")
        
        // CSP
        c.Header("Content-Security-Policy", "default-src 'self'")
        
        // Referrer Policy
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        
        c.Next()
    }
}
```

---

## 10. GeoIP & Geo-Targeting

### 🌍 GeoIP Resolution

```go
type GeoIPService struct {
    client *http.Client
    cache  *cache.Cache
    maxmind *geoip2.Reader // Optional: MaxMind DB
}

func (s *GeoIPService) GetCountryCode(ip string) (string, error) {
    // 1. Check cache
    if cached, found := s.cache.Get(ip); found {
        return cached.(string), nil
    }
    
    // 2. Skip private IPs
    if isPrivateIP(ip) {
        return "", nil
    }
    
    // 3. Try MaxMind (if available)
    if s.maxmind != nil {
        record, err := s.maxmind.Country(net.ParseIP(ip))
        if err == nil {
            country := record.Country.IsoCode
            s.cache.Set(ip, country, 24*time.Hour)
            return country, nil
        }
    }
    
    // 4. Fallback to ip-api.com
    resp, err := s.client.Get(fmt.Sprintf(
        "http://ip-api.com/json/%s?fields=status,countryCode", ip))
    if err != nil {
        return "", err
    }
    
    var result struct {
        Status      string `json:"status"`
        CountryCode string `json:"countryCode"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    if result.Status == "success" {
        s.cache.Set(ip, result.CountryCode, 24*time.Hour)
        return result.CountryCode, nil
    }
    
    return "", ErrGeoIPFailed
}
```

### 🎯 Geo-Targeting Logic

```go
func (h *ClickHandler) checkGeoTargeting(offer *Offer, country string) error {
    // Check blocked countries first
    if len(offer.BlockedCountries) > 0 {
        for _, blocked := range offer.BlockedCountries {
            if strings.EqualFold(blocked, country) {
                return ErrCountryBlocked
            }
        }
    }
    
    // Check target countries (if specified)
    if len(offer.TargetCountries) > 0 {
        found := false
        for _, target := range offer.TargetCountries {
            if strings.EqualFold(target, country) {
                found = true
                break
            }
        }
        if !found {
            return ErrCountryNotTargeted
        }
    }
    
    return nil
}
```

---

## 11. Installation & Deployment

### 🛠️ Prerequisites

| Component | Version | Notes |
|-----------|---------|-------|
| Go | 1.21+ | Backend development |
| PostgreSQL | 15+ | Primary database |
| Redis | 7.0+ | Caching & buffering |
| Node.js | 18+ | Admin panel |
| Flutter | 3.16+ | Mobile app |
| Docker | 24+ | Optional, for containers |

### 📦 Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/afftok.git
cd afftok/backend

# 2. Install dependencies
go mod download

# 3. Configure environment
cp .env.example .env
nano .env

# 4. Run database migrations
go run cmd/migrate/main.go up

# 5. Seed initial data (optional)
go run cmd/seed/main.go

# 6. Start server
go run cmd/api/main.go

# Or build and run
go build -o afftok cmd/api/main.go
./afftok
```

### 🔧 Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/afftok?sslmode=require

# Redis
REDIS_URL=redis://user:pass@host:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=168h

# Server
PORT=8080
ENV=production
DOMAIN=go.afftokapp.com

# GeoIP
GEOIP_PROVIDER=ip-api  # or maxmind
MAXMIND_LICENSE_KEY=your-key  # if using MaxMind

# Security
HMAC_SECRET=your-hmac-secret-key
RATE_LIMIT_RPS=100
RATE_LIMIT_BURST=200

# External Services
IMGBB_API_KEY=your-imgbb-key
```

### 🚀 Railway Deployment

```yaml
# railway.toml
[build]
builder = "go"
buildCommand = "go build -o main cmd/api/main.go"

[deploy]
startCommand = "./main"
healthcheckPath = "/health"
healthcheckTimeout = 30

[env]
GO_VERSION = "1.21"
CGO_ENABLED = "0"
```

### 🐳 Docker Deployment

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/api/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["./main"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: afftok
      POSTGRES_USER: afftok
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## 12. Testing Guide & Scenarios

### 🧪 Test Categories

#### Unit Tests

```go
// handlers/click_test.go
func TestTrackClick_ValidCode(t *testing.T) {
    // Setup
    handler := NewClickHandler(testDB)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    c.Params = gin.Params{{Key: "code", Value: "validCode123"}}
    
    // Mock Redis
    mockRedis.Set("track:validCode123", 456, 0)
    
    // Execute
    handler.TrackClick(c)
    
    // Assert
    assert.Equal(t, http.StatusFound, w.Code)
    assert.Contains(t, w.Header().Get("Location"), "offer-destination.com")
}

func TestTrackClick_InvalidCode(t *testing.T) {
    handler := NewClickHandler(testDB)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    c.Params = gin.Params{{Key: "code", Value: "invalidCode"}}
    
    handler.TrackClick(c)
    
    assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestTrackClick_BlockedCountry(t *testing.T) {
    handler := NewClickHandler(testDB)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    c.Params = gin.Params{{Key: "code", Value: "validCode123"}}
    c.Request, _ = http.NewRequest("GET", "/c/validCode123", nil)
    c.Request.Header.Set("CF-IPCountry", "SY")  // Blocked country
    
    handler.TrackClick(c)
    
    assert.Equal(t, http.StatusForbidden, w.Code)
}
```

#### Integration Tests

```go
// integration/api_test.go
func TestFullConversionFlow(t *testing.T) {
    // 1. Register user
    userResp := POST("/api/auth/register", RegisterRequest{
        Username: "testuser",
        Email:    "test@example.com",
        Password: "TestPass123!",
    })
    assert.Equal(t, 201, userResp.Code)
    
    token := userResp.Body.Token
    
    // 2. Join offer
    joinResp := POSTAuth("/api/offers/1/join", token, nil)
    assert.Equal(t, 200, joinResp.Code)
    
    trackingCode := joinResp.Body.TrackingURL
    
    // 3. Simulate click
    clickResp := GET("/c/" + trackingCode)
    assert.Equal(t, 302, clickResp.Code)
    
    // 4. Send postback
    postbackResp := POST("/api/postback", PostbackRequest{
        ClickID:       trackingCode,
        TransactionID: "TXN-TEST-001",
        Amount:        99.99,
        Status:        "approved",
    })
    assert.Equal(t, 200, postbackResp.Code)
    
    // 5. Verify conversion recorded
    convResp := GETAuth("/api/conversions/latest", token)
    assert.Equal(t, "TXN-TEST-001", convResp.Body.TransactionID)
}
```

#### Load Tests

```javascript
// k6/load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

export default function () {
  // Test click tracking endpoint
  const res = http.get('https://go.afftokapp.com/c/testCode123');
  
  check(res, {
    'status is 302 or 403': (r) => r.status === 302 || r.status === 403,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

### 📋 Test Scenarios

#### Authentication Scenarios

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Valid registration | Valid email, password | 201 + token |
| Duplicate email | Existing email | 409 Conflict |
| Weak password | "12345" | 400 + validation error |
| Valid login | Correct credentials | 200 + token |
| Invalid login | Wrong password | 401 Unauthorized |
| Expired token | Old JWT | 401 + refresh required |
| Invalid token | Malformed JWT | 401 Unauthorized |

#### Click Tracking Scenarios

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Valid click | Valid tracking code | 302 Redirect |
| Invalid code | Non-existent code | 404 Not Found |
| Expired offer | Inactive offer | 410 Gone |
| Blocked country | Country in blocked list | 403 Forbidden |
| Bot detection | Bot user agent | 403 + fraud flag |
| Rate limited | >100 requests/min | 429 Too Many Requests |
| Duplicate click | Same IP in 10 seconds | 200 but not counted |

#### Conversion Scenarios

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Valid conversion | Valid click_id + signature | 200 + conversion_id |
| Invalid signature | Wrong HMAC | 401 Unauthorized |
| Duplicate transaction | Same transaction_id | 409 Conflict |
| No matching click | Unknown click_id | 404 Not Found |
| Expired click | Click > 30 days old | 410 Gone |

#### Fraud Detection Scenarios

| Scenario | Fraud Score | Action |
|----------|-------------|--------|
| Normal user | 0.0 - 0.2 | Accept |
| Suspicious | 0.2 - 0.5 | Accept + flag |
| Likely fraud | 0.5 - 0.8 | Reject + log |
| Definite fraud | 0.8 - 1.0 | Reject + block IP |

---

## 13. Troubleshooting & Common Errors

### ❌ Error Codes Reference

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| `AUTH_001` | Invalid credentials | Email/password mismatch | Check credentials |
| `AUTH_002` | Token expired | JWT token expired | Refresh token |
| `AUTH_003` | Invalid token | Malformed JWT | Re-login |
| `AUTH_004` | Account disabled | User banned/inactive | Contact support |
| `OFFER_001` | Offer not found | Invalid offer ID | Check offer ID |
| `OFFER_002` | Offer inactive | Offer status not active | Use active offer |
| `OFFER_003` | Already joined | User already joined offer | Use existing link |
| `CLICK_001` | Invalid tracking code | Code not found in Redis | Generate new link |
| `CLICK_002` | Country blocked | IP country in blocked list | Use allowed country |
| `CLICK_003` | Fraud detected | High fraud score | Contact support |
| `CLICK_004` | Rate limited | Too many requests | Wait and retry |
| `CONV_001` | Invalid signature | HMAC verification failed | Check signature |
| `CONV_002` | Duplicate transaction | Transaction already recorded | Use unique ID |
| `CONV_003` | Click expired | Click older than 30 days | N/A |
| `GEO_001` | GeoIP failed | Could not resolve country | Check IP headers |
| `DB_001` | Connection failed | Database unreachable | Check connection string |
| `REDIS_001` | Cache miss | Key not found | Will auto-recover |

### 🔧 Common Issues & Solutions

#### Issue: "Token expired" errors

**Symptoms:**
- 401 errors after 15 minutes
- Mobile app requires re-login

**Solution:**
```javascript
// Implement token refresh in API interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

#### Issue: Clicks not being tracked

**Symptoms:**
- Tracking link redirects but no click recorded
- Click count not increasing

**Checklist:**
1. ✅ Check Redis connection
2. ✅ Verify tracking code exists in Redis
3. ✅ Check fraud detection isn't blocking
4. ✅ Verify GeoIP isn't blocking country
5. ✅ Check batch writer is running

**Debug Command:**
```bash
# Check Redis for tracking code
redis-cli GET "track:ABC123"

# Check click buffer
redis-cli LLEN "clicks:buffer"

# Check logs
tail -f logs/clicks.log | grep "ABC123"
```

#### Issue: Conversions not appearing

**Symptoms:**
- Postback returns 200 but no conversion
- Commission not credited

**Checklist:**
1. ✅ Verify postback signature
2. ✅ Check click_id exists
3. ✅ Verify transaction_id is unique
4. ✅ Check click isn't expired (30 days)
5. ✅ Verify amount > 0

**Debug:**
```bash
# Check postback logs
grep "postback" logs/api.log | grep "TXN-123"

# Verify click exists
SELECT * FROM clicks WHERE tracking_code = 'ABC123';

# Check for duplicate
SELECT * FROM conversions WHERE transaction_id = 'TXN-123';
```

#### Issue: Admin panel not loading

**Symptoms:**
- White screen
- Console errors

**Solution:**
```bash
# Clear build cache
cd admin
rm -rf node_modules/.cache
rm -rf .next

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Check environment variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET"
```

#### Issue: GeoIP returning empty country

**Symptoms:**
- Country field empty in clicks
- Geo-targeting not working

**Checklist:**
1. ✅ Check Cloudflare is configured (CF-IPCountry header)
2. ✅ Verify ip-api.com is accessible
3. ✅ Check rate limiting (150 req/min for free tier)
4. ✅ Verify IP isn't private/localhost

**Solution:**
```go
// Add fallback headers
func getCountryFromRequest(c *gin.Context) string {
    // Try multiple headers
    headers := []string{
        "CF-IPCountry",
        "X-Country",
        "X-Geo-Country",
        "X-Vercel-IP-Country",
    }
    
    for _, h := range headers {
        if country := c.GetHeader(h); country != "" {
            return strings.ToUpper(country)
        }
    }
    
    // Fallback to GeoIP service
    return geoipService.GetCountryCode(c.ClientIP())
}
```

### 📊 Health Check Endpoints

```bash
# API Health
curl https://go.afftokapp.com/health
# Response: {"status":"ok","timestamp":"2025-12-08T10:00:00Z"}

# Database Health
curl https://go.afftokapp.com/health/db
# Response: {"status":"ok","latency_ms":5}

# Redis Health
curl https://go.afftokapp.com/health/redis
# Response: {"status":"ok","latency_ms":1}

# Full System Check
curl https://go.afftokapp.com/health/full
# Response: {
#   "status": "ok",
#   "services": {
#     "database": "ok",
#     "redis": "ok",
#     "geoip": "ok"
#   },
#   "version": "2.0.0"
# }
```

---

## 14. API Reference & Rate Limits

### 📊 Rate Limits

| Endpoint Type | Limit | Window | Burst |
|--------------|-------|--------|-------|
| Authentication | 10 | 1 min | 15 |
| Click Tracking | 1000 | 1 min | 2000 |
| API (authenticated) | 100 | 1 min | 200 |
| API (anonymous) | 20 | 1 min | 30 |
| Postback | 500 | 1 min | 1000 |
| Admin Panel | 200 | 1 min | 300 |

### 📝 Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702036800
X-Request-ID: req_abc123xyz
```

### 📄 API Versioning

```
Current Version: v1 (implicit)
Base URL: https://go.afftokapp.com/api

Future versions:
- https://go.afftokapp.com/api/v2
```

---

## 15. Migration Guide

### From v1.x to v2.0

#### Database Migrations

```sql
-- Add new columns
ALTER TABLE offers ADD COLUMN title_ar VARCHAR(200);
ALTER TABLE offers ADD COLUMN description_ar TEXT;
ALTER TABLE offers ADD COLUMN payout_type VARCHAR(20) DEFAULT 'cpa';
ALTER TABLE offers ADD COLUMN terms TEXT;
ALTER TABLE offers ADD COLUMN target_countries TEXT[];
ALTER TABLE offers ADD COLUMN blocked_countries TEXT[];

-- Add audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add admin_users table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Breaking Changes

| Change | v1.x | v2.0 | Migration |
|--------|------|------|-----------|
| Tracking URL | `/api/c/:code` | `/c/:code` | Update all links |
| Auth response | `{token}` | `{token, refresh_token}` | Update clients |
| Offer fields | Basic | Extended | Add new fields |

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Affiliate** | Person who promotes offers for commission |
| **Advertiser** | Company that creates offers |
| **CPA** | Cost Per Action - Pay per conversion |
| **CPL** | Cost Per Lead - Pay per signup |
| **CPS** | Cost Per Sale - Pay per purchase |
| **Click** | When user clicks tracking link |
| **Conversion** | Successful action (purchase, signup) |
| **EPC** | Earnings Per Click |
| **CR** | Conversion Rate |
| **Postback** | Server notification of conversion |
| **Pixel** | JavaScript tracking code |
| **HMAC** | Hash-based Message Authentication Code |
| **Geo-targeting** | Targeting by country/location |
| **Fraud Score** | Risk assessment 0-1 |
| **RBAC** | Role-Based Access Control |

---

## 17. FAQ

### General

**Q: What commission model does AffTok support?**
A: CPA, CPL, CPS, and Hybrid models.

**Q: How long are tracking links valid?**
A: 90 days by default, configurable per offer.

**Q: What countries are supported?**
A: All countries. Advertisers can target/block specific countries.

### Technical

**Q: How is fraud detected?**
A: Multi-layer detection: bot analysis, IP fingerprinting, click patterns, cookie stuffing detection.

**Q: How accurate is GeoIP?**
A: 95%+ accuracy using Cloudflare headers with ip-api.com fallback.

**Q: What's the click tracking latency?**
A: p50: 2ms, p95: 8ms, p99: 15ms

### Integration

**Q: Which platforms are supported?**
A: Shopify, Salla, Zid, WooCommerce, and custom API/Pixel.

**Q: How do I test integrations?**
A: Use sandbox mode with test credentials provided in dashboard.

---

## 18. Changelog

### v2.0.0 (December 2025)

#### Added
- ✨ RBAC system with 6 role types
- ✨ Arabic language support for offers
- ✨ Advanced geo-targeting (target/block countries)
- ✨ Audit logging for admin actions
- ✨ Advertiser integrations management
- ✨ GeoIP service with caching
- ✨ Enhanced fraud detection (5 layers)
- ✨ Link signing with HMAC

#### Changed
- 🔄 Tracking URL format: `/api/c/:code` → `/c/:code`
- 🔄 Database: MySQL → PostgreSQL
- 🔄 Mobile app: React Native → Flutter
- 🔄 Improved admin panel UI

#### Fixed
- 🐛 Click tracking accuracy
- 🐛 Conversion attribution
- 🐛 GeoIP resolution reliability

### v1.0.0 (November 2025)

- 🎉 Initial release

---

## 📞 Support

**Documentation:** https://docs.afftokapp.com  
**API Status:** https://status.afftokapp.com  
**Email:** support@afftokapp.com  
**GitHub:** https://github.com/afftok/afftok

---

**Prepared by:** Abdulaziz Aljapah  
**Last Updated:** December 2025  
**Version:** 2.0.0

**© 2025 AffTok. All Rights Reserved.**
