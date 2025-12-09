class Offer {
  final String id;
  final String title;
  final String? titleAr;
  final String logoUrl;
  final String imageUrl;
  final String reward;
  final String description;
  final String? descriptionAr;
  final String category;
  final String offerUrl;
  final String registrationUrl;
  final bool isRegistered;

  final String? networkId;
  final String? networkName;
  final String? trackingParameter;
  final String? trackingLinkTemplate;

  final double rating;
  final String usersCount;
  final int payout;
  final String payoutType;
  
  // Payment Source - مصدر الدفع
  final String paymentSource; // noon, amazon, payoneer, direct
  final String? affiliateNetworkId;
  final String? affiliateNetworkName;
  final String? affiliateNetworkLogo;

  Offer({
    required this.id,
    required this.title,
    this.titleAr,
    required this.logoUrl,
    required this.imageUrl,
    required this.reward,
    required this.description,
    this.descriptionAr,
    required this.category,
    required this.offerUrl,
    required this.registrationUrl,
    required this.rating,
    required this.usersCount,
    this.isRegistered = false,
    this.networkId,
    this.networkName,
    this.trackingParameter,
    this.trackingLinkTemplate,
    this.payout = 0,
    this.payoutType = 'cpa',
    this.paymentSource = 'direct',
    this.affiliateNetworkId,
    this.affiliateNetworkName,
    this.affiliateNetworkLogo,
  });
  
  // Get payment source display name
  String getPaymentSourceDisplay(String languageCode) {
    switch (paymentSource) {
      case 'payoneer':
        return languageCode == 'ar' ? 'بايونير' : 'Payoneer';
      case 'direct':
      default:
        return languageCode == 'ar' ? 'دفع مباشر من المعلن' : 'Direct from Advertiser';
    }
  }
  
  // Check if payment is through external network
  bool get isExternalPayment => paymentSource != 'direct';

  // Get title based on language
  String getTitle(String languageCode) {
    if (languageCode == 'ar' && titleAr != null && titleAr!.isNotEmpty) {
      return titleAr!;
    }
    return title;
  }

  // Get description based on language
  String getDescription(String languageCode) {
    if (languageCode == 'ar' && descriptionAr != null && descriptionAr!.isNotEmpty) {
      return descriptionAr!;
    }
    return description;
  }

  // Legacy getter for compatibility
  String get companyName => title;

  factory Offer.fromJson(Map<String, dynamic> json) {
    final payout = json['payout'] ?? json['commission'] ?? 0;
    final payoutType = json['payout_type'] ?? 'cpa';

    String rewardText = '\$$payout per $payoutType';
    
    // Parse rating safely
    double rating = 4.5;
    if (json['rating'] != null) {
      if (json['rating'] is double) {
        rating = json['rating'];
      } else if (json['rating'] is int) {
        rating = (json['rating'] as int).toDouble();
      } else if (json['rating'] is String) {
        rating = double.tryParse(json['rating']) ?? 4.5;
      }
    }

    return Offer(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? 'Offer',
      titleAr: json['title_ar'],
      logoUrl: json['logo_url'] ?? 'https://via.placeholder.com/100x100/1a1a2e/ffffff?text=Logo',
      imageUrl: json['image_url'] ?? 'https://via.placeholder.com/400x200/1a1a2e/ffffff?text=Offer',
      reward: rewardText,
      description: json['description'] ?? '',
      descriptionAr: json['description_ar'],
      category: json['category'] ?? 'General',
      offerUrl: json['destination_url'] ?? '',
      registrationUrl: json['destination_url'] ?? '',
      rating: rating,
      usersCount: json['users_count']?.toString() ?? '0',
      isRegistered: json['is_registered'] ?? false,
      networkId: json['network_id']?.toString(),
      networkName: json['network_name'],
      trackingParameter: json['tracking_parameter'],
      trackingLinkTemplate: json['tracking_link_template'],
      payout: payout is int ? payout : (payout as num).toInt(),
      payoutType: payoutType,
      paymentSource: json['payment_source'] ?? 'direct',
      affiliateNetworkId: json['affiliate_network_id']?.toString(),
      affiliateNetworkName: json['affiliate_network_name'],
      affiliateNetworkLogo: json['affiliate_network_logo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'title_ar': titleAr,
      'logo_url': logoUrl,
      'image_url': imageUrl,
      'description': description,
      'description_ar': descriptionAr,
      'category': category,
      'destination_url': offerUrl,
      'payout': payout,
      'payout_type': payoutType,
      'rating': rating,
      'users_count': usersCount,
      'is_registered': isRegistered,
      'network_id': networkId,
      'network_name': networkName,
      'tracking_parameter': trackingParameter,
      'tracking_link_template': trackingLinkTemplate,
      'payment_source': paymentSource,
      'affiliate_network_id': affiliateNetworkId,
      'affiliate_network_name': affiliateNetworkName,
      'affiliate_network_logo': affiliateNetworkLogo,
    };
  }
}

// Affiliate Network Model - نموذج شبكة الأفلييت
class AffiliateNetwork {
  final String id;
  final String name;
  final String? nameAr;
  final String type; // marketplace, payment_provider, direct
  final String? logoUrl;
  final String? websiteUrl;
  final String? affiliateProgramUrl;
  final String? paymentMethod;
  final String paymentCurrency;
  final int minPayout;
  final String? paymentCycle;
  final List<String> supportedCountries;
  final String status;
  
  AffiliateNetwork({
    required this.id,
    required this.name,
    this.nameAr,
    required this.type,
    this.logoUrl,
    this.websiteUrl,
    this.affiliateProgramUrl,
    this.paymentMethod,
    this.paymentCurrency = 'USD',
    this.minPayout = 50,
    this.paymentCycle,
    this.supportedCountries = const [],
    this.status = 'active',
  });
  
  String getDisplayName(String languageCode) {
    if (languageCode == 'ar' && nameAr != null && nameAr!.isNotEmpty) {
      return nameAr!;
    }
    return name;
  }
  
  bool get isActive => status == 'active';
  bool get isComingSoon => status == 'coming_soon';
  
  factory AffiliateNetwork.fromJson(Map<String, dynamic> json) {
    List<String> countries = [];
    if (json['supported_countries'] != null) {
      if (json['supported_countries'] is List) {
        countries = List<String>.from(json['supported_countries']);
      } else if (json['supported_countries'] is String) {
        // Parse JSON string
        try {
          countries = List<String>.from(
            (json['supported_countries'] as String).isNotEmpty 
              ? List<String>.from(json['supported_countries'].split(','))
              : []
          );
        } catch (_) {}
      }
    }
    
    return AffiliateNetwork(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      nameAr: json['name_ar'],
      type: json['type'] ?? 'direct',
      logoUrl: json['logo_url'],
      websiteUrl: json['website_url'],
      affiliateProgramUrl: json['affiliate_program_url'],
      paymentMethod: json['payment_method'],
      paymentCurrency: json['payment_currency'] ?? 'USD',
      minPayout: json['min_payout'] ?? 50,
      paymentCycle: json['payment_cycle'],
      supportedCountries: countries,
      status: json['status'] ?? 'active',
    );
  }
}
