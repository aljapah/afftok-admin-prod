import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../services/advertiser_service.dart';
import '../../l10n/app_localizations.dart';

class ConversionsScreen extends StatefulWidget {
  const ConversionsScreen({super.key});

  @override
  State<ConversionsScreen> createState() => _ConversionsScreenState();
}

class _ConversionsScreenState extends State<ConversionsScreen> {
  final AdvertiserService _advertiserService = AdvertiserService();
  
  bool _isLoading = true;
  String? _error;
  List<dynamic> _conversions = [];
  Map<String, dynamic> _summary = {};
  
  String _selectedStatus = 'all';

  @override
  void initState() {
    super.initState();
    _loadConversions();
  }

  Future<void> _loadConversions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;
      
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await _advertiserService.getConversions(
        token,
        status: _selectedStatus == 'all' ? null : _selectedStatus,
      );
      
      setState(() {
        _conversions = response['conversions'] ?? [];
        _summary = response['summary'] ?? {};
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLocalizations.of(context);
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Text(
          isArabic ? 'التحويلات' : 'Conversions',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadConversions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF6C63FF)),
            )
          : _error != null
              ? _buildErrorWidget(isArabic)
              : _buildContent(isArabic),
    );
  }

  Widget _buildErrorWidget(bool isArabic) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red.withOpacity(0.7),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadConversions,
              icon: const Icon(Icons.refresh),
              label: Text(isArabic ? 'إعادة المحاولة' : 'Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C63FF),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(bool isArabic) {
    return Column(
      children: [
        // Summary Cards
        _buildSummaryCards(isArabic),
        
        // Filter Chips
        _buildFilterChips(isArabic),
        
        // Conversions List
        Expanded(
          child: _conversions.isEmpty
              ? _buildEmptyState(isArabic)
              : _buildConversionsList(isArabic),
        ),
      ],
    );
  }

  Widget _buildSummaryCards(bool isArabic) {
    final totalCommission = (_summary['total_commission'] ?? 0.0).toDouble();
    final approvedCount = _summary['approved_count'] ?? 0;
    final pendingCount = _summary['pending_count'] ?? 0;
    final rejectedCount = _summary['rejected_count'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildSummaryCard(
            icon: Icons.check_circle,
            color: Colors.green,
            value: approvedCount.toString(),
            label: isArabic ? 'مقبول' : 'Approved',
          ),
          const SizedBox(width: 8),
          _buildSummaryCard(
            icon: Icons.pending,
            color: Colors.orange,
            value: pendingCount.toString(),
            label: isArabic ? 'معلق' : 'Pending',
          ),
          const SizedBox(width: 8),
          _buildSummaryCard(
            icon: Icons.cancel,
            color: Colors.red,
            value: rejectedCount.toString(),
            label: isArabic ? 'مرفوض' : 'Rejected',
          ),
          const SizedBox(width: 8),
          _buildSummaryCard(
            icon: Icons.attach_money,
            color: const Color(0xFF6C63FF),
            value: '\$${totalCommission.toStringAsFixed(2)}',
            label: isArabic ? 'العمولة' : 'Commission',
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard({
    required IconData icon,
    required Color color,
    required String value,
    required String label,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips(bool isArabic) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildFilterChip('all', isArabic ? 'الكل' : 'All', isArabic),
          const SizedBox(width: 8),
          _buildFilterChip('approved', isArabic ? 'مقبول' : 'Approved', isArabic),
          const SizedBox(width: 8),
          _buildFilterChip('pending', isArabic ? 'معلق' : 'Pending', isArabic),
          const SizedBox(width: 8),
          _buildFilterChip('rejected', isArabic ? 'مرفوض' : 'Rejected', isArabic),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String status, String label, bool isArabic) {
    final isSelected = _selectedStatus == status;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedStatus = status;
        });
        _loadConversions();
      },
      backgroundColor: Colors.grey[900],
      selectedColor: const Color(0xFF6C63FF),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.white.withOpacity(0.7),
        fontSize: 12,
      ),
      checkmarkColor: Colors.white,
    );
  }

  Widget _buildEmptyState(bool isArabic) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.swap_horiz,
            size: 80,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            isArabic ? 'لا توجد تحويلات' : 'No Conversions',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isArabic 
                ? 'ستظهر التحويلات هنا عند حدوثها'
                : 'Conversions will appear here when they occur',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildConversionsList(bool isArabic) {
    return RefreshIndicator(
      onRefresh: _loadConversions,
      color: const Color(0xFF6C63FF),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _conversions.length,
        itemBuilder: (context, index) {
          final conversion = _conversions[index];
          return _buildConversionCard(conversion, isArabic);
        },
      ),
    );
  }

  Widget _buildConversionCard(Map<String, dynamic> conversion, bool isArabic) {
    final status = conversion['status'] ?? 'pending';
    final commission = (conversion['commission'] ?? 0.0).toDouble();
    final promoterName = conversion['promoter_full_name'] ?? conversion['promoter_name'] ?? 'Unknown';
    final offerTitle = conversion['offer_title'] ?? 'Unknown Offer';
    final convertedAt = conversion['converted_at'];
    final externalId = conversion['external_conversion_id'] ?? '';

    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (status) {
      case 'approved':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = isArabic ? 'مقبول' : 'Approved';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = isArabic ? 'مرفوض' : 'Rejected';
        break;
      default:
        statusColor = Colors.orange;
        statusIcon = Icons.pending;
        statusText = isArabic ? 'معلق' : 'Pending';
    }

    String formattedDate = '';
    if (convertedAt != null) {
      try {
        final date = DateTime.parse(convertedAt);
        formattedDate = DateFormat('yyyy/MM/dd HH:mm').format(date);
      } catch (e) {
        formattedDate = convertedAt.toString();
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: statusColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, color: statusColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                '\$${commission.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Color(0xFF6C63FF),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Offer Title
          Row(
            children: [
              Icon(
                Icons.local_offer,
                color: Colors.white.withOpacity(0.5),
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  offerTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          
          // Promoter
          Row(
            children: [
              Icon(
                Icons.person,
                color: Colors.white.withOpacity(0.5),
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                promoterName,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          
          // Date
          Row(
            children: [
              Icon(
                Icons.access_time,
                color: Colors.white.withOpacity(0.5),
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                formattedDate,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          
          // External ID (if exists)
          if (externalId.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.tag,
                  color: Colors.white.withOpacity(0.5),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'ID: $externalId',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.4),
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
