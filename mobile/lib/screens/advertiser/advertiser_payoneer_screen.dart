import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

/// شاشة دفعات المعلن من نظام Payoneer
/// حالياً: معطلة وتعرض رسالة "قريباً"
/// المستقبل: ستعرض المبالغ المستحقة على المعلن بعد التعاقد مع Payoneer
class AdvertiserPayoneerScreen extends StatefulWidget {
  const AdvertiserPayoneerScreen({super.key});

  @override
  State<AdvertiserPayoneerScreen> createState() => _AdvertiserPayoneerScreenState();
}

class _AdvertiserPayoneerScreenState extends State<AdvertiserPayoneerScreen> {
  final String _baseUrl = ApiService.baseUrl;
  final TextEditingController _payoneerEmailController = TextEditingController();
  
  List<dynamic> _payouts = [];
  Map<String, dynamic>? _userInfo;
  bool _isLoading = true;
  bool _isSaving = false;
  double _totalPending = 0;
  double _totalPaid = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _payoneerEmailController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      // جلب بيانات المستخدم
      final userResponse = await http.get(
        Uri.parse('$_baseUrl/api/user/profile'),
        headers: {
          'Authorization': 'Bearer ${authProvider.token}',
          'Content-Type': 'application/json',
        },
      );

      if (userResponse.statusCode == 200) {
        final userData = json.decode(userResponse.body);
        setState(() {
          _userInfo = userData;
          _payoneerEmailController.text = userData['payoneer_email'] ?? '';
        });
      }

      // جلب الدفعات المستحقة (ستكون فارغة حالياً)
      final payoutsResponse = await http.get(
        Uri.parse('$_baseUrl/api/advertiser/payouts'),
        headers: {
          'Authorization': 'Bearer ${authProvider.token}',
          'Content-Type': 'application/json',
        },
      );

      if (payoutsResponse.statusCode == 200) {
        final data = json.decode(payoutsResponse.body);
        setState(() {
          _payouts = data['payouts'] ?? [];
          _totalPending = (data['total_pending'] ?? 0).toDouble();
          _totalPaid = (data['total_paid'] ?? 0).toDouble();
        });
      }
    } catch (e) {
      // API غير متوفرة - نعرض الحالة الافتراضية
      debugPrint('Error loading Payoneer data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _savePayoneerEmail() async {
    if (_payoneerEmailController.text.trim().isEmpty) {
      _showSnackBar('الرجاء إدخال البريد الإلكتروني', isError: true);
      return;
    }

    setState(() => _isSaving = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final response = await http.put(
        Uri.parse('$_baseUrl/api/advertiser/payoneer-email'),
        headers: {
          'Authorization': 'Bearer ${authProvider.token}',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'payoneer_email': _payoneerEmailController.text.trim(),
        }),
      );

      if (response.statusCode == 200) {
        _showSnackBar('تم حفظ البريد الإلكتروني بنجاح ✓');
      } else {
        _showSnackBar('فشل في الحفظ', isError: true);
      }
    } catch (e) {
      _showSnackBar('حدث خطأ في الاتصال', isError: true);
    } finally {
      setState(() => _isSaving = false);
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : const Color(0xFF00FF88),
      ),
    );
  }

  Future<void> _openPayoneerSignup() async {
    const url = 'https://www.payoneer.com/partners/'; // TODO: Replace with actual affiliate link
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background
          Positioned.fill(
            child: Center(
              child: Transform.rotate(
                angle: -0.2,
                child: Text(
                  'Payoneer',
                  style: TextStyle(
                    fontSize: 100,
                    fontWeight: FontWeight.w900,
                    color: Colors.orange.withOpacity(0.03),
                  ),
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.payments, color: Colors.orange, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isArabic ? 'الدفعات (Payoneer)' : 'Payments (Payoneer)',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    isArabic ? '🔜 قريباً' : '🔜 Coming Soon',
                                    style: const TextStyle(
                                      color: Colors.orange,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Content
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: Colors.orange))
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          color: Colors.orange,
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Coming Soon Banner
                                _buildComingSoonBanner(isArabic),
                                
                                const SizedBox(height: 24),
                                
                                // Current System Info
                                _buildCurrentSystemInfo(isArabic),
                                
                                const SizedBox(height: 24),
                                
                                // Summary Cards
                                _buildSummaryCards(isArabic),
                                
                                const SizedBox(height: 24),
                                
                                // Payoneer Email Section
                                _buildPayoneerEmailSection(isArabic),
                                
                                const SizedBox(height: 24),
                                
                                // Register with Payoneer
                                _buildRegisterSection(isArabic),
                                
                                const SizedBox(height: 24),
                                
                                // Benefits
                                _buildBenefitsSection(isArabic),
                                
                                const SizedBox(height: 100),
                              ],
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComingSoonBanner(bool isArabic) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orange.withOpacity(0.2),
            Colors.amber.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.rocket_launch, color: Colors.orange, size: 48),
          const SizedBox(height: 12),
          Text(
            isArabic ? 'نظام الدفع الآلي قادم قريباً!' : 'Automated Payment System Coming Soon!',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            isArabic
                ? 'سيتم السحب تلقائياً من حسابك لدفع المروجين.\nحالياً، استمر بالدفع مباشرة للمروجين.'
                : 'Automatic deduction from your account to pay promoters.\nFor now, continue paying promoters directly.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentSystemInfo(bool isArabic) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF6C63FF).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF6C63FF).withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.info_outline, color: Color(0xFF6C63FF), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isArabic ? 'النظام الحالي' : 'Current System',
                  style: const TextStyle(
                    color: Color(0xFF6C63FF),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isArabic
                      ? 'ادفع للمروجين مباشرة حسب طريقة الدفع المحددة لديهم'
                      : 'Pay promoters directly using their specified payment method',
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
    );
  }

  Widget _buildSummaryCards(bool isArabic) {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            icon: Icons.pending_actions,
            label: isArabic ? 'مستحق عليك' : 'You Owe',
            value: '\$${_totalPending.toStringAsFixed(2)}',
            color: Colors.orange,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            icon: Icons.check_circle,
            label: isArabic ? 'تم الدفع' : 'Paid',
            value: '\$${_totalPaid.toStringAsFixed(2)}',
            color: const Color(0xFF00FF88),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPayoneerEmailSection(bool isArabic) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.email, color: Colors.orange, size: 20),
              const SizedBox(width: 8),
              Text(
                isArabic ? 'بريد Payoneer الإلكتروني' : 'Payoneer Email',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            isArabic
                ? 'أدخل البريد المسجل في حساب Payoneer الخاص بك'
                : 'Enter the email registered with your Payoneer account',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _payoneerEmailController,
            style: const TextStyle(color: Colors.white),
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              hintText: 'your-email@example.com',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.orange, width: 2),
              ),
              prefixIcon: const Icon(Icons.alternate_email, color: Colors.orange),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _savePayoneerEmail,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.save, size: 18),
                        const SizedBox(width: 8),
                        Text(isArabic ? 'حفظ' : 'Save'),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterSection(bool isArabic) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFF6B00).withOpacity(0.15),
            const Color(0xFFFF9500).withOpacity(0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFF6B00).withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF6B00).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance_wallet, color: Color(0xFFFF6B00), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isArabic ? 'ليس لديك حساب Payoneer؟' : "Don't have a Payoneer account?",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      isArabic ? 'سجل الآن مجاناً' : 'Register now for free',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _openPayoneerSignup,
              icon: const Icon(Icons.open_in_new, size: 18),
              label: Text(isArabic ? 'إنشاء حساب Payoneer' : 'Create Payoneer Account'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFFF6B00),
                side: const BorderSide(color: Color(0xFFFF6B00)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitsSection(bool isArabic) {
    final benefits = isArabic
        ? [
            {'icon': Icons.schedule, 'text': 'دفع تلقائي شهري - لا حاجة للتحويل يدوياً'},
            {'icon': Icons.people, 'text': 'دفعة واحدة لجميع المروجين'},
            {'icon': Icons.receipt_long, 'text': 'تقارير وفواتير تفصيلية'},
            {'icon': Icons.security, 'text': 'آمن وموثوق - مدعوم من Payoneer'},
          ]
        : [
            {'icon': Icons.schedule, 'text': 'Automatic monthly payments - no manual transfers'},
            {'icon': Icons.people, 'text': 'One payment for all promoters'},
            {'icon': Icons.receipt_long, 'text': 'Detailed reports and invoices'},
            {'icon': Icons.security, 'text': 'Safe and reliable - powered by Payoneer'},
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isArabic ? 'مميزات النظام الجديد' : 'New System Benefits',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...benefits.map((benefit) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  benefit['icon'] as IconData,
                  color: Colors.orange.withOpacity(0.8),
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    benefit['text'] as String,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        )),
      ],
    );
  }
}

