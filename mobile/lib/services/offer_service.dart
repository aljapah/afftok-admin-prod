import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/offer.dart';
import '../models/user_offer.dart';
import '../services/api_service.dart';

class OfferService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> getAllOffers({
    String? status,
    String? category,
    String? sort,
    String? order,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (status != null) queryParams['status'] = status;
      if (category != null) queryParams['category'] = category;
      if (sort != null) queryParams['sort'] = sort;
      if (order != null) queryParams['order'] = order;
      
      final uri = Uri.parse('${ApiConfig.baseUrl}/api/offers')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      ).timeout(ApiConfig.connectTimeout);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['offers'] == null || (data['offers'] is! List)) {
          return {
            'success': true,
            'offers': [],
          };
        }
        
        final offersJson = data['offers'] as List;
        
        if (offersJson.isEmpty) {
          return {
            'success': true,
            'offers': [],
          };
        }
        
        final offers = offersJson.map((json) => Offer.fromJson(json)).toList();
        return {
          'success': true,
          'offers': offers,
        };
      } else {
        return {
          'success': false,
          'error': 'Failed to load offers: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error fetching offers: $e',
      };
    }
  }

  Future<Map<String, dynamic>> getMyOffers() async {
    try {
      final result = await _apiService.get('/offers/my');
      
      if (result['success'] == true) {
        final data = result['data'] as Map<String, dynamic>?;
        
        if (data == null || data['offers'] == null || (data['offers'] is! List)) {
          return {
            'success': true,
            'offers': [],
          };
        }
        
        final offersJson = data['offers'] as List;
        
        if (offersJson.isEmpty) {
          return {
            'success': true,
            'offers': [],
          };
        }
        
        final offers = offersJson.map((json) => UserOffer.fromJson(json)).toList();
        return {
          'success': true,
          'offers': offers,
        };
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Failed to load offers',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error fetching offers: $e',
      };
    }
  }

  Future<Map<String, dynamic>> joinOffer(String offerId) async {
    try {
      final result = await _apiService.post('/offers/$offerId/join', {});
      
      if (result['success'] == true) {
        return {
          'success': true,
          'message': result['message'] ?? 'Offer joined successfully',
        };
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Failed to join offer',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error joining offer: $e',
      };
    }
  }

  Future<Map<String, dynamic>> getOfferStats(String offerId) async {
    try {
      final result = await _apiService.get('/offers/$offerId/stats');
      
      if (result['success'] == true) {
        return {
          'success': true,
          'stats': result['data'],
        };
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Failed to load stats',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error fetching stats: $e',
      };
    }
  }
}
