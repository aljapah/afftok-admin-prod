import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  dashboard: router({
    stats: publicProcedure.query(async () => {
      const { getDashboardStats } = await import("./db");
      return getDashboardStats();
    }),
    clicksAnalytics: publicProcedure
      .input((input: unknown) => {
        return z.object({ days: z.number().int().min(1).max(365).optional() }).parse(input);
      })
      .query(async ({ input }) => {
        const { getClicksAnalytics } = await import("./db");
        return getClicksAnalytics(input.days);
      }),
    conversionsAnalytics: publicProcedure
      .input((input: unknown) => {
        return z.object({ days: z.number().int().min(1).max(365).optional() }).parse(input);
      })
      .query(async ({ input }) => {
        const { getConversionsAnalytics } = await import("./db");
        return getConversionsAnalytics(input.days);
      }),
    offersByCategory: publicProcedure.query(async () => {
      const { getOffersByCategory } = await import("./db");
      return getOffersByCategory();
    }),
    topPromoters: publicProcedure.query(async () => {
      const { getTopPromoters } = await import("./db");
      return getTopPromoters();
    }),
    clicksVsConversions: publicProcedure.query(async () => {
      const { getClicksVsConversions } = await import("./db");
      return getClicksVsConversions();
    }),
  }),
  
  users: router({
    list: publicProcedure.query(async () => {
      const { getAllAfftokUsers } = await import("./db");
      return getAllAfftokUsers();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          username: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(6),
          fullName: z.string().optional(),
          role: z.enum(['user', 'admin', 'advertiser']).default('user'),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createAfftokUser } = await import("./db");
        return createAfftokUser(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          username: z.string().min(3).optional(),
          email: z.string().email().optional(),
          fullName: z.string().optional(),
          country: z.string().optional(),
          role: z.enum(['user', 'admin', 'advertiser']).default('user').optional(),
          status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
          points: z.number().int().min(0).optional(),
          level: z.number().int().min(1).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateAfftokUser } = await import("./db");
        return updateAfftokUser(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteAfftokUser } = await import("./db");
        return deleteAfftokUser(input.id);
      }),
    setDefaultCountry: publicProcedure
      .input((input: unknown) => {
        return z.object({ countryCode: z.string().length(2) }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { setDefaultCountryForUsers } = await import("./db");
        return setDefaultCountryForUsers(input.countryCode);
      }),
    addCountryColumn: publicProcedure
      .mutation(async () => {
        const { addCountryColumnToUsers } = await import("./db");
        return addCountryColumnToUsers();
      }),
  }),
  
  networks: router({
    list: publicProcedure.query(async () => {
      const { getAllNetworks } = await import("./db");
      return getAllNetworks();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          logoUrl: z.string().url().optional(),
          apiUrl: z.string().url().optional(),
          apiKey: z.string().optional(),
          postbackUrl: z.string().url().optional(),
          hmacSecret: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createNetwork } = await import("./db");
        return createNetwork(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          logoUrl: z.string().url().optional(),
          apiUrl: z.string().url().optional(),
          apiKey: z.string().optional(),
          postbackUrl: z.string().url().optional(),
          hmacSecret: z.string().optional(),
          status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateNetwork } = await import("./db");
        return updateNetwork(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteNetwork } = await import("./db");
        return deleteNetwork(input.id);
      }),
  }),
  
  offers: router({
    list: publicProcedure.query(async () => {
      const { getAllOffers } = await import("./db");
      return getAllOffers();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          terms: z.string().optional(), // الشروط العامة بالإنجليزية
          // Arabic fields
          titleAr: z.string().optional(),
          descriptionAr: z.string().optional(),
          termsAr: z.string().optional(),
          // Images
          imageUrl: z.string().url().optional().or(z.literal('')),
          logoUrl: z.string().url().optional().or(z.literal('')),
          // Settings
          destinationUrl: z.string().url(),
          category: z.string().optional(),
          payout: z.number().int().min(0),
          commission: z.number().int().min(0),
          payoutType: z.enum(['cpa', 'cpl', 'cps', 'cpi']).optional(),
          networkId: z.string().optional(),
          advertiserId: z.string().optional(), // المعلن صاحب العرض
          // Geo Targeting
          targetCountries: z.array(z.string()).optional(), // الدول المستهدفة
          blockedCountries: z.array(z.string()).optional(), // الدول الممنوعة
          // Tracking
          trackingType: z.enum(['cookie', 'coupon', 'link']).optional(), // نوع التتبع
          // Notes
          additionalNotes: z.string().optional(), // ملاحظات إضافية
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createOffer } = await import("./db");
        return createOffer(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          terms: z.string().optional(), // الشروط العامة بالإنجليزية
          // Arabic fields
          titleAr: z.string().optional(),
          descriptionAr: z.string().optional(),
          termsAr: z.string().optional(),
          // Images
          imageUrl: z.string().url().optional().or(z.literal('')),
          logoUrl: z.string().url().optional().or(z.literal('')),
          // Settings
          destinationUrl: z.string().url().optional(),
          category: z.string().optional(),
          payout: z.number().int().min(0).optional(),
          commission: z.number().int().min(0).optional(),
          payoutType: z.enum(['cpa', 'cpl', 'cps', 'cpi']).optional(),
          status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
          // Geo Targeting
          targetCountries: z.array(z.string()).optional(), // الدول المستهدفة
          blockedCountries: z.array(z.string()).optional(), // الدول الممنوعة
          // Tracking
          trackingType: z.enum(['cookie', 'coupon', 'link']).optional(), // نوع التتبع
          // Notes
          additionalNotes: z.string().optional(), // ملاحظات إضافية
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateOffer } = await import("./db");
        return updateOffer(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteOffer } = await import("./db");
        return deleteOffer(input.id);
      }),
    approve: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { approveOffer } = await import("./db");
        return approveOffer(input.id);
      }),
    reject: publicProcedure
      .input((input: unknown) => {
        return z.object({ 
          id: z.string(),
          reason: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { rejectOffer } = await import("./db");
        return rejectOffer(input.id, input.reason);
      }),
  }),
  
  teams: router({
    list: publicProcedure.query(async () => {
      const { getAllTeams } = await import("./db");
      return getAllTeams();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createTeam, getAllAfftokUsers } = await import("./db");
        
        const users = await getAllAfftokUsers();
        if (!users || users.length === 0) {
          throw new Error("No users found. Please create a user first.");
        }
        
        const defaultOwnerId = users[0].id;
        
        return createTeam({
            ...input,
            ownerId: input.ownerId || defaultOwnerId,
        });
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateTeam } = await import("./db");
        return updateTeam(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteTeam } = await import("./db");
        return deleteTeam(input.id);
      }),
  }),
  
  badges: router({
    list: publicProcedure.query(async () => {
      const { getAllBadges } = await import("./db");
      return getAllBadges();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          iconUrl: z.string().optional(),
          criteria: z.enum(['clicks', 'conversions', 'earnings', 'points']),
          requiredValue: z.number().int().min(1),
          pointsReward: z.number().int().min(0),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createBadge } = await import("./db");
        return createBadge(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          iconUrl: z.string().optional(),
          criteria: z.enum(['clicks', 'conversions', 'earnings', 'points']).optional(),
          requiredValue: z.number().int().min(1).optional(),
          pointsReward: z.number().int().min(0).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateBadge } = await import("./db");
        return updateBadge(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteBadge } = await import("./db");
        return deleteBadge(input.id);
      }),
  }),

  // ============ CONTESTS / المسابقات ============
  contests: router({
    list: publicProcedure.query(async () => {
      const { getAllContests } = await import("./db");
      return getAllContests();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          title: z.string().min(1),
          titleAr: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
          descriptionAr: z.string().optional().nullable(),
          imageUrl: z.string().optional().nullable(),
          prizeTitle: z.string().optional().nullable(),
          prizeTitleAr: z.string().optional().nullable(),
          prizeDescription: z.string().optional().nullable(),
          prizeAmount: z.number().min(0).optional(),
          prizeCurrency: z.string().optional(),
          contestType: z.enum(['individual', 'team']).optional(),
          targetType: z.enum(['clicks', 'conversions', 'referrals', 'points']).optional(),
          targetValue: z.number().int().min(1).optional(),
          minClicks: z.number().int().min(0).optional(),
          minConversions: z.number().int().min(0).optional(),
          minMembers: z.number().int().min(1).optional(),
          maxParticipants: z.number().int().min(0).optional(),
          startDate: z.string(),
          endDate: z.string(),
          status: z.enum(['draft', 'active', 'ended', 'cancelled']).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createContest } = await import("./db");
        return createContest(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          title: z.string().min(1).optional(),
          titleAr: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
          descriptionAr: z.string().optional().nullable(),
          imageUrl: z.string().optional().nullable(),
          prizeTitle: z.string().optional().nullable(),
          prizeTitleAr: z.string().optional().nullable(),
          prizeDescription: z.string().optional().nullable(),
          prizeAmount: z.number().min(0).optional(),
          prizeCurrency: z.string().optional(),
          contestType: z.enum(['individual', 'team']).optional(),
          targetType: z.enum(['clicks', 'conversions', 'referrals', 'points']).optional(),
          targetValue: z.number().int().min(1).optional(),
          minClicks: z.number().int().min(0).optional(),
          minConversions: z.number().int().min(0).optional(),
          minMembers: z.number().int().min(1).optional(),
          maxParticipants: z.number().int().min(0).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          status: z.enum(['draft', 'active', 'ended', 'cancelled']).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateContest } = await import("./db");
        return updateContest(input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteContest } = await import("./db");
        return deleteContest(input.id);
      }),
    activate: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { activateContest } = await import("./db");
        return activateContest(input.id);
      }),
    end: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { endContest } = await import("./db");
        return endContest(input.id);
      }),
  }),

  // ============ ADMIN USERS (RBAC) ============
  adminUsers: router({
    list: publicProcedure.query(async () => {
      const { getAllAdminUsers, ensureSuperAdmin } = await import("./db");
      await ensureSuperAdmin();
      return getAllAdminUsers();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          username: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(6),
          fullName: z.string().optional(),
          role: z.enum(['super_admin', 'finance_admin', 'tech_admin', 'advertiser_manager', 'promoter_support', 'fraud_reviewer', 'viewer']),
          createdBy: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createAdminUser } = await import("./db");
        return createAdminUser(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          fullName: z.string().optional(),
          role: z.enum(['super_admin', 'finance_admin', 'tech_admin', 'advertiser_manager', 'promoter_support', 'fraud_reviewer', 'viewer']).optional(),
          status: z.enum(['active', 'inactive', 'suspended']).optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateAdminUser } = await import("./db");
        return updateAdminUser(input.id, input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteAdminUser } = await import("./db");
        return deleteAdminUser(input.id);
      }),
    login: publicProcedure
      .input((input: unknown) => {
        return z.object({
          email: z.string().email(),
          password: z.string(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { loginAdminUser, ensureSuperAdmin } = await import("./db");
        await ensureSuperAdmin();
        return loginAdminUser(input.email, input.password);
      }),
  }),

  // ============ AUDIT LOG ============
  auditLog: router({
    list: publicProcedure
      .input((input: unknown) => {
        return z.object({
          limit: z.number().min(1).max(500).optional(),
        }).parse(input);
      })
      .query(async ({ input }) => {
        const { getAuditLogs } = await import("./db");
        return getAuditLogs(input.limit || 100);
      }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          adminUserId: z.string(),
          action: z.string(),
          resource: z.string(),
          resourceId: z.string().optional(),
          details: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { logAudit } = await import("./db");
        return logAudit(input);
      }),
  }),

  // ============ INTEGRATIONS ============
  integrations: router({
    list: publicProcedure.query(async () => {
      const { getAllIntegrations } = await import("./db");
      return getAllIntegrations();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          advertiserId: z.string(),
          platform: z.enum(['shopify', 'salla', 'zid', 'woocommerce', 'custom']),
          platformName: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createIntegration } = await import("./db");
        return createIntegration(input);
      }),
    updateStatus: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          status: z.enum(['pending', 'active', 'failed', 'paused']),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateIntegrationStatus } = await import("./db");
        return updateIntegrationStatus(input.id, input.status);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteIntegration } = await import("./db");
        return deleteIntegration(input.id);
      }),
    test: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { testIntegration } = await import("./db");
        return testIntegration(input.id);
      }),
  }),

  logs: router({
    list: publicProcedure
      .input((input: unknown) => {
        return z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(input);
      })
      .query(async ({ input }) => {
        const { getAuditLogs } = await import("./db");
        return getAuditLogs(input.limit || 100);
      }),
  }),

  monitoring: router({
    stats: publicProcedure.query(async () => {
      const { getSystemStats } = await import("./db");
      return getSystemStats();
    }),
    health: publicProcedure.query(async () => {
      const { getServicesHealth } = await import("./db");
      return getServicesHealth();
    }),
    clicksTimeSeries: publicProcedure.query(async () => {
      const { getClicksTimeSeries } = await import("./db");
      return getClicksTimeSeries();
    }),
    latencyTimeSeries: publicProcedure.query(async () => {
      const { getLatencyTimeSeries } = await import("./db");
      return getLatencyTimeSeries();
    }),
  }),

  tenants: router({
    list: publicProcedure.query(async () => {
      const { getTenants } = await import("./db");
      return getTenants();
    }),
    stats: publicProcedure.query(async () => {
      const { getTenantsStats } = await import("./db");
      return getTenantsStats();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string(),
          slug: z.string(),
          adminEmail: z.string().email(),
          plan: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createTenant } = await import("./db");
        return createTenant(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().optional(),
          slug: z.string().optional(),
          status: z.string().optional(),
          plan: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateTenant } = await import("./db");
        return updateTenant(input.id, input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteTenant } = await import("./db");
        return deleteTenant(input.id);
      }),
  }),

  webhooks: router({
    list: publicProcedure.query(async () => {
      const { getWebhooks } = await import("./db");
      return getWebhooks();
    }),
    stats: publicProcedure.query(async () => {
      const { getWebhooksStats } = await import("./db");
      return getWebhooksStats();
    }),
    dlq: publicProcedure.query(async () => {
      const { getWebhookDLQ } = await import("./db");
      return getWebhookDLQ();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string(),
          url: z.string().url(),
          triggerType: z.string(),
          signatureMode: z.string().optional(),
          secret: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createWebhook } = await import("./db");
        return createWebhook(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().optional(),
          url: z.string().optional(),
          triggerType: z.string().optional(),
          signatureMode: z.string().optional(),
          status: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateWebhook } = await import("./db");
        return updateWebhook(input.id, input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteWebhook } = await import("./db");
        return deleteWebhook(input.id);
      }),
    deleteDLQ: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteDLQItem } = await import("./db");
        return deleteDLQItem(input.id);
      }),
  }),

  geoRules: router({
    list: publicProcedure.query(async () => {
      const { getGeoRules, initGeoRulesTable } = await import("./db");
      await initGeoRulesTable();
      return getGeoRules();
    }),
    stats: publicProcedure.query(async () => {
      const { getGeoRulesStats } = await import("./db");
      return getGeoRulesStats();
    }),
    create: publicProcedure
      .input((input: unknown) => {
        return z.object({
          name: z.string(),
          scopeType: z.string().optional(),
          scopeId: z.string().optional(),
          mode: z.string(),
          countries: z.array(z.string()),
          priority: z.number().optional(),
          status: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { createGeoRule } = await import("./db");
        return createGeoRule(input);
      }),
    update: publicProcedure
      .input((input: unknown) => {
        return z.object({
          id: z.string(),
          name: z.string().optional(),
          mode: z.string().optional(),
          countries: z.array(z.string()).optional(),
          priority: z.number().optional(),
          status: z.string().optional(),
        }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { updateGeoRule } = await import("./db");
        return updateGeoRule(input.id, input);
      }),
    delete: publicProcedure
      .input((input: unknown) => {
        return z.object({ id: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { deleteGeoRule } = await import("./db");
        return deleteGeoRule(input.id);
      }),
  }),

  fraud: router({
    stats: publicProcedure.query(async () => {
      const { getFraudStats, initFraudTable } = await import("./db");
      await initFraudTable();
      return getFraudStats();
    }),
    events: publicProcedure
      .input((input: unknown) => {
        return z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(input);
      })
      .query(async ({ input }) => {
        const { getFraudEvents } = await import("./db");
        return getFraudEvents(input.limit || 100);
      }),
    block: publicProcedure
      .input((input: unknown) => {
        return z.object({ ipAddress: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { blockIP } = await import("./db");
        return blockIP(input.ipAddress);
      }),
    unblock: publicProcedure
      .input((input: unknown) => {
        return z.object({ ipAddress: z.string() }).parse(input);
      })
      .mutation(async ({ input }) => {
        const { unblockIP } = await import("./db");
        return unblockIP(input.ipAddress);
      }),
  }),
});
