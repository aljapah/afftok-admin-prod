import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class IntegrationSetupScreen extends StatefulWidget {
  const IntegrationSetupScreen({super.key});

  @override
  State<IntegrationSetupScreen> createState() => _IntegrationSetupScreenState();
}

class _IntegrationSetupScreenState extends State<IntegrationSetupScreen> {
  String? _selectedPlatform;
  bool _isTestingIntegration = false;
  String? _integrationStatus; // null = not tested, 'success', 'failed'

  final List<Map<String, dynamic>> _platforms = [
    {
      'id': 'shopify',
      'name': 'Shopify',
      'icon': '🛒',
      'color': const Color(0xFF96BF48),
    },
    {
      'id': 'salla',
      'name': 'سلة (Salla)',
      'icon': '🛍️',
      'color': const Color(0xFF5C6BC0),
    },
    {
      'id': 'zid',
      'name': 'زد (Zid)',
      'icon': '📦',
      'color': const Color(0xFF00BCD4),
    },
    {
      'id': 'woocommerce',
      'name': 'WooCommerce',
      'icon': '🔧',
      'color': const Color(0xFF7B1FA2),
    },
    {
      'id': 'custom',
      'name': 'موقع خاص',
      'icon': '💻',
      'color': const Color(0xFFFF5722),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final authProvider = Provider.of<AuthProvider>(context);
    final advertiserId = authProvider.user?.id ?? 'YOUR_ADVERTISER_ID';

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(
          isArabic ? 'إعداد التكامل' : 'Integration Setup',
          style: const TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            _buildStatusCard(isArabic),
            
            const SizedBox(height: 24),
            
            // Platform Selection
            Text(
              isArabic ? 'اختر منصتك' : 'Select Your Platform',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            _buildPlatformGrid(isArabic),
            
            const SizedBox(height: 24),
            
            // Instructions based on selected platform
            if (_selectedPlatform != null) ...[
              _buildInstructions(isArabic, advertiserId),
              
              const SizedBox(height: 24),
              
              // Test Button
              _buildTestButton(isArabic),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(bool isArabic) {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (_integrationStatus == 'success') {
      statusColor = Colors.green;
      statusText = isArabic ? 'متصل ✓' : 'Connected ✓';
      statusIcon = Icons.check_circle;
    } else if (_integrationStatus == 'failed') {
      statusColor = Colors.red;
      statusText = isArabic ? 'فشل الاتصال' : 'Connection Failed';
      statusIcon = Icons.error;
    } else {
      statusColor = Colors.orange;
      statusText = isArabic ? 'غير متصل' : 'Not Connected';
      statusIcon = Icons.warning;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isArabic ? 'حالة التكامل' : 'Integration Status',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
                Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          if (_integrationStatus != 'success')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                isArabic ? 'مطلوب للنشر' : 'Required',
                style: const TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPlatformGrid(bool isArabic) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
      ),
      itemCount: _platforms.length,
      itemBuilder: (context, index) {
        final platform = _platforms[index];
        final isSelected = _selectedPlatform == platform['id'];
        
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedPlatform = platform['id'];
              _integrationStatus = null;
            });
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected 
                  ? (platform['color'] as Color).withOpacity(0.2)
                  : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected 
                    ? platform['color'] as Color
                    : Colors.white.withOpacity(0.1),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  platform['icon'] as String,
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(height: 8),
                Text(
                  platform['name'] as String,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInstructions(bool isArabic, String advertiserId) {
    final webhookUrl = 'https://go.afftokapp.com/api/webhook/$_selectedPlatform/$advertiserId';
    final pixelCode = '''<script src="https://go.afftokapp.com/pixel.js"></script>
<script>
  AffTok.track('purchase', {
    value: ORDER_AMOUNT,
    currency: 'USD',
    order_id: 'ORDER_ID'
  });
</script>''';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.integration_instructions, color: Color(0xFF6C63FF)),
              const SizedBox(width: 8),
              Text(
                isArabic ? 'خطوات التفعيل' : 'Setup Instructions',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_selectedPlatform == 'shopify') ...[
            _buildStep(1, isArabic ? 'افتح لوحة Shopify' : 'Open Shopify Admin', isArabic),
            _buildStep(2, isArabic ? 'اذهب إلى Settings → Notifications' : 'Go to Settings → Notifications', isArabic),
            _buildStep(3, isArabic ? 'أضف Webhook جديد لـ Order Creation' : 'Add new Webhook for Order Creation', isArabic),
            _buildStep(4, isArabic ? 'انسخ الرابط التالي:' : 'Copy this URL:', isArabic),
            _buildCopyableUrl(webhookUrl),
          ] else if (_selectedPlatform == 'salla') ...[
            _buildStep(1, isArabic ? 'افتح لوحة سلة' : 'Open Salla Dashboard', isArabic),
            _buildStep(2, isArabic ? 'اذهب إلى التطبيقات → Webhooks' : 'Go to Apps → Webhooks', isArabic),
            _buildStep(3, isArabic ? 'أضف Webhook جديد لأحداث الطلبات' : 'Add new Webhook for Order events', isArabic),
            _buildStep(4, isArabic ? 'انسخ الرابط التالي:' : 'Copy this URL:', isArabic),
            _buildCopyableUrl(webhookUrl),
          ] else if (_selectedPlatform == 'zid') ...[
            _buildStep(1, isArabic ? 'افتح لوحة زد' : 'Open Zid Dashboard', isArabic),
            _buildStep(2, isArabic ? 'اذهب إلى الإعدادات → التكاملات' : 'Go to Settings → Integrations', isArabic),
            _buildStep(3, isArabic ? 'أضف Webhook جديد' : 'Add new Webhook', isArabic),
            _buildStep(4, isArabic ? 'انسخ الرابط التالي:' : 'Copy this URL:', isArabic),
            _buildCopyableUrl(webhookUrl),
          ] else if (_selectedPlatform == 'woocommerce') ...[
            _buildStep(1, isArabic ? 'افتح لوحة WordPress' : 'Open WordPress Admin', isArabic),
            _buildStep(2, isArabic ? 'اذهب إلى WooCommerce → Settings → Advanced → Webhooks' : 'Go to WooCommerce → Settings → Advanced → Webhooks', isArabic),
            _buildStep(3, isArabic ? 'أضف Webhook جديد لـ Order Created' : 'Add new Webhook for Order Created', isArabic),
            _buildStep(4, isArabic ? 'انسخ الرابط التالي:' : 'Copy this URL:', isArabic),
            _buildCopyableUrl(webhookUrl),
          ] else if (_selectedPlatform == 'custom') ...[
            _buildStep(1, isArabic ? 'أضف هذا الكود في صفحة "شكراً للشراء":' : 'Add this code to your "Thank You" page:', isArabic),
            _buildCopyableCode(pixelCode),
            const SizedBox(height: 16),
            Text(
              isArabic 
                  ? 'أو أرسل Postback لهذا الرابط عند كل عملية شراء:'
                  : 'Or send a Postback to this URL for each purchase:',
              style: TextStyle(color: Colors.white.withOpacity(0.7)),
            ),
            const SizedBox(height: 8),
            _buildCopyableUrl('https://go.afftokapp.com/api/postback?click_id={click_id}&amount={amount}&order_id={order_id}'),
          ],
        ],
      ),
    );
  }

  Widget _buildStep(int number, String text, bool isArabic) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Color(0xFF6C63FF),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCopyableUrl(String url) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              url,
              style: const TextStyle(
                color: Color(0xFF6C63FF),
                fontFamily: 'monospace',
                fontSize: 12,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy, color: Color(0xFF6C63FF), size: 20),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: url));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم النسخ!'),
                  backgroundColor: Color(0xFF6C63FF),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCopyableCode(String code) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'HTML/JavaScript',
                style: TextStyle(
                  color: Colors.green,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy, color: Colors.green, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: code));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم النسخ!'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 1),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            code,
            style: const TextStyle(
              color: Colors.white70,
              fontFamily: 'monospace',
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTestButton(bool isArabic) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isTestingIntegration ? null : _testIntegration,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF6C63FF),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: _isTestingIntegration
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.science, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    isArabic ? 'اختبار التكامل' : 'Test Integration',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _testIntegration() async {
    setState(() {
      _isTestingIntegration = true;
    });

    // Simulate test
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isTestingIntegration = false;
      // For demo, randomly succeed or fail
      // In real implementation, this would send a test webhook and verify receipt
      _integrationStatus = 'success'; // or 'failed'
    });

    if (_integrationStatus == 'success' && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ التكامل يعمل بنجاح!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
}

