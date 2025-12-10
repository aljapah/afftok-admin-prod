import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/app_localizations.dart';
import '../models/user.dart';
import '../models/user_offer.dart';
import '../models/team.dart';
import '../providers/auth_provider.dart';
import 'settings_screen.dart';
import 'teams_screen.dart';
import 'home_feed_screen.dart';
import 'webview_screen.dart';
import 'promoter_public_page.dart';
import 'advertiser/advertiser_dashboard_screen.dart';
import 'role_selection_screen.dart';

class WebViewPage extends StatelessWidget {
  final String url;
  final String title;

  const WebViewPage({Key? key, required this.url, required this.title})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.black,
      ),
      body: WebViewScreen(url: url, title: title, offerId: ''),
    );
  }
}

class ProfileScreenEnhanced extends StatefulWidget {
  const ProfileScreenEnhanced({Key? key}) : super(key: key);

  @override
  State<ProfileScreenEnhanced> createState() => _ProfileScreenEnhancedState();
}

class _ProfileScreenEnhancedState extends State<ProfileScreenEnhanced> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshData();
    });
  }
  
  Future<void> _refreshData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    // Only refresh if logged in
    if (authProvider.isLoggedIn) {
      await authProvider.loadCurrentUser(forceRefresh: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLocalizations.of(context);
    
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // If not logged in, redirect to role selection
        if (!authProvider.isLoggedIn) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const RoleSelectionScreen()),
              (route) => false,
            );
          });
          return Scaffold(
            backgroundColor: Colors.black,
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        final user = authProvider.currentUser;
        
        // If user is null and still loading, show loading indicator
        if (user == null && authProvider.isLoading) {
          return Scaffold(
            backgroundColor: Colors.black,
            appBar: AppBar(
              backgroundColor: Colors.black,
              title: Text(lang.profile),
            ),
            body: const Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        // If user is null and not loading, redirect to login
        if (user == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const RoleSelectionScreen()),
              (route) => false,
            );
          });
          return Scaffold(
            backgroundColor: Colors.black,
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        // If user is advertiser, redirect to advertiser dashboard
        if (user.isAdvertiser) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const AdvertiserDashboardScreen()),
            );
          });
          return Scaffold(
            backgroundColor: Colors.black,
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        
        return Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            title: Text(
              lang.profile,
              style: const TextStyle(color: Colors.white),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              // Refresh button
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white),
                onPressed: () => _refreshData(),
              ),
              IconButton(
                icon: const Icon(Icons.settings, color: Colors.white),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SettingsScreen()),
                  );
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _refreshData,
            color: const Color(0xFFFF006E),
            backgroundColor: Colors.grey[900],
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  
                  // Profile Header
                  _buildProfileHeader(context, user, lang),
                  
                  const SizedBox(height: 24),
                  
                  // Personal Link Card
                  _buildPersonalLinkCard(context, user, lang),
                  
                  const SizedBox(height: 24),
                  
                  // Payment Method Card
                  _buildPaymentMethodCard(context, user, lang),
                  
                  const SizedBox(height: 24),
                  
                  // Stats Cards
                  _buildStatsCards(context, user, lang),
                  
                  const SizedBox(height: 24),
                  
                  // Team Section (if in team)
                  if (user.isInTeam) ...[
                    _buildTeamSection(context, lang),
                    const SizedBox(height: 24),
                  ],
                  
                  // Add New Offers Button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const HomeFeedScreen()),
                          );
                        },
                        icon: const Icon(Icons.add, color: Colors.white),
                        label: Text(
                          lang.addMoreOffers,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF006E),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(BuildContext context, User user, AppLocalizations lang) {
    return Column(
      children: [
        // Avatar with level badge
        Stack(
          clipBehavior: Clip.none,
          children: [
            TweenAnimationBuilder(
              duration: const Duration(milliseconds: 800),
              tween: Tween<double>(begin: 0, end: 1),
              builder: (context, double value, child) {
                return Transform.scale(
                  scale: value,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF006E), Color(0xFFFF4D00)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF006E).withOpacity(0.5),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(3),
                    child: Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.black,
                      ),
                        child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.grey[800],
                        ),
                        child: user.avatarUrl != null && user.avatarUrl!.isNotEmpty
                            ? ClipOval(
                                child: Image.network(
                                  user.avatarUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(
                                      Icons.person,
                                      size: 40,
                                      color: Colors.white,
                                    );
                                  },
                                ),
                              )
                            : const Icon(
                                Icons.person,
                                size: 40,
                                color: Colors.white,
                              ),
                      ),
                    ),
                  ),
                );
              },
            ),
            // Level Badge
            Positioned(
              bottom: -5,
              right: -5,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF006E), Color(0xFFFF4D00)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.black, width: 2),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      user.level.emoji,
                      style: const TextStyle(fontSize: 12),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      user.level.displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Display Name
        Text(
          user.displayName,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 4),
        
        // Username
        Text(
          '@${user.username}',
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 14,
          ),
        ),
        
        // Bio (if exists)
        if (user.bio != null && user.bio!.isNotEmpty) ...[
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              user.bio!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 13,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
        
        const SizedBox(height: 8),
        
        // Rank Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🏆', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                '${lang.rank} #${user.stats.globalRank}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalLinkCard(BuildContext context, User user, AppLocalizations lang) {
    // Unique link with unique code (falls back to username if no code)
    final uniqueCode = user.uniqueCode;
    final uniqueLink = (uniqueCode != null && uniqueCode.isNotEmpty)
        ? 'https://go.afftokapp.com/r/$uniqueCode'
        : 'https://go.afftokapp.com/@${user.username}';
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFFFF006E).withOpacity(0.25),
              const Color(0xFFFF4D00).withOpacity(0.15),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFFF006E).withOpacity(0.4),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFF006E).withOpacity(0.2),
              blurRadius: 15,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF006E).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.link,
                    color: Color(0xFFFF006E),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.locale.languageCode == 'ar' 
                            ? '🔗 رابطك الفريد' 
                            : '🔗 Your Unique Link',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        lang.locale.languageCode == 'ar'
                            ? 'شاركه لكسب العمولات'
                            : 'Share it to earn commissions',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Clickable unique link
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PromoterPublicPage(username: user.username),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFF006E).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.open_in_new,
                      color: Color(0xFFFF006E),
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        uniqueLink,
                        style: const TextStyle(
                          color: Color(0xFFFF006E),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                          decorationColor: Color(0xFFFF006E),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    icon: Icons.copy,
                    label: lang.copy,
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: uniqueLink));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(lang.linkCopied),
                          backgroundColor: const Color(0xFFFF006E),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ActionButton(
                    icon: Icons.share,
                    label: lang.share,
                    onTap: () {
                      Share.share(
                        uniqueLink,
                        subject: 'Check out my AffTok profile!',
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ActionButton(
                    icon: Icons.qr_code,
                    label: 'QR',
                    onTap: () {
                      _showQRCodeDialog(context, user, lang);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodCard(BuildContext context, User user, AppLocalizations lang) {
    final isArabic = lang.locale.languageCode == 'ar';
    final hasPaymentMethod = user.paymentMethod != null && user.paymentMethod!.isNotEmpty;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF00FF88).withOpacity(0.15),
              const Color(0xFF00D9FF).withOpacity(0.08),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFF00FF88).withOpacity(0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Info & Edit Buttons
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00FF88).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet,
                    color: Color(0xFF00FF88),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isArabic ? 'طريقة استلام الأرباح' : 'How You Get Paid',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isArabic
                            ? 'يراها المعلن للتواصل معك'
                            : 'Visible to advertisers',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                // Info Button - How to register
                GestureDetector(
                  onTap: () => _showPaymentMethodsInfoDialog(context, isArabic),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.help_outline,
                      color: Colors.blue,
                      size: 18,
                    ),
                  ),
                ),
                // Edit Button
                IconButton(
                  onPressed: () => _showEditPaymentMethodDialog(context, user, lang),
                  icon: Icon(
                    hasPaymentMethod ? Icons.edit : Icons.add_circle_outline,
                    color: const Color(0xFF00FF88),
                    size: 22,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Current Payment Method Display
            GestureDetector(
              onTap: () => _showEditPaymentMethodDialog(context, user, lang),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: hasPaymentMethod 
                        ? const Color(0xFF00FF88).withOpacity(0.3)
                        : Colors.orange.withOpacity(0.3),
                  ),
                ),
                child: hasPaymentMethod
                    ? Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: Color(0xFF00FF88),
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              user.paymentMethod!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.edit_note,
                            color: Colors.white.withOpacity(0.5),
                            size: 18,
                          ),
                        ],
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            color: Colors.orange.withOpacity(0.8),
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isArabic
                                ? '⚠️ اضغط هنا لإضافة طريقة الدفع'
                                : '⚠️ Tap here to add payment method',
                            style: TextStyle(
                              color: Colors.orange.withOpacity(0.9),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Payoneer Coming Soon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFF6B00).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFF6B00).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF6B00).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.account_balance_wallet, color: Color(0xFFFF6B00), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Payoneer',
                              style: TextStyle(
                                color: Color(0xFFFF6B00),
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.orange.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                isArabic ? 'قريباً' : 'Soon',
                                style: const TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isArabic ? 'نظام دفع موحد وآلي لجميع العروض' : 'Unified & automated payment system',
                          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPaymentSourceItem({
    required IconData icon,
    required Color color,
    required String name,
    required String description,
    bool isComingSoon = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: color,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (isComingSoon) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Soon',
                          style: TextStyle(
                            color: Colors.orange,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Keep old method for backward compatibility but unused now
  Widget _buildOldPaymentMethodCard(BuildContext context, User user, AppLocalizations lang) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF00FF88).withOpacity(0.15),
              const Color(0xFF00D9FF).withOpacity(0.08),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFF00FF88).withOpacity(0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00FF88).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet,
                    color: Color(0xFF00FF88),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.locale.languageCode == 'ar' 
                            ? 'طريقة استلام الأرباح' 
                            : 'Payment Method',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        lang.locale.languageCode == 'ar'
                            ? 'يراها المعلن للتواصل معك'
                            : 'Visible to advertisers',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _showEditPaymentMethodDialog(context, user, lang),
                  icon: Icon(
                    user.paymentMethod != null && user.paymentMethod!.isNotEmpty
                        ? Icons.edit
                        : Icons.add_circle_outline,
                    color: const Color(0xFF00FF88),
                    size: 22,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
              child: user.paymentMethod != null && user.paymentMethod!.isNotEmpty
                  ? Row(
                      children: [
                        const Icon(
                          Icons.check_circle,
                          color: Color(0xFF00FF88),
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            user.paymentMethod!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.white.withOpacity(0.4),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          lang.locale.languageCode == 'ar'
                              ? 'لم يتم تحديد طريقة الدفع بعد'
                              : 'No payment method set',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
            ),
            if (user.paymentMethod == null || user.paymentMethod!.isEmpty) ...[
              const SizedBox(height: 12),
              Text(
                lang.locale.languageCode == 'ar'
                    ? 'أمثلة: PayPal: email@example.com أو STC Pay: 0551234567'
                    : 'Examples: PayPal: email@example.com or Bank: IBAN...',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.4),
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showEditPaymentMethodDialog(BuildContext context, User user, AppLocalizations lang) {
    final isArabic = lang.locale.languageCode == 'ar';
    
    // Parse existing payment method
    String? initialType;
    String existingValue = '';
    if (user.paymentMethod != null && user.paymentMethod!.isNotEmpty) {
      final parts = user.paymentMethod!.split(': ');
      if (parts.length >= 2) {
        final type = parts[0].toLowerCase();
        if (type.contains('paypal')) initialType = 'paypal';
        else if (type.contains('bank') || type.contains('iban')) initialType = 'bank';
        else if (type.contains('usdt') || type.contains('trc')) initialType = 'usdt';
        existingValue = parts.sublist(1).join(': ');
      }
    }
    
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        String? selectedType = initialType;
        final controller = TextEditingController(text: existingValue);
        bool isLoading = false;
        
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            // If no type selected yet, show selection screen
            if (selectedType == null) {
              return Dialog(
                backgroundColor: const Color(0xFF1A1A1A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF00FF88).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.account_balance_wallet, color: Color(0xFF00FF88), size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              isArabic ? 'اختر طريقة الدفع' : 'Select Payment Method',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          // Info Button
                          GestureDetector(
                            onTap: () {
                              Navigator.pop(dialogContext);
                              _showPaymentMethodsInfoDialog(context, isArabic);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.help_outline, color: Colors.blue, size: 20),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Payment Options
                      _buildPaymentOption(
                        icon: '💳',
                        name: 'PayPal',
                        isSelected: false,
                        onTap: () => setDialogState(() { selectedType = 'paypal'; controller.clear(); }),
                      ),
                      const SizedBox(height: 10),
                      _buildPaymentOption(
                        icon: '🏦',
                        name: isArabic ? 'تحويل بنكي (IBAN)' : 'Bank Transfer (IBAN)',
                        isSelected: false,
                        onTap: () => setDialogState(() { selectedType = 'bank'; controller.clear(); }),
                      ),
                      const SizedBox(height: 10),
                      _buildPaymentOption(
                        icon: '₮',
                        name: 'USDT (TRC20)',
                        isSelected: false,
                        onTap: () => setDialogState(() { selectedType = 'usdt'; controller.clear(); }),
                      ),
                      
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        child: Text(
                          isArabic ? 'إلغاء' : 'Cancel',
                          style: TextStyle(color: Colors.white.withOpacity(0.6)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }
            
            // Type is selected - show input screen
            // For bank transfer, we need multiple controllers
            final bankNameController = TextEditingController();
            final ibanController = TextEditingController();
            final swiftController = TextEditingController();
            final fullNameController = TextEditingController();
            
            // Parse existing bank data if exists
            if (selectedType == 'bank' && existingValue.isNotEmpty && initialType == 'bank') {
              final parts = existingValue.split(' | ');
              if (parts.length >= 4) {
                fullNameController.text = parts[0];
                ibanController.text = parts[1];
                swiftController.text = parts[2];
                bankNameController.text = parts[3];
              }
            }
            
            return Dialog(
              backgroundColor: const Color(0xFF1A1A1A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Selected Method Header
                      Row(
                        children: [
                          Text(
                            _getPaymentIcon(selectedType!),
                            style: const TextStyle(fontSize: 28),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _getPaymentName(selectedType!, isArabic),
                              style: const TextStyle(color: Color(0xFF00FF88), fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          // Change Button
                          TextButton(
                            onPressed: () => setDialogState(() { selectedType = null; }),
                            child: Text(
                              isArabic ? 'تغيير' : 'Change',
                              style: const TextStyle(color: Colors.blue, fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Input Fields - Different for bank transfer
                      if (selectedType == 'bank') ...[
                        // Full Name
                        _buildTextField(
                          controller: fullNameController,
                          label: isArabic ? 'الاسم الكامل' : 'Full Name',
                          hint: 'Mohammed Ahmed',
                          icon: Icons.person,
                          isArabic: isArabic,
                        ),
                        const SizedBox(height: 12),
                        // IBAN
                        _buildTextField(
                          controller: ibanController,
                          label: 'IBAN',
                          hint: 'KW81CBKU0000000000001234560101',
                          icon: Icons.account_balance,
                          isArabic: isArabic,
                        ),
                        const SizedBox(height: 12),
                        // SWIFT
                        _buildTextField(
                          controller: swiftController,
                          label: 'SWIFT / BIC',
                          hint: 'CBKUKWKW',
                          icon: Icons.code,
                          isArabic: isArabic,
                        ),
                        const SizedBox(height: 12),
                        // Bank Name
                        _buildTextField(
                          controller: bankNameController,
                          label: isArabic ? 'اسم البنك' : 'Bank Name',
                          hint: isArabic ? 'البنك التجاري الكويتي' : 'Commercial Bank of Kuwait',
                          icon: Icons.business,
                          isArabic: isArabic,
                        ),
                      ] else ...[
                        // Single field for PayPal / USDT
                        TextField(
                          controller: controller,
                          autofocus: true,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                          decoration: InputDecoration(
                            labelText: _getFieldLabel(selectedType!, isArabic),
                            labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                            hintText: _getFieldHint(selectedType!, isArabic),
                            hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.05),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF00FF88), width: 2),
                            ),
                            prefixIcon: Icon(_getFieldIcon(selectedType!), color: const Color(0xFF00FF88)),
                          ),
                          keyboardType: selectedType == 'paypal' ? TextInputType.emailAddress : TextInputType.text,
                        ),
                      ],
                      const SizedBox(height: 24),
                      
                      // Save Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : () async {
                            String formatted;
                            
                            if (selectedType == 'bank') {
                              // Validate all bank fields
                              if (fullNameController.text.trim().isEmpty ||
                                  ibanController.text.trim().isEmpty ||
                                  swiftController.text.trim().isEmpty ||
                                  bankNameController.text.trim().isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(isArabic ? 'الرجاء إدخال جميع البيانات' : 'Please fill all fields'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }
                              // Format: Bank: Name | IBAN | SWIFT | BankName
                              formatted = 'Bank: ${fullNameController.text.trim()} | ${ibanController.text.trim()} | ${swiftController.text.trim()} | ${bankNameController.text.trim()}';
                            } else {
                              final value = controller.text.trim();
                              if (value.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(isArabic ? 'الرجاء إدخال البيانات' : 'Please enter the details'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }
                              formatted = _formatPaymentMethod(selectedType!, value, isArabic);
                            }
                            
                            setDialogState(() => isLoading = true);
                            
                            final success = await _updatePaymentMethod(context, formatted);
                            
                            if (success && dialogContext.mounted) {
                              Navigator.pop(dialogContext);
                              // Refresh the screen
                              setState(() {});
                            } else {
                              setDialogState(() => isLoading = false);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00FF88),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                )
                              : Text(
                                  isArabic ? 'حفظ' : 'Save',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        child: Text(
                          isArabic ? 'إلغاء' : 'Cancel',
                          style: TextStyle(color: Colors.white.withOpacity(0.6)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
  
  String _getPaymentIcon(String type) {
    switch (type) {
      case 'paypal': return '💳';
      case 'bank': return '🏦';
      case 'usdt': return '₮';
      default: return '💰';
    }
  }
  
  String _getPaymentName(String type, bool isArabic) {
    switch (type) {
      case 'paypal': return 'PayPal';
      case 'bank': return isArabic ? 'تحويل بنكي' : 'Bank Transfer';
      case 'usdt': return 'USDT (TRC20)';
      default: return '';
    }
  }
  
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required bool isArabic,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF00FF88), width: 2),
        ),
        prefixIcon: Icon(icon, color: const Color(0xFF00FF88), size: 20),
      ),
    );
  }
  
  Widget _buildPaymentOption({
    required String icon,
    required String name,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00FF88).withOpacity(0.15) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF00FF88) : Colors.white.withOpacity(0.1),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                name,
                style: TextStyle(
                  color: isSelected ? const Color(0xFF00FF88) : Colors.white,
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: Color(0xFF00FF88), size: 22),
          ],
        ),
      ),
    );
  }
  
  String _getFieldLabel(String type, bool isArabic) {
    switch (type) {
      case 'paypal': return isArabic ? 'البريد الإلكتروني' : 'Email Address';
      case 'bank': return 'IBAN';
      case 'usdt': return isArabic ? 'عنوان المحفظة (TRC20)' : 'Wallet Address (TRC20)';
      default: return '';
    }
  }
  
  String _getFieldHint(String type, bool isArabic) {
    switch (type) {
      case 'paypal': return 'example@email.com';
      case 'bank': return 'KW00XXXX0000000000000000000000';
      case 'usdt': return 'TRC20 Address';
      default: return '';
    }
  }
  
  IconData _getFieldIcon(String type) {
    switch (type) {
      case 'paypal': return Icons.email;
      case 'bank': return Icons.account_balance;
      case 'usdt': return Icons.currency_bitcoin;
      default: return Icons.payment;
    }
  }
  
  String _formatPaymentMethod(String type, String value, bool isArabic) {
    switch (type) {
      case 'paypal': return 'PayPal: $value';
      case 'bank': return 'IBAN: $value';
      case 'usdt': return 'USDT (TRC20): $value';
      default: return value;
    }
  }

  void _showPaymentMethodsInfoDialog(BuildContext context, bool isArabic) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.help_outline, color: Colors.blue, size: 24),
                ),
                const SizedBox(width: 16),
                Text(
                  isArabic ? 'كيف أسجل في وسائل الدفع؟' : 'How to register?',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // PayPal
            _buildPaymentInfoItem(
              icon: '💳',
              name: 'PayPal',
              description: isArabic 
                  ? 'سجّل مجاناً في paypal.com واحصل على إيميل الدفع'
                  : 'Register free at paypal.com and get your payment email',
              url: 'https://www.paypal.com',
            ),
            const SizedBox(height: 12),
            
            // Bank Transfer
            _buildPaymentInfoItem(
              icon: '🏦',
              name: isArabic ? 'تحويل بنكي' : 'Bank Transfer',
              description: isArabic 
                  ? 'احصل على رقم IBAN من بنكك المحلي'
                  : 'Get your IBAN number from your local bank',
              url: null,
            ),
            const SizedBox(height: 12),
            
            // USDT - Binance Referral Link
            _buildPaymentInfoItem(
              icon: '₮',
              name: 'USDT (TRC20)',
              description: isArabic 
                  ? 'أنشئ محفظة في Binance واحصل على عنوان TRC20 + مكافأة تصل لـ 100\$'
                  : 'Create Binance wallet and get TRC20 address + up to \$100 bonus',
              url: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00HWEWH24F',
            ),
            
            const SizedBox(height: 20),
            
            // Close Button
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  isArabic ? 'فهمت' : 'Got it',
                  style: const TextStyle(color: Colors.blue, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfoItem({
    required String icon,
    required String name,
    required String description,
    String? url,
  }) {
    return GestureDetector(
      onTap: url != null ? () async {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      } : null,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(description, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                ],
              ),
            ),
            if (url != null)
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF00FF88).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(Icons.open_in_new, color: Color(0xFF00FF88), size: 16),
              ),
          ],
        ),
      ),
    );
  }

  Future<bool> _updatePaymentMethod(BuildContext context, String paymentMethod) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      // Call API to update payment method
      final success = await authProvider.updateProfile(paymentMethod: paymentMethod);
      
      if (mounted && success) {
        // Refresh user data to update the UI
        await _refreshData();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context).locale.languageCode == 'ar'
                  ? 'تم حفظ طريقة الدفع بنجاح ✓'
                  : 'Payment method saved successfully ✓',
            ),
            backgroundColor: const Color(0xFF00FF88),
          ),
        );
        return true;
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context).locale.languageCode == 'ar'
                  ? 'فشل في حفظ طريقة الدفع'
                  : 'Failed to save payment method',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    }
  }

  Widget _buildStatsCards(BuildContext context, User user, AppLocalizations lang) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            lang.yourPerformance,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.touch_app,
                  label: lang.clicks,
                  value: user.stats.totalClicks.toString(),
                  color: const Color(0xFF00D9FF),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  icon: Icons.people,
                  label: lang.referrals,
                  value: user.stats.totalConversions.toString(),
                  color: const Color(0xFFFF006E),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  icon: Icons.attach_money,
                  label: lang.registeredOffers,
                  value: '${user.stats.totalRegisteredOffers}',
                  color: const Color(0xFF00FF88),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
              ),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text('📈', style: TextStyle(fontSize: 16)),
                        const SizedBox(width: 8),
                        Text(
                          lang.thisMonth,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${user.stats.monthlyConversions} ${lang.conversions} (+${user.stats.conversionRate.toInt()}%)',
                      style: const TextStyle(
                        color: Color(0xFF00FF88),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text('🔥', style: TextStyle(fontSize: 16)),
                        const SizedBox(width: 8),
                        Text(
                          lang.bestOffer,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${user.stats.bestOffer} (${user.stats.offerStats[user.stats.bestOffer]?.conversions ?? 0} conversions)',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamSection(BuildContext context, AppLocalizations lang) {
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const TeamsScreen()),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                const Color(0xFFFF006E).withOpacity(0.2),
                const Color(0xFFFF006E).withOpacity(0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFFFF006E).withOpacity(0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.groups,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    lang.myTeam,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.white,
                    size: 16,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text(
                    '👥',
                    style: TextStyle(fontSize: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lang.myTeam,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'عرض الفرق',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTeamStat(
                      '0',
                      lang.members,
                    ),
                  ),
                  Expanded(
                    child: _buildTeamStat(
                      '0',
                      lang.referrals,
                    ),
                  ),
                  Expanded(
                    child: _buildTeamStat(
                      '0',
                      lang.conversions,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeamStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  static void _showQRCodeDialog(BuildContext context, User user, AppLocalizations lang) {
    final uniqueCode = user.uniqueCode;
    final uniqueLink = (uniqueCode != null && uniqueCode.isNotEmpty)
        ? 'https://go.afftokapp.com/r/$uniqueCode'
        : 'https://go.afftokapp.com/@${user.username}';
    
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFF006E), Color(0xFFFF4D00)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF006E).withOpacity(0.6),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                lang.locale.languageCode == 'ar' ? '🔗 رابطك الفريد' : '🔗 Your Unique Link',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: QrImageView(
                  data: uniqueLink,
                  version: QrVersions.auto,
                  size: 200.0,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  uniqueLink,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFFFF006E),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  lang.locale.languageCode == 'ar' ? 'إغلاق' : 'Close',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.6),
              fontSize: 11,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
