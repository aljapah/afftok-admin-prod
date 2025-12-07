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
  });

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
      logoUrl: json['logo_url'] ?? '',
      imageUrl: json['image_url'] ?? '',
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
    };
  }
}
