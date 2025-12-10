import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/auth_provider.dart';
import '../../services/advertiser_service.dart';
import '../../services/imgbb_service.dart';

class CreateOfferScreen extends StatefulWidget {
  final Map<String, dynamic>? existingOffer; // For editing

  const CreateOfferScreen({super.key, this.existingOffer});

  @override
  State<CreateOfferScreen> createState() => _CreateOfferScreenState();
}

class _CreateOfferScreenState extends State<CreateOfferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _advertiserService = AdvertiserService();
  
  // English fields
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  // Arabic fields
  final _titleArController = TextEditingController();
  final _descriptionArController = TextEditingController();
  final _termsArController = TextEditingController();
  
  // Terms & Conditions (English)
  final _termsController = TextEditingController();
  
  // Additional Notes
  final _additionalNotesController = TextEditingController();
  
  // URLs
  final _imageUrlController = TextEditingController();
  final _logoUrlController = TextEditingController();
  final _destinationUrlController = TextEditingController();
  
  // Other fields
  final _payoutController = TextEditingController();
  final _commissionController = TextEditingController();
  
  String _selectedCategory = 'general';
  String _selectedPayoutType = 'cpa';
  List<String> _selectedTargetCountries = [];
  List<String> _selectedBlockedCountries = [];
  bool _isLoading = false;
  bool _isUploadingImage = false;
  bool _isUploadingLogo = false;
  bool _agreedToTerms = false;
  File? _selectedImage;
  File? _selectedLogo;
  final ImagePicker _picker = ImagePicker();

  // قائمة الدول المتاحة
  final List<Map<String, String>> _availableCountries = [
    {'code': 'SA', 'en': 'Saudi Arabia', 'ar': 'السعودية'},
    {'code': 'AE', 'en': 'UAE', 'ar': 'الإمارات'},
    {'code': 'KW', 'en': 'Kuwait', 'ar': 'الكويت'},
    {'code': 'BH', 'en': 'Bahrain', 'ar': 'البحرين'},
    {'code': 'QA', 'en': 'Qatar', 'ar': 'قطر'},
    {'code': 'OM', 'en': 'Oman', 'ar': 'عمان'},
    {'code': 'EG', 'en': 'Egypt', 'ar': 'مصر'},
    {'code': 'JO', 'en': 'Jordan', 'ar': 'الأردن'},
    {'code': 'LB', 'en': 'Lebanon', 'ar': 'لبنان'},
    {'code': 'IQ', 'en': 'Iraq', 'ar': 'العراق'},
    {'code': 'MA', 'en': 'Morocco', 'ar': 'المغرب'},
    {'code': 'DZ', 'en': 'Algeria', 'ar': 'الجزائر'},
    {'code': 'TN', 'en': 'Tunisia', 'ar': 'تونس'},
    {'code': 'US', 'en': 'United States', 'ar': 'أمريكا'},
    {'code': 'GB', 'en': 'United Kingdom', 'ar': 'بريطانيا'},
    {'code': 'DE', 'en': 'Germany', 'ar': 'ألمانيا'},
    {'code': 'FR', 'en': 'France', 'ar': 'فرنسا'},
    {'code': 'TR', 'en': 'Turkey', 'ar': 'تركيا'},
  ];


  final List<Map<String, String>> _categories = [
    {'value': 'general', 'en': 'General', 'ar': 'عام'},
    {'value': 'finance', 'en': 'Finance', 'ar': 'مالية'},
    {'value': 'ecommerce', 'en': 'E-Commerce', 'ar': 'تجارة إلكترونية'},
    {'value': 'gaming', 'en': 'Gaming', 'ar': 'ألعاب'},
    {'value': 'health', 'en': 'Health', 'ar': 'صحة'},
    {'value': 'education', 'en': 'Education', 'ar': 'تعليم'},
    {'value': 'technology', 'en': 'Technology', 'ar': 'تقنية'},
    {'value': 'travel', 'en': 'Travel', 'ar': 'سفر'},
    {'value': 'food', 'en': 'Food & Delivery', 'ar': 'طعام وتوصيل'},
    {'value': 'entertainment', 'en': 'Entertainment', 'ar': 'ترفيه'},
  ];

  final List<Map<String, String>> _payoutTypes = [
    {'value': 'cpa', 'en': 'CPA (Cost Per Action)', 'ar': 'CPA (لكل إجراء)'},
    {'value': 'cpl', 'en': 'CPL (Cost Per Lead)', 'ar': 'CPL (لكل عميل محتمل)'},
    {'value': 'cps', 'en': 'CPS (Cost Per Sale)', 'ar': 'CPS (لكل بيع)'},
    {'value': 'cpi', 'en': 'CPI (Cost Per Install)', 'ar': 'CPI (لكل تثبيت)'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.existingOffer != null) {
      _populateForm(widget.existingOffer!);
    }
  }

  void _populateForm(Map<String, dynamic> offer) {
    _titleController.text = offer['title'] ?? '';
    _descriptionController.text = offer['description'] ?? '';
    _titleArController.text = offer['title_ar'] ?? '';
    _descriptionArController.text = offer['description_ar'] ?? '';
    _termsController.text = offer['terms'] ?? '';
    _termsArController.text = offer['terms_ar'] ?? '';
    _additionalNotesController.text = offer['additional_notes'] ?? '';
    _imageUrlController.text = offer['image_url'] ?? '';
    _logoUrlController.text = offer['logo_url'] ?? '';
    _destinationUrlController.text = offer['destination_url'] ?? '';
    _payoutController.text = (offer['payout'] ?? 0).toString();
    _commissionController.text = (offer['commission'] ?? 0).toString();
    _selectedCategory = offer['category'] ?? 'general';
    _selectedPayoutType = offer['payout_type'] ?? 'cpa';
    
    // Parse target countries
    if (offer['target_countries'] != null) {
      if (offer['target_countries'] is List) {
        _selectedTargetCountries = List<String>.from(offer['target_countries']);
      } else if (offer['target_countries'] is String) {
        try {
          _selectedTargetCountries = List<String>.from(
            (offer['target_countries'] as String).isNotEmpty 
              ? (offer['target_countries'] as String).split(',') 
              : []
          );
        } catch (_) {}
      }
    }
    
    // Parse blocked countries
    if (offer['blocked_countries'] != null) {
      if (offer['blocked_countries'] is List) {
        _selectedBlockedCountries = List<String>.from(offer['blocked_countries']);
      } else if (offer['blocked_countries'] is String) {
        try {
          _selectedBlockedCountries = List<String>.from(
            (offer['blocked_countries'] as String).isNotEmpty 
              ? (offer['blocked_countries'] as String).split(',') 
              : []
          );
        } catch (_) {}
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _titleArController.dispose();
    _descriptionArController.dispose();
    _termsController.dispose();
    _termsArController.dispose();
    _additionalNotesController.dispose();
    _imageUrlController.dispose();
    _logoUrlController.dispose();
    _destinationUrlController.dispose();
    _payoutController.dispose();
    _commissionController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage({required bool isLogo}) async {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() {
        if (isLogo) {
          _isUploadingLogo = true;
          _selectedLogo = File(pickedFile.path);
        } else {
          _isUploadingImage = true;
          _selectedImage = File(pickedFile.path);
        }
      });

      // Upload to ImgBB
      final imageUrl = await ImgBBService.uploadImage(File(pickedFile.path));

      setState(() {
        if (isLogo) {
          _isUploadingLogo = false;
          if (imageUrl != null) {
            _logoUrlController.text = imageUrl;
          }
        } else {
          _isUploadingImage = false;
          if (imageUrl != null) {
            _imageUrlController.text = imageUrl;
          }
        }
      });

      if (imageUrl == null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isArabic ? 'فشل رفع الصورة' : 'Failed to upload image'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isUploadingImage = false;
        _isUploadingLogo = false;
      });
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final offerData = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'title_ar': _titleArController.text.trim(),
      'description_ar': _descriptionArController.text.trim(),
      'terms': _termsController.text.trim(),
      'terms_ar': _termsArController.text.trim(),
      'image_url': _imageUrlController.text.trim(),
      'logo_url': _logoUrlController.text.trim(),
      'destination_url': _destinationUrlController.text.trim(),
      'category': _selectedCategory,
      'payout': int.tryParse(_payoutController.text) ?? 0,
      'commission': int.tryParse(_commissionController.text) ?? 0,
      'payout_type': _selectedPayoutType,
      'target_countries': _selectedTargetCountries.isNotEmpty ? _selectedTargetCountries : null,
      'blocked_countries': _selectedBlockedCountries.isNotEmpty ? _selectedBlockedCountries : null,
      'additional_notes': _additionalNotesController.text.trim().isNotEmpty 
          ? _additionalNotesController.text.trim() 
          : null,
    };

    try {
      bool success;
      if (widget.existingOffer != null) {
        success = await _advertiserService.updateOffer(
          authProvider.token!,
          widget.existingOffer!['id'],
          offerData,
        );
      } else {
        success = await _advertiserService.createOffer(
          authProvider.token!,
          offerData,
        );
      }

      setState(() => _isLoading = false);

      if (success && mounted) {
        final isArabic = Localizations.localeOf(context).languageCode == 'ar';
        
        if (widget.existingOffer != null) {
          // Editing - just show snackbar
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isArabic ? 'تم تحديث العرض وإرساله للمراجعة' : 'Offer updated and sent for review'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        } else {
          // New offer - show payment details dialog
          await _showPaymentDetailsDialog(context, isArabic);
          if (mounted) {
            Navigator.pop(context, true);
          }
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
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

  Future<void> _showPaymentDetailsDialog(BuildContext context, bool isArabic) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 450),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: Colors.green, size: 48),
              ),
              const SizedBox(height: 20),
              Text(
                isArabic ? 'تم إرسال العرض للمراجعة!' : 'Offer Submitted for Review!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                isArabic
                  ? 'سيتم مراجعة عرضك وتفعيله خلال 24-48 ساعة. فيما يلي بيانات الدفع الخاصة بنسبة المنصة:'
                  : 'Your offer will be reviewed and activated within 24-48 hours. Below are the platform commission payment details:',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              
              // Billing Info - No bank details
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 40),
                    const SizedBox(height: 12),
                    Text(
                      isArabic
                        ? 'يتم سداد المستحقات عبر تحويل بنكي وفق التفاصيل المرفقة داخل الفاتورة الشهرية.'
                        : 'Payments are made via bank transfer according to the details in the monthly invoice.',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.calendar_today, color: Color(0xFF6C63FF), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          isArabic ? 'الفاتورة: يوم 1 من كل شهر' : 'Invoice: 1st of each month',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    isArabic ? 'فهمت، متابعة' : 'Got it, Continue',
                    style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showOfferPreview(BuildContext context, bool isArabic) {
    final title = isArabic && _titleArController.text.isNotEmpty 
        ? _titleArController.text 
        : _titleController.text;
    final description = isArabic && _descriptionArController.text.isNotEmpty 
        ? _descriptionArController.text 
        : _descriptionController.text;
    final imageUrl = _imageUrlController.text;
    final logoUrl = _logoUrlController.text;
    final payout = _payoutController.text;
    final commission = _commissionController.text;
    final category = _categories.firstWhere(
      (c) => c['value'] == _selectedCategory,
      orElse: () => {'ar': 'عام', 'en': 'General'},
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Color(0xFF1a1a1a),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text(
                    isArabic ? 'معاينة العرض' : 'Offer Preview',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            const Divider(color: Colors.white24),
            // Preview Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Image Preview
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        height: 200,
                        color: Colors.grey.shade900,
                        child: imageUrl.isNotEmpty
                            ? Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                errorBuilder: (_, __, ___) => const Center(
                                  child: Icon(Icons.image, color: Colors.white30, size: 60),
                                ),
                              )
                            : const Center(
                                child: Icon(Icons.image, color: Colors.white30, size: 60),
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Category Badge
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF006E),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isArabic ? category['ar']! : category['en']!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '\$${payout.isEmpty ? "0" : payout}',
                            style: const TextStyle(
                              color: Colors.green,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Title
                    Text(
                      title.isEmpty ? (isArabic ? 'عنوان العرض' : 'Offer Title') : title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Description
                    Text(
                      description.isEmpty 
                          ? (isArabic ? 'وصف العرض' : 'Offer description') 
                          : description,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Commission
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.monetization_on, color: Color(0xFFFF006E), size: 24),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isArabic ? 'عمولة المروج' : 'Promoter Commission',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.6),
                                  fontSize: 12,
                                ),
                              ),
                              Text(
                                '${commission.isEmpty ? "0" : commission}%',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Demo Button
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF006E), Color(0xFFFF4D94)],
                        ),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_circle_outline, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            isArabic ? 'سجّل وأضف العرض' : 'Sign up & Add Offer',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Info
                    Text(
                      isArabic 
                          ? '👆 هكذا سيظهر عرضك للمروجين'
                          : '👆 This is how your offer will appear to promoters',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullAgreement(BuildContext context, bool isArabic) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  const Icon(Icons.description, color: Color(0xFF6C63FF)),
                  const SizedBox(width: 12),
                  Text(
                    isArabic ? 'اتفاقية المعلنين - AffTok' : 'Advertiser Agreement - AffTok',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    isArabic ? '''
نسبة المنصّة
تحصل منصّة AffTok على نسبة قدرها 10% من قيمة العمولات التي يقوم المعلن بدفعها للمروجين، ويُعد هذا الاتفاق ماليًا داخليًا بين الطرفين وغير معلن للمستخدمين أو أطراف خارجية.

التزامات المعلن
• دفع عمولات المروجين مباشرة دون أي تدخل مالي أو تنفيذي من المنصّة.
• سداد نسبة المنصّة وفق الفواتير الشهرية الصادرة عنها.
• تزويد المنصّة بإثبات الدفع خلال المدة المحددة عند الطلب.

التزامات المنصّة
• توفير نظام تتبّع دقيق وآمن للعروض والارتباطات.
• إصدار فواتير شهرية واضحة بنسبة 10% المتفق عليها.
• عدم استلام أو توزيع أو تحويل أي مبالغ تخص المروجين، وتبقى العلاقة المالية الخاصة بالعمولات مباشرة بين المعلن والمروج.

آلية الدفع والمواعيد
• تُصدر الفاتورة الشهرية في اليوم الأول من كل شهر ميلادي.
• يلتزم المعلن بالسداد خلال 7 أيام عمل من تاريخ إصدار الفاتورة.
• في حال كان المبلغ المستحق أقل من 10 دولار، يُرحَّل للشهر التالي.

وسيلة الدفع
تتم عملية السداد الخاصة بنسبة المنصّة عبر تحويل بنكي مباشر لحساب الشركة، وتُزوَّد بيانات الحساب للمعلن عند بدء تفعيل الاتفاق.

الإنهاء
• يحق لأي طرف إنهاء هذه الاتفاقية بإشعار خطي مسبق مدته 30 يومًا.
• تُسدَّد جميع المستحقات المالية قبل سريان الإنهاء.
''' : '''
Platform Commission
AffTok platform receives 10% of the commissions paid by the advertiser to promoters. This is an internal financial agreement between both parties and is not disclosed to users or external parties.

Advertiser Obligations
• Pay promoter commissions directly without any financial or operational intervention from the platform.
• Pay the platform's share according to the monthly invoices issued.
• Provide payment proof within the specified period upon request.

Platform Obligations
• Provide an accurate and secure tracking system for offers and links.
• Issue clear monthly invoices for the agreed 10%.
• Not receive, distribute, or transfer any amounts related to promoters; the financial relationship regarding commissions remains directly between the advertiser and the promoter.

Payment Schedule
• Monthly invoices are issued on the first day of each calendar month.
• The advertiser must pay within 7 business days from the invoice date.
• If the amount due is less than 10 USD, it will be carried over to the next month.

Payment Method
Platform commission payments are made via direct bank transfer to the company account. Account details are provided to the advertiser upon agreement activation.

Termination
• Either party may terminate this agreement with 30 days written notice.
• All outstanding amounts must be paid before termination takes effect.
''',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C63FF),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    isArabic ? 'إغلاق' : 'Close',
                    style: const TextStyle(fontSize: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final isEditing = widget.existingOffer != null;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background "AffTok" shadow text
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
                    letterSpacing: 8,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.1,
            left: -50,
            child: Text(
              'AffTok',
              style: TextStyle(
                fontSize: 80,
                fontWeight: FontWeight.w900,
                color: Colors.white.withOpacity(0.02),
                letterSpacing: 4,
              ),
            ),
          ),
          Positioned(
            bottom: MediaQuery.of(context).size.height * 0.05,
            right: -30,
            child: Text(
              'AffTok',
              style: TextStyle(
                fontSize: 60,
                fontWeight: FontWeight.w900,
                color: Colors.white.withOpacity(0.02),
                letterSpacing: 4,
              ),
            ),
          ),
          // Main Content
          SafeArea(
            child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                    ),
                    Expanded(
                      child: Text(
                        isEditing
                          ? (isArabic ? 'تعديل العرض' : 'Edit Offer')
                          : (isArabic ? 'إضافة عرض جديد' : 'Add New Offer'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 48), // Balance the back button
                  ],
                ),
              ),
              
              // Form
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Info Banner
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6C63FF).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFF6C63FF).withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, color: Color(0xFF6C63FF), size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  isArabic
                                    ? 'سيتم مراجعة العرض قبل نشره للمروجين'
                                    : 'Your offer will be reviewed before being published',
                                  style: const TextStyle(
                                    color: Color(0xFF6C63FF),
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // English Section
                        _buildSectionTitle(isArabic ? 'المعلومات بالإنجليزية' : 'English Information', Icons.language),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _titleController,
                          label: isArabic ? 'عنوان العرض (إنجليزي) *' : 'Offer Title (English) *',
                          icon: Icons.title,
                          validator: (v) => v!.isEmpty ? (isArabic ? 'مطلوب' : 'Required') : null,
                        ),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _descriptionController,
                          label: isArabic ? 'الوصف (إنجليزي)' : 'Description (English)',
                          icon: Icons.description,
                          maxLines: 3,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Arabic Section
                        _buildSectionTitle(isArabic ? 'المعلومات بالعربية' : 'Arabic Information', Icons.translate),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _titleArController,
                          label: isArabic ? 'عنوان العرض (عربي)' : 'Offer Title (Arabic)',
                          icon: Icons.title,
                        ),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _descriptionArController,
                          label: isArabic ? 'الوصف (عربي)' : 'Description (Arabic)',
                          icon: Icons.description,
                          maxLines: 3,
                        ),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _termsArController,
                          label: isArabic ? 'الشروط والأحكام (عربي)' : 'Terms & Conditions (Arabic)',
                          icon: Icons.gavel,
                          maxLines: 3,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Terms & Conditions Section (English)
                        _buildSectionTitle(isArabic ? 'الشروط العامة (إنجليزي)' : 'General Terms (English)', Icons.rule),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _termsController,
                          label: isArabic ? 'الشروط والأحكام (إنجليزي)' : 'Terms & Conditions (English)',
                          icon: Icons.gavel,
                          maxLines: 4,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Geo Targeting Section
                        _buildSectionTitle(isArabic ? 'استهداف الدول' : 'Geo Targeting', Icons.public),
                        
                        const SizedBox(height: 16),
                        _buildCountrySelector(
                          label: isArabic ? 'الدول المستهدفة' : 'Target Countries',
                          selectedCountries: _selectedTargetCountries,
                          onChanged: (countries) => setState(() => _selectedTargetCountries = countries),
                          isArabic: isArabic,
                          hint: isArabic ? 'اختر الدول (اختياري - الافتراضي: كل الدول)' : 'Select countries (optional - default: all)',
                        ),
                        
                        const SizedBox(height: 16),
                        _buildCountrySelector(
                          label: isArabic ? 'الدول الممنوعة' : 'Blocked Countries',
                          selectedCountries: _selectedBlockedCountries,
                          onChanged: (countries) => setState(() => _selectedBlockedCountries = countries),
                          isArabic: isArabic,
                          hint: isArabic ? 'اختر الدول الممنوعة (اختياري)' : 'Select blocked countries (optional)',
                          isBlocked: true,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Additional Notes Section
                        _buildSectionTitle(isArabic ? 'ملاحظات إضافية' : 'Additional Notes', Icons.note_add),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _additionalNotesController,
                          label: isArabic ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (optional)',
                          icon: Icons.notes,
                          maxLines: 3,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // URLs Section
                        _buildSectionTitle(isArabic ? 'الروابط والصور' : 'URLs & Images', Icons.link),
                        
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _destinationUrlController,
                          label: isArabic ? 'رابط العرض *' : 'Destination URL *',
                          icon: Icons.open_in_new,
                          keyboardType: TextInputType.url,
                          validator: (v) {
                            if (v!.isEmpty) return isArabic ? 'مطلوب' : 'Required';
                            if (!v.startsWith('http')) return isArabic ? 'رابط غير صالح' : 'Invalid URL';
                            return null;
                          },
                        ),
                        
                        const SizedBox(height: 16),
                        _buildImagePicker(
                          label: isArabic ? 'صورة العرض' : 'Offer Image',
                          urlController: _imageUrlController,
                          selectedImage: _selectedImage,
                          isUploading: _isUploadingImage,
                          onPick: () => _pickAndUploadImage(isLogo: false),
                          isArabic: isArabic,
                        ),
                        
                        const SizedBox(height: 16),
                        _buildImagePicker(
                          label: isArabic ? 'الشعار' : 'Logo',
                          urlController: _logoUrlController,
                          selectedImage: _selectedLogo,
                          isUploading: _isUploadingLogo,
                          onPick: () => _pickAndUploadImage(isLogo: true),
                          isArabic: isArabic,
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Category & Payout Section
                        _buildSectionTitle(isArabic ? 'التصنيف والعمولة' : 'Category & Payout', Icons.category),
                        
                        const SizedBox(height: 16),
                        _buildDropdown(
                          label: isArabic ? 'التصنيف' : 'Category',
                          value: _selectedCategory,
                          items: _categories.map((c) => DropdownMenuItem(
                            value: c['value'],
                            child: Text(isArabic ? c['ar']! : c['en']!),
                          )).toList(),
                          onChanged: (v) => setState(() => _selectedCategory = v!),
                        ),
                        
                        const SizedBox(height: 16),
                        _buildDropdown(
                          label: isArabic ? 'نوع الدفع' : 'Payout Type',
                          value: _selectedPayoutType,
                          items: _payoutTypes.map((p) => DropdownMenuItem(
                            value: p['value'],
                            child: Text(isArabic ? p['ar']! : p['en']!),
                          )).toList(),
                          onChanged: (v) => setState(() => _selectedPayoutType = v!),
                        ),
                        
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _payoutController,
                                label: isArabic ? 'المبلغ للمعلن' : 'Payout',
                                icon: Icons.attach_money,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildTextField(
                                controller: _commissionController,
                                label: isArabic ? 'عمولة المروج' : 'Commission',
                                icon: Icons.percent,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Legal Disclaimer - إخلاء المسؤولية القانونية
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.orange.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, color: Colors.orange, size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  isArabic
                                    ? 'المنصة ليست طرفاً في الاتفاق المالي بين المعلن والمروج، ودورها يقتصر على توفير التتبع والإحصائيات فقط.'
                                    : 'The platform is not a party to the financial agreement between advertiser and promoter. Its role is limited to providing tracking and statistics only.',
                                  style: TextStyle(
                                    color: Colors.orange.shade200,
                                    fontSize: 12,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Platform Terms Agreement
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withOpacity(0.1)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.handshake, color: const Color(0xFF6C63FF), size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    isArabic ? 'اتفاقية المنصة' : 'Platform Agreement',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                isArabic
                                  ? 'بإرسال هذا العرض، أوافق على أن منصة AffTok تحصل على نسبة 10% من قيمة العمولات المدفوعة للمروجين. هذا الاتفاق مالي داخلي بين الطرفين.'
                                  : 'By submitting this offer, I agree that AffTok platform receives 10% of the commissions paid to promoters. This is an internal financial agreement between both parties.',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.7),
                                  fontSize: 13,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () => _showFullAgreement(context, isArabic),
                                child: Text(
                                  isArabic ? 'عرض الاتفاقية الكاملة ←' : 'View full agreement →',
                                  style: const TextStyle(
                                    color: Color(0xFF6C63FF),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: _agreedToTerms,
                                      onChanged: (value) {
                                        setState(() => _agreedToTerms = value ?? false);
                                      },
                                      activeColor: const Color(0xFF6C63FF),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      isArabic
                                        ? 'أوافق على شروط وأحكام المنصة'
                                        : 'I agree to the platform terms and conditions',
                                      style: TextStyle(
                                        color: Colors.white.withOpacity(0.9),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Preview Button
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: OutlinedButton.icon(
                            onPressed: () => _showOfferPreview(context, isArabic),
                            icon: const Icon(Icons.visibility, color: Color(0xFF6C63FF)),
                            label: Text(
                              isArabic ? 'معاينة العرض' : 'Preview Offer',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF6C63FF),
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFF6C63FF), width: 2),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: (_isLoading || !_agreedToTerms) ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _agreedToTerms ? const Color(0xFF6C63FF) : Colors.grey,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: _isLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : Text(
                                  isEditing
                                    ? (isArabic ? 'تحديث العرض' : 'Update Offer')
                                    : (isArabic ? 'إرسال للمراجعة' : 'Submit for Review'),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                          ),
                        ),
                        
                        const SizedBox(height: 20),
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

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF6C63FF).withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF6C63FF), size: 18),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
        prefixIcon: Icon(icon, color: const Color(0xFF6C63FF)),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6C63FF)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      items: items,
      onChanged: onChanged,
      dropdownColor: const Color(0xFF1A1A2E),
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6C63FF)),
        ),
      ),
    );
  }

  Widget _buildCountrySelector({
    required String label,
    required List<String> selectedCountries,
    required Function(List<String>) onChanged,
    required bool isArabic,
    required String hint,
    bool isBlocked = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => _showCountryPicker(
            selectedCountries: selectedCountries,
            onChanged: onChanged,
            isArabic: isArabic,
            isBlocked: isBlocked,
          ),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selectedCountries.isNotEmpty
                    ? (isBlocked ? Colors.red.withOpacity(0.5) : const Color(0xFF6C63FF))
                    : Colors.white.withOpacity(0.1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isBlocked ? Icons.block : Icons.public,
                  color: isBlocked ? Colors.red : const Color(0xFF6C63FF),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: selectedCountries.isEmpty
                      ? Text(
                          hint,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 14,
                          ),
                        )
                      : Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: selectedCountries.map((code) {
                            final country = _availableCountries.firstWhere(
                              (c) => c['code'] == code,
                              orElse: () => {'code': code, 'en': code, 'ar': code},
                            );
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isBlocked 
                                    ? Colors.red.withOpacity(0.2) 
                                    : const Color(0xFF6C63FF).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isArabic ? country['ar']! : country['en']!,
                                style: TextStyle(
                                  color: isBlocked ? Colors.red : const Color(0xFF6C63FF),
                                  fontSize: 12,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.white.withOpacity(0.3),
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showCountryPicker({
    required List<String> selectedCountries,
    required Function(List<String>) onChanged,
    required bool isArabic,
    required bool isBlocked,
  }) {
    List<String> tempSelected = List.from(selectedCountries);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Color(0xFF1a1a1a),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        isArabic ? 'إلغاء' : 'Cancel',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ),
                    Text(
                      isBlocked
                          ? (isArabic ? 'الدول الممنوعة' : 'Blocked Countries')
                          : (isArabic ? 'الدول المستهدفة' : 'Target Countries'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        onChanged(tempSelected);
                        Navigator.pop(context);
                      },
                      child: Text(
                        isArabic ? 'تم' : 'Done',
                        style: const TextStyle(color: Color(0xFF6C63FF)),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white24),
              // Select All / Clear
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        setModalState(() {
                          tempSelected = _availableCountries.map((c) => c['code']!).toList();
                        });
                      },
                      icon: const Icon(Icons.select_all, size: 18),
                      label: Text(isArabic ? 'تحديد الكل' : 'Select All'),
                      style: TextButton.styleFrom(foregroundColor: Colors.white70),
                    ),
                    const SizedBox(width: 16),
                    TextButton.icon(
                      onPressed: () {
                        setModalState(() {
                          tempSelected.clear();
                        });
                      },
                      icon: const Icon(Icons.clear_all, size: 18),
                      label: Text(isArabic ? 'مسح الكل' : 'Clear All'),
                      style: TextButton.styleFrom(foregroundColor: Colors.white70),
                    ),
                  ],
                ),
              ),
              // Country List
              Expanded(
                child: ListView.builder(
                  itemCount: _availableCountries.length,
                  itemBuilder: (context, index) {
                    final country = _availableCountries[index];
                    final isSelected = tempSelected.contains(country['code']);
                    
                    return ListTile(
                      onTap: () {
                        setModalState(() {
                          if (isSelected) {
                            tempSelected.remove(country['code']);
                          } else {
                            tempSelected.add(country['code']!);
                          }
                        });
                      },
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (isBlocked ? Colors.red : const Color(0xFF6C63FF))
                              : Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(
                          child: Text(
                            country['code']!,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      title: Text(
                        isArabic ? country['ar']! : country['en']!,
                        style: const TextStyle(color: Colors.white),
                      ),
                      trailing: isSelected
                          ? Icon(
                              Icons.check_circle,
                              color: isBlocked ? Colors.red : const Color(0xFF6C63FF),
                            )
                          : null,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker({
    required String label,
    required TextEditingController urlController,
    required File? selectedImage,
    required bool isUploading,
    required VoidCallback onPick,
    required bool isArabic,
  }) {
    final hasImage = urlController.text.isNotEmpty || selectedImage != null;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: isUploading ? null : onPick,
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: hasImage 
                  ? const Color(0xFF6C63FF) 
                  : Colors.white.withOpacity(0.1),
                width: hasImage ? 2 : 1,
              ),
            ),
            child: isUploading
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: Color(0xFF6C63FF)),
                      SizedBox(height: 12),
                      Text(
                        'جاري الرفع...',
                        style: TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                )
              : hasImage
                ? Stack(
                    children: [
                      // Show image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(11),
                        child: selectedImage != null
                          ? Image.file(
                              selectedImage,
                              width: double.infinity,
                              height: 150,
                              fit: BoxFit.cover,
                            )
                          : Image.network(
                              urlController.text,
                              width: double.infinity,
                              height: 150,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Center(
                                child: Icon(Icons.broken_image, color: Colors.white54, size: 40),
                              ),
                            ),
                      ),
                      // Change button
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.edit, color: Colors.white, size: 20),
                            onPressed: onPick,
                            constraints: const BoxConstraints(
                              minWidth: 36,
                              minHeight: 36,
                            ),
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      // Success indicator
                      Positioned(
                        bottom: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                isArabic ? 'تم الرفع' : 'Uploaded',
                                style: const TextStyle(color: Colors.white, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.add_photo_alternate_outlined,
                        color: Color(0xFF6C63FF),
                        size: 40,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isArabic ? 'اضغط لاختيار صورة' : 'Tap to select image',
                        style: const TextStyle(
                          color: Color(0xFF6C63FF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isArabic ? 'من المحفوظات' : 'from gallery',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
