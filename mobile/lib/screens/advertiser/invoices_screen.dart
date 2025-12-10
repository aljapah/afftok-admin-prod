import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/imgbb_service.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final String _baseUrl = ApiService.baseUrl;
  List<dynamic> _invoices = [];
  Map<String, dynamic>? _summary;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final response = await http.get(
        Uri.parse('$_baseUrl/api/advertiser/invoices'),
        headers: {
          'Authorization': 'Bearer ${authProvider.token}',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _invoices = data['invoices'] ?? [];
          _summary = data['summary'];
          _isLoading = false;
        });
      } else if (response.statusCode == 404) {
        // API endpoint not ready yet - show empty state
        setState(() {
          _invoices = [];
          _summary = null;
          _isLoading = false;
        });
      } else {
        // Show empty state instead of error for now
        setState(() {
          _invoices = [];
          _summary = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      // Network error or API not available - show empty state
      setState(() {
        _invoices = [];
        _summary = null;
        _isLoading = false;
      });
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
                  'AffTok',
                  style: TextStyle(
                    fontSize: 120,
                    fontWeight: FontWeight.w900,
                    color: Colors.white.withOpacity(0.03),
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
                      Text(
                        isArabic ? 'فواتيري' : 'My Invoices',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),

                // Summary Cards
                if (_summary != null) _buildSummaryCards(isArabic),

                // Invoices List
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : _error != null
                          ? _buildErrorWidget(isArabic)
                          : _invoices.isEmpty
                              ? _buildEmptyState(isArabic)
                              : RefreshIndicator(
                                  onRefresh: _loadInvoices,
                                  child: ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _invoices.length,
                                    itemBuilder: (context, index) =>
                                        _buildInvoiceCard(_invoices[index], isArabic),
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

  Widget _buildSummaryCards(bool isArabic) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildSummaryCard(
              isArabic ? 'المستحق' : 'Pending',
              '${(_summary!['pending_amount'] ?? 0).toStringAsFixed(2)} USD',
              const Color(0xFFFF9800),
              Icons.pending_actions,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildSummaryCard(
              isArabic ? 'المدفوع' : 'Paid',
              '${(_summary!['paid_amount'] ?? 0).toStringAsFixed(2)} USD',
              const Color(0xFF4CAF50),
              Icons.check_circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
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
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInvoiceCard(Map<String, dynamic> invoice, bool isArabic) {
    final status = invoice['status'] ?? 'pending';
    final statusColors = {
      'pending': const Color(0xFFFF9800),
      'pending_confirmation': const Color(0xFF2196F3),
      'paid': const Color(0xFF4CAF50),
      'overdue': const Color(0xFFF44336),
    };
    final statusLabels = {
      'pending': isArabic ? 'في انتظار الدفع' : 'Pending Payment',
      'pending_confirmation': isArabic ? 'بانتظار التأكيد' : 'Awaiting Confirmation',
      'paid': isArabic ? 'مدفوع' : 'Paid',
      'overdue': isArabic ? 'متأخر' : 'Overdue',
    };

    final month = invoice['month'] ?? 1;
    final year = invoice['year'] ?? 2024;
    final monthNames = isArabic
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColors[status]!.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${monthNames[month - 1]} $year',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColors[status],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusLabels[status] ?? status,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  '${(invoice['platform_amount'] ?? 0).toStringAsFixed(2)} USD',
                  style: TextStyle(
                    color: statusColors[status],
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          // Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildDetailRow(
                  isArabic ? 'التحويلات' : 'Conversions',
                  '${invoice['total_conversions'] ?? 0}',
                  Icons.swap_horiz,
                ),
                _buildDetailRow(
                  isArabic ? 'عمولات المروجين' : 'Promoter Payouts',
                  '${(invoice['total_promoter_payout'] ?? 0).toStringAsFixed(2)} USD',
                  Icons.payments,
                ),
                _buildDetailRow(
                  isArabic ? 'نسبة المنصة (10%)' : 'Platform Fee (10%)',
                  '${(invoice['platform_amount'] ?? 0).toStringAsFixed(2)} USD',
                  Icons.receipt_long,
                ),
                // Action Buttons Row
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(
                    children: [
                      // Download Report Button
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _downloadInvoiceReport(invoice, isArabic),
                          icon: const Icon(Icons.download, size: 16),
                          label: Text(
                            isArabic ? 'تحميل التقرير' : 'Download Report',
                            style: const TextStyle(fontSize: 12),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF6C63FF),
                            side: const BorderSide(color: Color(0xFF6C63FF)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      if (status == 'pending' || status == 'overdue') ...[
                        const SizedBox(width: 8),
                        // Confirm Payment Button
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showPaymentDialog(invoice, isArabic),
                            icon: const Icon(Icons.payment, size: 16),
                            label: Text(
                              isArabic ? 'تأكيد الدفع' : 'Confirm',
                              style: const TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6C63FF),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: Colors.white.withOpacity(0.5), size: 18),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(Map<String, dynamic> invoice, bool isArabic) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PaymentConfirmationSheet(
        invoice: invoice,
        isArabic: isArabic,
        onConfirm: (proof, method, note) async {
          Navigator.pop(context);
          await _confirmPayment(invoice['id'], proof, note, isArabic, method);
        },
      ),
    );
  }

  Future<void> _downloadInvoiceReport(Map<String, dynamic> invoice, bool isArabic) async {
    try {
      final month = invoice['month'] ?? 1;
      final year = invoice['year'] ?? 2024;
      final monthNames = isArabic
          ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
          : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Create CSV content for invoice summary
      final buffer = StringBuffer();
      
      // Invoice Header
      buffer.writeln(isArabic ? 'تقرير الفاتورة الشهرية' : 'Monthly Invoice Report');
      buffer.writeln('');
      buffer.writeln('${isArabic ? 'الفترة' : 'Period'},${monthNames[month - 1]} $year');
      buffer.writeln('${isArabic ? 'إجمالي التحويلات' : 'Total Conversions'},${invoice['total_conversions'] ?? 0}');
      buffer.writeln('${isArabic ? 'إجمالي عمولات المروجين' : 'Total Promoter Payouts'},${(invoice['total_promoter_payout'] ?? 0).toStringAsFixed(2)} USD');
      buffer.writeln('${isArabic ? 'نسبة المنصة (10%)' : 'Platform Fee (10%)'},${(invoice['platform_amount'] ?? 0).toStringAsFixed(2)} USD');
      buffer.writeln('${isArabic ? 'الحالة' : 'Status'},${invoice['status'] ?? 'pending'}');
      buffer.writeln('');
      buffer.writeln(isArabic ? '---' : '---');
      buffer.writeln('');
      
      // Note about detailed report
      buffer.writeln(isArabic 
        ? 'للحصول على تقرير مفصل بأسماء المروجين، يرجى زيارة قسم التحويلات'
        : 'For detailed report with promoter names, please visit Conversions section');

      // Save to file
      final directory = await getTemporaryDirectory();
      final fileName = 'invoice_${year}_${month.toString().padLeft(2, '0')}.csv';
      final file = File('${directory.path}/$fileName');
      await file.writeAsString(buffer.toString());

      // Share file
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: isArabic 
          ? 'فاتورة ${monthNames[month - 1]} $year' 
          : 'Invoice ${monthNames[month - 1]} $year',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isArabic ? 'تم تحميل التقرير' : 'Report downloaded'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isArabic ? 'فشل في التحميل' : 'Download failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _confirmPayment(String invoiceId, String proof, String note, bool isArabic, String method) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final response = await http.post(
        Uri.parse('$_baseUrl/api/advertiser/invoices/$invoiceId/confirm-payment'),
        headers: {
          'Authorization': 'Bearer ${authProvider.token}',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'payment_proof': proof,
          'payment_method': method,
          'payment_note': note,
        }),
      );

      if (response.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isArabic ? 'تم إرسال تأكيد الدفع بنجاح! سيتم مراجعته قريباً' : 'Payment confirmation sent! Will be reviewed soon'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
        _loadInvoices();
      } else {
        throw Exception('Failed to confirm payment: ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildEmptyState(bool isArabic) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long,
            size: 80,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            isArabic ? 'لا توجد فواتير حتى الآن' : 'No invoices yet',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isArabic
                ? 'ستظهر الفواتير الشهرية هنا عند حدوث تحويلات'
                : 'Monthly invoices will appear here when conversions occur',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(bool isArabic) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            isArabic ? 'حدث خطأ في تحميل الفواتير' : 'Error loading invoices',
            style: const TextStyle(color: Colors.white),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _loadInvoices,
            child: Text(isArabic ? 'إعادة المحاولة' : 'Retry'),
          ),
        ],
      ),
    );
  }
}

// Payment Confirmation Bottom Sheet Widget
class _PaymentConfirmationSheet extends StatefulWidget {
  final Map<String, dynamic> invoice;
  final bool isArabic;
  final Function(String proof, String method, String note) onConfirm;

  const _PaymentConfirmationSheet({
    required this.invoice,
    required this.isArabic,
    required this.onConfirm,
  });

  @override
  State<_PaymentConfirmationSheet> createState() => _PaymentConfirmationSheetState();
}

class _PaymentConfirmationSheetState extends State<_PaymentConfirmationSheet> {
  final _noteController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  
  File? _selectedImage;
  String? _uploadedImageUrl;
  String _selectedMethod = 'bank_transfer';
  bool _isUploading = false;
  bool _isSubmitting = false;

  final List<Map<String, String>> _paymentMethods = [
    {'id': 'bank_transfer', 'ar': 'تحويل بنكي', 'en': 'Bank Transfer'},
    {'id': 'paypal', 'ar': 'PayPal', 'en': 'PayPal'},
    {'id': 'stc_pay', 'ar': 'STC Pay', 'en': 'STC Pay'},
    {'id': 'vodafone_cash', 'ar': 'فودافون كاش', 'en': 'Vodafone Cash'},
    {'id': 'wise', 'ar': 'Wise', 'en': 'Wise'},
    {'id': 'other', 'ar': 'أخرى', 'en': 'Other'},
  ];

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _uploadedImageUrl = null;
      });
      await _uploadImage();
    }
  }

  Future<void> _takePhoto() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _uploadedImageUrl = null;
      });
      await _uploadImage();
    }
  }

  Future<void> _uploadImage() async {
    if (_selectedImage == null) return;

    setState(() => _isUploading = true);

    try {
      final url = await ImgBBService.uploadImage(_selectedImage!);
      if (url != null && mounted) {
        setState(() {
          _uploadedImageUrl = url;
          _isUploading = false;
        });
      } else {
        throw Exception('Upload failed');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.isArabic ? 'فشل في رفع الصورة' : 'Image upload failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _submit() async {
    if (_uploadedImageUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.isArabic ? 'يرجى رفع صورة الإيصال' : 'Please upload receipt image'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    widget.onConfirm(_uploadedImageUrl!, _selectedMethod, _noteController.text);
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final amount = (widget.invoice['platform_amount'] ?? 0).toStringAsFixed(2);
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A2E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Title
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6C63FF).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.payment, color: Color(0xFF6C63FF)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.isArabic ? 'تأكيد الدفع' : 'Confirm Payment',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        widget.isArabic ? 'المبلغ: $amount USD' : 'Amount: $amount USD',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Payment Info Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF6C63FF).withOpacity(0.2),
                          const Color(0xFF9D4EDD).withOpacity(0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.account_balance, color: Color(0xFF6C63FF)),
                            const SizedBox(width: 12),
                            Text(
                              widget.isArabic ? 'بيانات الدفع' : 'Payment Details',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildPaymentInfoRow('NBK', '2003308649'),
                        _buildPaymentInfoRow('IBAN', 'KW55NBOK0000000000002003308649'),
                        _buildPaymentInfoRow(widget.isArabic ? 'الاسم' : 'Name', 'AffTok Platform'),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Upload Receipt Section
                  Text(
                    widget.isArabic ? '📸 رفع صورة الإيصال *' : '📸 Upload Receipt Image *',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  if (_selectedImage != null)
                    Stack(
                      children: [
                        Container(
                          height: 200,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: _uploadedImageUrl != null 
                                  ? Colors.green 
                                  : Colors.orange,
                              width: 2,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.file(
                              _selectedImage!,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        if (_isUploading)
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const CircularProgressIndicator(color: Color(0xFF6C63FF)),
                                  const SizedBox(height: 12),
                                  Text(
                                    widget.isArabic ? 'جاري الرفع...' : 'Uploading...',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        if (_uploadedImageUrl != null)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, color: Colors.white, size: 16),
                            ),
                          ),
                        Positioned(
                          top: 8,
                          left: 8,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedImage = null;
                                _uploadedImageUrl = null;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.8),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: _buildUploadButton(
                            icon: Icons.photo_library,
                            label: widget.isArabic ? 'من المعرض' : 'Gallery',
                            onTap: _pickImage,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildUploadButton(
                            icon: Icons.camera_alt,
                            label: widget.isArabic ? 'التقاط صورة' : 'Camera',
                            onTap: _takePhoto,
                          ),
                        ),
                      ],
                    ),
                  
                  const SizedBox(height: 24),
                  
                  // Payment Method Selection
                  Text(
                    widget.isArabic ? '💳 طريقة الدفع' : '💳 Payment Method',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _paymentMethods.map((method) {
                      final isSelected = _selectedMethod == method['id'];
                      return GestureDetector(
                        onTap: () => setState(() => _selectedMethod = method['id']!),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? const Color(0xFF6C63FF) 
                                : Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected 
                                  ? const Color(0xFF6C63FF) 
                                  : Colors.white.withOpacity(0.2),
                            ),
                          ),
                          child: Text(
                            widget.isArabic ? method['ar']! : method['en']!,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white.withOpacity(0.7),
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Notes
                  Text(
                    widget.isArabic ? '📝 ملاحظات (اختياري)' : '📝 Notes (optional)',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: _noteController,
                    style: const TextStyle(color: Colors.white),
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: widget.isArabic 
                          ? 'مثال: تم التحويل من حساب...' 
                          : 'e.g., Transferred from account...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFF6C63FF)),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 100), // Space for button
                ],
              ),
            ),
          ),
          
          // Submit Button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_isUploading || _isSubmitting || _uploadedImageUrl == null) 
                      ? null 
                      : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    disabledBackgroundColor: Colors.grey.withOpacity(0.3),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.send, color: Colors.white),
                            const SizedBox(width: 8),
                            Text(
                              widget.isArabic ? 'إرسال تأكيد الدفع' : 'Submit Payment Confirmation',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.white.withOpacity(0.6)),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.2),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF6C63FF), size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

