import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/app_localizations.dart';

class GeoTargetingScreen extends StatefulWidget {
  final String? offerId;
  final String? offerName;
  
  const GeoTargetingScreen({
    super.key,
    this.offerId,
    this.offerName,
  });

  @override
  State<GeoTargetingScreen> createState() => _GeoTargetingScreenState();
}

class _GeoTargetingScreenState extends State<GeoTargetingScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  
  // Selected countries
  Set<String> _selectedCountries = {};
  String _mode = 'allow'; // 'allow' or 'block'
  String _searchQuery = '';
  
  // All countries with Arabic names
  static const Map<String, Map<String, String>> _countries = {
    'SA': {'en': 'Saudi Arabia', 'ar': 'السعودية', 'flag': '🇸🇦'},
    'AE': {'en': 'UAE', 'ar': 'الإمارات', 'flag': '🇦🇪'},
    'KW': {'en': 'Kuwait', 'ar': 'الكويت', 'flag': '🇰🇼'},
    'QA': {'en': 'Qatar', 'ar': 'قطر', 'flag': '🇶🇦'},
    'BH': {'en': 'Bahrain', 'ar': 'البحرين', 'flag': '🇧🇭'},
    'OM': {'en': 'Oman', 'ar': 'عُمان', 'flag': '🇴🇲'},
    'EG': {'en': 'Egypt', 'ar': 'مصر', 'flag': '🇪🇬'},
    'JO': {'en': 'Jordan', 'ar': 'الأردن', 'flag': '🇯🇴'},
    'LB': {'en': 'Lebanon', 'ar': 'لبنان', 'flag': '🇱🇧'},
    'IQ': {'en': 'Iraq', 'ar': 'العراق', 'flag': '🇮🇶'},
    'SY': {'en': 'Syria', 'ar': 'سوريا', 'flag': '🇸🇾'},
    'PS': {'en': 'Palestine', 'ar': 'فلسطين', 'flag': '🇵🇸'},
    'YE': {'en': 'Yemen', 'ar': 'اليمن', 'flag': '🇾🇪'},
    'LY': {'en': 'Libya', 'ar': 'ليبيا', 'flag': '🇱🇾'},
    'TN': {'en': 'Tunisia', 'ar': 'تونس', 'flag': '🇹🇳'},
    'DZ': {'en': 'Algeria', 'ar': 'الجزائر', 'flag': '🇩🇿'},
    'MA': {'en': 'Morocco', 'ar': 'المغرب', 'flag': '🇲🇦'},
    'SD': {'en': 'Sudan', 'ar': 'السودان', 'flag': '🇸🇩'},
    'US': {'en': 'United States', 'ar': 'أمريكا', 'flag': '🇺🇸'},
    'GB': {'en': 'United Kingdom', 'ar': 'بريطانيا', 'flag': '🇬🇧'},
    'CA': {'en': 'Canada', 'ar': 'كندا', 'flag': '🇨🇦'},
    'AU': {'en': 'Australia', 'ar': 'أستراليا', 'flag': '🇦🇺'},
    'DE': {'en': 'Germany', 'ar': 'ألمانيا', 'flag': '🇩🇪'},
    'FR': {'en': 'France', 'ar': 'فرنسا', 'flag': '🇫🇷'},
    'IT': {'en': 'Italy', 'ar': 'إيطاليا', 'flag': '🇮🇹'},
    'ES': {'en': 'Spain', 'ar': 'إسبانيا', 'flag': '🇪🇸'},
    'NL': {'en': 'Netherlands', 'ar': 'هولندا', 'flag': '🇳🇱'},
    'TR': {'en': 'Turkey', 'ar': 'تركيا', 'flag': '🇹🇷'},
    'IN': {'en': 'India', 'ar': 'الهند', 'flag': '🇮🇳'},
    'PK': {'en': 'Pakistan', 'ar': 'باكستان', 'flag': '🇵🇰'},
    'BD': {'en': 'Bangladesh', 'ar': 'بنغلاديش', 'flag': '🇧🇩'},
    'ID': {'en': 'Indonesia', 'ar': 'إندونيسيا', 'flag': '🇮🇩'},
    'MY': {'en': 'Malaysia', 'ar': 'ماليزيا', 'flag': '🇲🇾'},
    'SG': {'en': 'Singapore', 'ar': 'سنغافورة', 'flag': '🇸🇬'},
    'TH': {'en': 'Thailand', 'ar': 'تايلاند', 'flag': '🇹🇭'},
    'PH': {'en': 'Philippines', 'ar': 'الفلبين', 'flag': '🇵🇭'},
    'JP': {'en': 'Japan', 'ar': 'اليابان', 'flag': '🇯🇵'},
    'KR': {'en': 'South Korea', 'ar': 'كوريا الجنوبية', 'flag': '🇰🇷'},
    'CN': {'en': 'China', 'ar': 'الصين', 'flag': '🇨🇳'},
    'BR': {'en': 'Brazil', 'ar': 'البرازيل', 'flag': '🇧🇷'},
    'MX': {'en': 'Mexico', 'ar': 'المكسيك', 'flag': '🇲🇽'},
    'ZA': {'en': 'South Africa', 'ar': 'جنوب أفريقيا', 'flag': '🇿🇦'},
    'NG': {'en': 'Nigeria', 'ar': 'نيجيريا', 'flag': '🇳🇬'},
    'KE': {'en': 'Kenya', 'ar': 'كينيا', 'flag': '🇰🇪'},
  };

  // Gulf countries for quick select
  static const List<String> _gulfCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'];
  static const List<String> _arabCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'SY', 'PS', 'YE', 'LY', 'TN', 'DZ', 'MA', 'SD'];

  @override
  void initState() {
    super.initState();
    _loadExistingRules();
  }

  Future<void> _loadExistingRules() async {
    setState(() => _isLoading = true);
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userId = authProvider.currentUser?.id;
      
      if (userId == null) {
        setState(() {
          _isLoading = false;
          _error = 'User not found';
        });
        return;
      }

      // Load existing geo rules for this advertiser or offer
      final endpoint = widget.offerId != null 
          ? '/geo-rules?scope_type=offer&scope_id=${widget.offerId}'
          : '/geo-rules?scope_type=advertiser&scope_id=$userId';
      
      final response = await _apiService.get(endpoint);
      
      if (response != null && response['rules'] != null) {
        final rules = response['rules'] as List;
        if (rules.isNotEmpty) {
          final rule = rules.first;
          setState(() {
            _mode = rule['mode'] ?? 'allow';
            _selectedCountries = Set<String>.from(rule['countries'] ?? []);
          });
        }
      }
      
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        // Don't show error - just start with empty selection
      });
    }
  }

  Future<void> _saveRules() async {
    if (_selectedCountries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isArabic ? 'اختر دولة واحدة على الأقل' : 'Select at least one country'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userId = authProvider.currentUser?.id;

      final body = {
        'scope_type': widget.offerId != null ? 'offer' : 'advertiser',
        'scope_id': widget.offerId ?? userId,
        'mode': _mode,
        'countries': _selectedCountries.toList(),
        'name': widget.offerName != null 
            ? 'Geo rule for ${widget.offerName}'
            : 'Advertiser geo rule',
      };

      await _apiService.post('/geo-rules', body);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isArabic ? 'تم حفظ الاستهداف الجغرافي ✅' : 'Geo targeting saved ✅'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isArabic ? 'فشل الحفظ: $e' : 'Save failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  bool get _isArabic => Localizations.localeOf(context).languageCode == 'ar';

  List<MapEntry<String, Map<String, String>>> get _filteredCountries {
    if (_searchQuery.isEmpty) {
      return _countries.entries.toList();
    }
    
    final query = _searchQuery.toLowerCase();
    return _countries.entries.where((entry) {
      final nameEn = entry.value['en']!.toLowerCase();
      final nameAr = entry.value['ar']!;
      return nameEn.contains(query) || nameAr.contains(query) || entry.key.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isArabic = _isArabic;
    
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Text(
          isArabic ? '🎯 استهداف الدول' : '🎯 Geo Targeting',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (!_isLoading)
            TextButton(
              onPressed: _isSaving ? null : _saveRules,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      isArabic ? 'حفظ' : 'Save',
                      style: const TextStyle(
                        color: Color(0xFFFF006E),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF006E)))
          : Column(
              children: [
                // Mode selector
                _buildModeSelector(isArabic),
                
                // Quick select buttons
                _buildQuickSelect(isArabic),
                
                // Search
                _buildSearchBar(isArabic),
                
                // Selected count
                _buildSelectedCount(isArabic),
                
                // Countries list
                Expanded(
                  child: _buildCountriesList(isArabic),
                ),
              ],
            ),
    );
  }

  Widget _buildModeSelector(bool isArabic) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _mode = 'allow'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _mode == 'allow' ? const Color(0xFF4CAF50) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: _mode == 'allow' ? Colors.white : Colors.grey,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isArabic ? 'السماح فقط' : 'Allow Only',
                      style: TextStyle(
                        color: _mode == 'allow' ? Colors.white : Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _mode = 'block'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _mode == 'block' ? Colors.red : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.block,
                      color: _mode == 'block' ? Colors.white : Colors.grey,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isArabic ? 'حظر فقط' : 'Block Only',
                      style: TextStyle(
                        color: _mode == 'block' ? Colors.white : Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickSelect(bool isArabic) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildQuickButton(
            isArabic ? '🏜️ الخليج' : '🏜️ Gulf',
            _gulfCountries,
            const Color(0xFFFFD700),
          ),
          const SizedBox(width: 8),
          _buildQuickButton(
            isArabic ? '🌍 العرب' : '🌍 Arab',
            _arabCountries,
            const Color(0xFF4CAF50),
          ),
          const SizedBox(width: 8),
          _buildQuickButton(
            isArabic ? '🌐 الكل' : '🌐 All',
            _countries.keys.toList(),
            const Color(0xFF2196F3),
          ),
          const SizedBox(width: 8),
          _buildQuickButton(
            isArabic ? '❌ مسح' : '❌ Clear',
            [],
            Colors.grey,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickButton(String label, List<String> countries, Color color) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            if (countries.isEmpty) {
              _selectedCountries.clear();
            } else {
              _selectedCountries = Set<String>.from(countries);
            }
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.5)),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar(bool isArabic) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        onChanged: (value) => setState(() => _searchQuery = value),
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: isArabic ? '🔍 ابحث عن دولة...' : '🔍 Search country...',
          hintStyle: TextStyle(color: Colors.grey[600]),
          filled: true,
          fillColor: Colors.grey[900],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
        ),
      ),
    );
  }

  Widget _buildSelectedCount(bool isArabic) {
    final count = _selectedCountries.length;
    final modeText = _mode == 'allow'
        ? (isArabic ? 'مسموح' : 'allowed')
        : (isArabic ? 'محظور' : 'blocked');
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _mode == 'allow' ? const Color(0xFF4CAF50).withOpacity(0.2) : Colors.red.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              isArabic 
                  ? '$count دولة $modeText'
                  : '$count countries $modeText',
              style: TextStyle(
                color: _mode == 'allow' ? const Color(0xFF4CAF50) : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountriesList(bool isArabic) {
    final countries = _filteredCountries;
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: countries.length,
      itemBuilder: (context, index) {
        final entry = countries[index];
        final code = entry.key;
        final data = entry.value;
        final isSelected = _selectedCountries.contains(code);
        
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedCountries.remove(code);
              } else {
                _selectedCountries.add(code);
              }
            });
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected 
                  ? (_mode == 'allow' ? const Color(0xFF4CAF50).withOpacity(0.2) : Colors.red.withOpacity(0.2))
                  : Colors.grey[900],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected 
                    ? (_mode == 'allow' ? const Color(0xFF4CAF50) : Colors.red)
                    : Colors.transparent,
                width: 2,
              ),
            ),
            child: Row(
              children: [
                Text(
                  data['flag']!,
                  style: const TextStyle(fontSize: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isArabic ? data['ar']! : data['en']!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        code,
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                  color: isSelected 
                      ? (_mode == 'allow' ? const Color(0xFF4CAF50) : Colors.red)
                      : Colors.grey,
                  size: 28,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

