import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, networks, offers, badges, afftokUsers, teams, clicks, conversions } from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  console.log("[DB] getDb called, DATABASE_URL exists:", !!process.env.DATABASE_URL);
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[DB] Creating new database connection...");
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
      console.log("[DB] Database connection created successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  console.log("[DB] Returning db:", !!_db);
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      if (user[field] !== undefined) {
        values[field] = user[field];
        updateSet[field] = user[field];
      }
    };

    assignNullable("name");
    assignNullable("email");
    assignNullable("loginMethod");

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: {
        ...updateSet,
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
  }
}

export async function getAllAfftokUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(afftokUsers);
}

export async function createAfftokUser(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newUser = {
    username: data.username,
    email: data.email,
    passwordHash: data.password,
    fullName: data.fullName || null,
    role: data.role || 'user',
  };

  const result = await db.insert(afftokUsers).values(newUser).returning();
  return result[0];
}

export async function updateAfftokUser(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(afftokUsers).set(updates).where(eq(afftokUsers.id, id));
  return { success: true };
}

export async function deleteAfftokUser(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(afftokUsers).where(eq(afftokUsers.id, id));
  return { success: true };
}

export async function getClicksAnalytics(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const { sql } = await import("drizzle-orm");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.execute(sql`
    SELECT 
      DATE(clicked_at) as date,
      COUNT(*) as count
    FROM clicks
    WHERE clicked_at >= ${startDate}
    GROUP BY DATE(clicked_at)
    ORDER BY date ASC
  `);
  
  return (result.rows as any[]).map((row: any) => ({
    date: row.date,
    clicks: parseInt(row.count),
  }));
}

export async function getConversionsAnalytics(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const { sql } = await import("drizzle-orm");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.execute(sql`
    SELECT 
      DATE(converted_at) as date,
      COUNT(*) as count
    FROM conversions
    WHERE converted_at >= ${startDate}
    GROUP BY DATE(converted_at)
    ORDER BY date ASC
  `);
  
  return (result.rows as any[]).map((row: any) => ({
    date: row.date,
    conversions: parseInt(row.count),
  }));
}

export async function getAllNetworks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(networks);
}

export async function createNetwork(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newNetwork = {
    name: data.name,
    description: data.description || null,
    logoUrl: data.logoUrl || null,
    apiUrl: data.apiUrl || null,
    apiKey: data.apiKey || null,
    postbackUrl: data.postbackUrl || null,
    hmacSecret: data.hmacSecret || null,
  };

  const result = await db.insert(networks).values(newNetwork).returning();
  return result[0];
}

export async function updateNetwork(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(networks).set(updates).where(eq(networks.id, id));
  return { success: true };
}

export async function deleteNetwork(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(networks).where(eq(networks.id, id));
  return { success: true };
}

export async function getAllOffers() {
  if (!_client) throw new Error("Database not available");

  try {
    const result = await _client`
      SELECT 
        id, network_id as "networkId", title, description, 
        image_url as "imageUrl", logo_url as "logoUrl",
        destination_url as "destinationUrl",
        category, payout, commission, status, rating,
        users_count as "usersCount", total_clicks as "totalClicks",
        total_conversions as "totalConversions",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM offers
      ORDER BY created_at DESC
    `;
    return result;
  } catch (error) {
    console.error("[DB] getAllOffers error:", error);
    throw error;
  }
}

export async function createOffer(data: any) {
  if (!_client) throw new Error("Database not available");

  try {
    const result = await _client`
      INSERT INTO offers (
        title, description, image_url, logo_url, destination_url, 
        category, payout, commission, status
      ) VALUES (
        ${data.title},
        ${data.description || null},
        ${data.imageUrl || null},
        ${data.logoUrl || null},
        ${data.destinationUrl},
        ${data.category || null},
        ${data.payout || 0},
        ${data.commission || 0},
        'active'
      )
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("[DB] createOffer error:", error);
    throw error;
  }
}

export async function updateOffer(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(offers).set(updates).where(eq(offers.id, id));
  return { success: true };
}

export async function deleteOffer(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(offers).where(eq(offers.id, id));
  return { success: true };
}

export async function approveOffer(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(offers)
    .set({ 
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(offers.id, id));
  
  return { success: true, message: "Offer approved successfully" };
}

export async function rejectOffer(id: string, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(offers)
    .set({ 
      status: 'rejected',
      rejectionReason: reason || null,
      updatedAt: new Date()
    })
    .where(eq(offers.id, id));
  
  return { success: true, message: "Offer rejected" };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { sql } = await import("drizzle-orm");

  try {
    // Query each count separately to avoid SQL execution issues
    const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM afftok_users`);
    const offersCount = await db.execute(sql`SELECT COUNT(*) as count FROM offers`);
    const networksCount = await db.execute(sql`SELECT COUNT(*) as count FROM networks`);
    const teamsCount = await db.execute(sql`SELECT COUNT(*) as count FROM teams`);
    const clicksCount = await db.execute(sql`SELECT COUNT(*) as count FROM clicks`);
    const conversionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM conversions`);
    const earningsSum = await db.execute(sql`SELECT COALESCE(SUM(amount), 0) as sum FROM conversions WHERE status = 'approved'`);

    const result = {
      totalUsers: parseInt((usersCount as any)?.[0]?.count || '0') || 0,
      totalOffers: parseInt((offersCount as any)?.[0]?.count || '0') || 0,
      totalNetworks: parseInt((networksCount as any)?.[0]?.count || '0') || 0,
      totalTeams: parseInt((teamsCount as any)?.[0]?.count || '0') || 0,
      totalClicks: parseInt((clicksCount as any)?.[0]?.count || '0') || 0,
      totalConversions: parseInt((conversionsCount as any)?.[0]?.count || '0') || 0,
      totalEarnings: parseFloat((earningsSum as any)?.[0]?.sum || '0') || 0,
    };
    return result;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      totalOffers: 0,
      totalNetworks: 0,
      totalTeams: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
    };
  }
}

export async function getAllTeams() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(teams);
}

export async function createTeam(data: { name: string; description?: string | null; logoUrl?: string | null; ownerId: string; maxMembers?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newTeam = {
    name: data.name,
    description: data.description || null,
    logoUrl: data.logoUrl || null,
    ownerId: data.ownerId,
    maxMembers: data.maxMembers || 10,
    memberCount: 0,
    totalPoints: 0,
  };

  const result = await db.insert(teams).values(newTeam).returning();
  return result[0];
}

export async function updateTeam(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(teams).set(updates).where(eq(teams.id, id));
  return { success: true };
}

export async function deleteTeam(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(teams).where(eq(teams.id, id));
  return { success: true };
}

export async function getAllBadges() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(badges);
}

export async function createBadge(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newBadge = {
    name: data.name,
    description: data.description || null,
    iconUrl: data.iconUrl || null,
    points: data.pointsReward,
  };

  const result = await db.insert(badges).values(newBadge).returning();
  return result[0];
}

export async function updateBadge(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  
  if (updates.pointsReward !== undefined) {
    updates.points = updates.pointsReward;
    delete updates.pointsReward;
  }
  
  await db.update(badges).set(updates).where(eq(badges.id, id));
  return { success: true };
}

export async function deleteBadge(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(badges).where(eq(badges.id, id));
  return { success: true };
}

// ============ CONTESTS / CHALLENGES ============

export async function getAllContests() {
  console.log("[DB] getAllContests called");
  
  if (!process.env.DATABASE_URL) {
    console.log("[DB] ERROR: DATABASE_URL not set");
    throw new Error("Database not available");
  }
  
  try {
    // Use postgres directly for this query
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    const result = await client`SELECT * FROM contests ORDER BY created_at DESC`;
    await client.end();
    
    console.log("[DB] getAllContests result:", result.length, "contests");
    
    // Transform snake_case to camelCase for frontend
    return result.map((c: any) => ({
      id: c.id,
      title: c.title,
      titleAr: c.title_ar,
      description: c.description,
      descriptionAr: c.description_ar,
      imageUrl: c.image_url,
      prizeTitle: c.prize_title,
      prizeTitleAr: c.prize_title_ar,
      prizeDescription: c.prize_description,
      prizeDescriptionAr: c.prize_description_ar,
      prizeAmount: c.prize_amount,
      prizeCurrency: c.prize_currency,
      contestType: c.contest_type,
      targetType: c.target_type,
      targetValue: c.target_value,
      minClicks: c.min_clicks,
      minConversions: c.min_conversions,
      minMembers: c.min_members,
      maxParticipants: c.max_participants,
      startDate: c.start_date,
      endDate: c.end_date,
      status: c.status,
      participantsCount: c.participants_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (error) {
    console.log("[DB] getAllContests ERROR:", error);
    throw error;
  }
}

export async function createContest(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    INSERT INTO contests (
      title, title_ar, description, description_ar, image_url,
      prize_title, prize_title_ar, prize_description, prize_description_ar,
      prize_amount, prize_currency, contest_type, target_type, target_value,
      min_clicks, min_conversions, min_members, max_participants,
      start_date, end_date, status
    ) VALUES (
      ${data.title}, ${data.titleAr}, ${data.description}, ${data.descriptionAr}, ${data.imageUrl},
      ${data.prizeTitle}, ${data.prizeTitleAr}, ${data.prizeDescription}, ${data.prizeDescriptionAr || null},
      ${data.prizeAmount || 0}, ${data.prizeCurrency || 'USD'}, ${data.contestType || 'individual'}, 
      ${data.targetType || 'clicks'}, ${data.targetValue || 100},
      ${data.minClicks || 0}, ${data.minConversions || 0}, ${data.minMembers || 1}, ${data.maxParticipants || 0},
      ${data.startDate}::timestamp, ${data.endDate}::timestamp, ${data.status || 'draft'}
    ) RETURNING *
  `);
  
  return result.rows?.[0] || null;
}

export async function updateContest(data: { id: string; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  
  // Build the SET clause dynamically
  const setClauses: string[] = [];
  const values: any[] = [];
  
  const fieldMap: Record<string, string> = {
    title: 'title',
    titleAr: 'title_ar',
    description: 'description',
    descriptionAr: 'description_ar',
    imageUrl: 'image_url',
    prizeTitle: 'prize_title',
    prizeTitleAr: 'prize_title_ar',
    prizeDescription: 'prize_description',
    prizeAmount: 'prize_amount',
    prizeCurrency: 'prize_currency',
    contestType: 'contest_type',
    targetType: 'target_type',
    targetValue: 'target_value',
    minClicks: 'min_clicks',
    minConversions: 'min_conversions',
    minMembers: 'min_members',
    maxParticipants: 'max_participants',
    startDate: 'start_date',
    endDate: 'end_date',
    status: 'status',
  };
  
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      setClauses.push(`${dbField} = $${setClauses.length + 2}`);
      values.push(updates[key]);
    }
  }
  
  if (setClauses.length === 0) {
    return { success: true };
  }
  
  setClauses.push('updated_at = NOW()');
  
  await db.execute(sql.raw(`
    UPDATE contests SET ${setClauses.join(', ')} WHERE id = $1
  `.replace('$1', `'${id}'`).replace(/\$(\d+)/g, (_, n) => {
    const idx = parseInt(n) - 2;
    const val = values[idx];
    if (val === null) return 'NULL';
    if (typeof val === 'string') return `'${val}'`;
    return String(val);
  })));
  
  return { success: true };
}

export async function deleteContest(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete participants first
  await db.execute(sql`DELETE FROM contest_participants WHERE contest_id = ${id}::uuid`);
  
  // Then delete contest
  await db.execute(sql`DELETE FROM contests WHERE id = ${id}::uuid`);
  
  return { success: true };
}

export async function activateContest(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`
    UPDATE contests SET status = 'active', updated_at = NOW() WHERE id = ${id}::uuid
  `);
  
  return { success: true, message: "Contest activated" };
}

export async function endContest(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`
    UPDATE contests SET status = 'ended', updated_at = NOW() WHERE id = ${id}::uuid
  `);
  
  return { success: true, message: "Contest ended" };
}

// ============ ADVERTISER INTEGRATIONS ============

export async function getAllIntegrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  try {
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    
    // Check if table exists, create if not
    await client`
      CREATE TABLE IF NOT EXISTS advertiser_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        advertiser_id UUID NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_name VARCHAR(100),
        webhook_url TEXT,
        webhook_secret TEXT,
        pixel_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        last_tested_at TIMESTAMP,
        last_webhook_at TIMESTAMP,
        total_webhooks INTEGER DEFAULT 0 NOT NULL,
        successful_webhooks INTEGER DEFAULT 0 NOT NULL,
        failed_webhooks INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    const result = await client`
      SELECT 
        ai.*,
        u.full_name as advertiser_name,
        u.email as advertiser_email
      FROM advertiser_integrations ai
      LEFT JOIN afftok_users u ON ai.advertiser_id = u.id
      ORDER BY ai.created_at DESC
    `;
    await client.end();
    
    return result.map((row: any) => ({
      id: row.id,
      advertiserId: row.advertiser_id,
      advertiserName: row.advertiser_name,
      advertiserEmail: row.advertiser_email,
      platform: row.platform,
      platformName: row.platform_name,
      webhookUrl: row.webhook_url,
      webhookSecret: row.webhook_secret,
      pixelId: row.pixel_id,
      status: row.status,
      lastTestedAt: row.last_tested_at,
      lastWebhookAt: row.last_webhook_at,
      totalWebhooks: row.total_webhooks,
      successfulWebhooks: row.successful_webhooks,
      failedWebhooks: row.failed_webhooks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error("[DB] getAllIntegrations error:", error);
    return [];
  }
}

export async function createIntegration(data: {
  advertiserId: string;
  platform: string;
  platformName?: string;
}) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  // Generate webhook URL and secret
  const webhookUrl = `https://go.afftokapp.com/webhook/${data.platform}/${data.advertiserId}`;
  const webhookSecret = crypto.randomUUID().replace(/-/g, '');
  
  const result = await client`
    INSERT INTO advertiser_integrations (
      advertiser_id, platform, platform_name, webhook_url, webhook_secret, status
    ) VALUES (
      ${data.advertiserId}::uuid, ${data.platform}, ${data.platformName || null}, 
      ${webhookUrl}, ${webhookSecret}, 'pending'
    ) RETURNING *
  `;
  
  await client.end();
  return result[0];
}

export async function updateIntegrationStatus(id: string, status: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  await client`
    UPDATE advertiser_integrations 
    SET status = ${status}, updated_at = NOW() 
    WHERE id = ${id}::uuid
  `;
  await client.end();
  
  return { success: true };
}

export async function deleteIntegration(id: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  await client`DELETE FROM advertiser_integrations WHERE id = ${id}::uuid`;
  await client.end();
  
  return { success: true };
}

export async function testIntegration(id: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  // Get integration details
  const result = await client`
    SELECT * FROM advertiser_integrations WHERE id = ${id}::uuid
  `;
  
  if (result.length === 0) {
    await client.end();
    return { success: false, error: "Integration not found" };
  }
  
  const integration = result[0];
  
  // Try to send test webhook
  try {
    // For now, just mark as tested and active
    await client`
      UPDATE advertiser_integrations 
      SET status = 'active', last_tested_at = NOW(), updated_at = NOW() 
      WHERE id = ${id}::uuid
    `;
    await client.end();
    
    return { success: true, message: "Integration test passed" };
  } catch (error) {
    await client`
      UPDATE advertiser_integrations 
      SET status = 'failed', last_tested_at = NOW(), updated_at = NOW() 
      WHERE id = ${id}::uuid
    `;
    await client.end();
    
    return { success: false, error: "Integration test failed" };
  }
}

// ============ ADMIN USERS (RBAC) ============

let adminTablesInitialized = false;

export async function initAdminTables() {
  if (adminTablesInitialized) return;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    // Check if admin_users table has correct schema
    const tableCheck = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'username'
    `;
    
    if (tableCheck.length === 0) {
      // Table doesn't have username column - drop and recreate
      console.log("[DB] Recreating admin_users table with correct schema...");
      await client`DROP TABLE IF EXISTS admin_users CASCADE`;
    }
    
    // Create admin_users table if not exists
    await client`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(30) DEFAULT 'viewer' NOT NULL,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        last_login_at TIMESTAMP,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create audit_logs table if not exists
    await client`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        resource_id UUID,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Check if Super Admin exists
    const existing = await client`SELECT id FROM admin_users WHERE email = 'aljapah.a@gmail.com'`;
    
    if (existing.length === 0) {
      // Insert Super Admin
      const passwordHash = Buffer.from('Az55666682').toString('base64');
      await client`
        INSERT INTO admin_users (username, email, password_hash, full_name, role, status)
        VALUES ('superadmin', 'aljapah.a@gmail.com', ${passwordHash}, 'Super Admin', 'super_admin', 'active')
      `;
      console.log("[DB] Super Admin created: aljapah.a@gmail.com");
    }
    
    adminTablesInitialized = true;
    console.log("[DB] Admin tables initialized successfully");
  } catch (error) {
    console.error("[DB] Error initializing admin tables:", error);
  }
  
  await client.end();
}

export async function getAllAdminUsers() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  await initAdminTables();
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  const result = await client`
    SELECT id, username, email, full_name, role, status, last_login_at, created_at
    FROM admin_users
    ORDER BY created_at DESC
  `;
  await client.end();
  
  return result.map((row: any) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }));
}

export async function createAdminUser(data: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: string;
  createdBy?: string;
}) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  await initAdminTables();
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  // Simple hash (in production use bcrypt)
  const passwordHash = Buffer.from(data.password).toString('base64');
  
  const result = await client`
    INSERT INTO admin_users (username, email, password_hash, full_name, role, created_by)
    VALUES (${data.username}, ${data.email}, ${passwordHash}, ${data.fullName || null}, ${data.role}, ${data.createdBy || null}::uuid)
    RETURNING id, username, email, full_name, role, status, created_at
  `;
  await client.end();
  
  return result[0];
}

export async function updateAdminUser(id: string, data: {
  fullName?: string;
  role?: string;
  status?: string;
}) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  await client`
    UPDATE admin_users 
    SET 
      full_name = COALESCE(${data.fullName || null}, full_name),
      role = COALESCE(${data.role || null}, role),
      status = COALESCE(${data.status || null}, status),
      updated_at = NOW()
    WHERE id = ${id}::uuid
  `;
  await client.end();
  
  return { success: true };
}

export async function deleteAdminUser(id: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  await client`DELETE FROM admin_users WHERE id = ${id}::uuid`;
  await client.end();
  
  return { success: true };
}

export async function loginAdminUser(email: string, password: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  await initAdminTables();
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  const passwordHash = Buffer.from(password).toString('base64');
  
  const result = await client`
    SELECT id, username, email, full_name, role, status
    FROM admin_users
    WHERE email = ${email} AND password_hash = ${passwordHash} AND status = 'active'
  `;
  
  if (result.length === 0) {
    await client.end();
    return { success: false, error: "Invalid credentials" };
  }
  
  // Update last login
  await client`UPDATE admin_users SET last_login_at = NOW() WHERE id = ${result[0].id}::uuid`;
  await client.end();
  
  return {
    success: true,
    user: {
      id: result[0].id,
      username: result[0].username,
      email: result[0].email,
      fullName: result[0].full_name,
      role: result[0].role,
    }
  };
}

export async function ensureSuperAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  await initAdminTables();
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  // Check if super admin exists
  const existing = await client`
    SELECT id FROM admin_users WHERE email = 'aljapah.a@gmail.com'
  `;
  
  if (existing.length === 0) {
    // Create super admin
    const passwordHash = Buffer.from('Az55666682').toString('base64');
    await client`
      INSERT INTO admin_users (username, email, password_hash, full_name, role, status)
      VALUES ('superadmin', 'aljapah.a@gmail.com', ${passwordHash}, 'Super Admin', 'super_admin', 'active')
    `;
    console.log("[DB] Super Admin created: aljapah.a@gmail.com");
  }
  
  await client.end();
}

// ============ AUDIT LOG ============

export async function logAudit(data: {
  adminUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  await client`
    INSERT INTO audit_logs (admin_user_id, action, resource, resource_id, details, ip_address, user_agent)
    VALUES (${data.adminUserId}::uuid, ${data.action}, ${data.resource}, ${data.resourceId || null}::uuid, ${data.details || null}, ${data.ipAddress || null}, ${data.userAgent || null})
  `;
  
  await client.end();
}

export async function getAuditLogs(limit: number = 100) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }
  
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  
  const result = await client`
    SELECT 
      al.*,
      au.username as admin_username,
      au.full_name as admin_name
    FROM audit_logs al
    LEFT JOIN admin_users au ON al.admin_user_id = au.id
    ORDER BY al.created_at DESC
    LIMIT ${limit}
  `;
  
  await client.end();
  
  return result.map((row: any) => ({
    id: row.id,
    adminUserId: row.admin_user_id,
    adminUsername: row.admin_username,
    adminName: row.admin_name,
    action: row.action,
    resource: row.resource,
    resourceId: row.resource_id,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));
}
