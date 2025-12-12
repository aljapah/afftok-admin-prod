-- Migration: Add Payoneer Payout System
-- Date: December 2024
-- Description: إضافة نظام الدفعات عبر Payoneer (معطل حالياً - جاهز للتفعيل)
-- Note: This does NOT affect the current payment system

-- =====================================================
-- 1. إضافة حقول Payoneer للمستخدمين
-- =====================================================
ALTER TABLE afftok_users ADD COLUMN IF NOT EXISTS payoneer_email VARCHAR(255);
ALTER TABLE afftok_users ADD COLUMN IF NOT EXISTS payoneer_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE afftok_users ADD COLUMN IF NOT EXISTS payoneer_verified_at TIMESTAMP;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_payoneer_email ON afftok_users(payoneer_email) WHERE payoneer_email IS NOT NULL;

-- =====================================================
-- 2. جدول دفعات الشهر (Payout Batches)
-- =====================================================
CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- معلومات الفترة
    period VARCHAR(7) NOT NULL UNIQUE, -- "2025-01"
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- الإحصائيات
    total_amount DECIMAL(14,2) DEFAULT 0,
    total_platform_fee DECIMAL(14,2) DEFAULT 0,
    total_net_amount DECIMAL(14,2) DEFAULT 0,
    total_payouts INTEGER DEFAULT 0,
    total_publishers INTEGER DEFAULT 0,
    total_advertisers INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, processing, completed, failed
    
    -- Payoneer Integration (للمستقبل)
    payoneer_batch_id VARCHAR(100),
    payoneer_status VARCHAR(50),
    payoneer_error TEXT,
    payoneer_response JSONB,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- من أنشأ الدفعة
    created_by_id UUID,
    
    -- ملاحظات
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_batches_period ON payout_batches(period);
CREATE INDEX IF NOT EXISTS idx_batches_status ON payout_batches(status);

-- =====================================================
-- 3. جدول المستحقات الفردية (Payouts)
-- =====================================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES payout_batches(id) ON DELETE SET NULL,
    
    -- الأطراف
    advertiser_id UUID NOT NULL REFERENCES afftok_users(id),
    publisher_id UUID NOT NULL REFERENCES afftok_users(id),
    
    -- تفاصيل المبلغ
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) DEFAULT 0, -- 10%
    net_amount DECIMAL(12,2) DEFAULT 0,   -- المبلغ بعد خصم العمولة
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- الفترة
    period VARCHAR(7) NOT NULL, -- "2025-01"
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    -- الإحصائيات
    conversions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, failed, cancelled
    
    -- Payoneer Integration (للمستقبل)
    payoneer_payment_id VARCHAR(100),
    payoneer_status VARCHAR(50),
    payoneer_error TEXT,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_batch ON payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_payouts_advertiser ON payouts(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_payouts_publisher ON payouts(publisher_id);
CREATE INDEX IF NOT EXISTS idx_payouts_period ON payouts(period);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_adv_pub_period ON payouts(advertiser_id, publisher_id, period);

-- =====================================================
-- 4. Trigger لتحديث updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for payout_batches
DROP TRIGGER IF EXISTS update_payout_batches_updated_at ON payout_batches;
CREATE TRIGGER update_payout_batches_updated_at
    BEFORE UPDATE ON payout_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payouts
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ملاحظة: هذا النظام معطل حالياً
-- سيتم تفعيله بعد التعاقد مع Payoneer
-- النظام الحالي (المروج يحدد طريقة الدفع + المعلن يدفع مباشرة) يعمل بشكل طبيعي
-- =====================================================

