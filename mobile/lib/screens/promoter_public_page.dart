import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:url_launcher/url_launcher.dart';
import '../utils/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class PromoterPublicPage extends StatefulWidget {
  final String username;

  const PromoterPublicPage({
    Key? key,
    required this.username,
  }) : super(key: key);

  @override
  State<PromoterPublicPage> createState() => _PromoterPublicPageState();
}

class _PromoterPublicPageState extends State<PromoterPublicPage> {
  late final WebViewController _webViewController;
  bool _isLoading = true;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() async {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.startsWith('http') &&
                (request.url.contains('instagram.com') ||
                 request.url.contains('tiktok.com') ||
                 request.url.contains('twitter.com') ||
                 request.url.contains('youtube.com'))) {
              launchUrl(Uri.parse(request.url), mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            if (request.url.endsWith('privacy.html') || request.url.endsWith('terms.html')) {
              _showHtmlPage(request.url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onPageFinished: (_) {
            _injectUserData();
            setState(() {
              _isLoading = false;
            });
          },
        ),
      );

    try {
      final htmlContent = await _loadPromoterPageFromAPI();
      _webViewController.loadHtmlString(htmlContent, baseUrl: 'https://afftok-backend-prod-production.up.railway.app/');
    } catch (e) {
      print('Error loading HTML: $e');
      final fallbackHtml = await rootBundle.loadString('assets/html/promoter_landing.html');
      _webViewController.loadHtmlString(fallbackHtml, baseUrl: 'https://afftok-backend-prod-production.up.railway.app/');
    }
  }

  Future<String> _loadPromoterPageFromAPI() async {
    try {
      final response = await _apiService.get('/promoter/user/${widget.username}');
      
      if (response['success'] == true && response['html'] != null) {
        return response['html'] as String;
      }
      
      throw Exception('Failed to load promoter page from API');
    } catch (e) {
      print('Error loading from API: $e');
      rethrow;
    }
  }

  void _showHtmlPage(String url) async {
    String title = 'سياسة الخصوصية';
    String filePath = 'assets/html/privacy.html';

    if (url.contains('terms')) {
      title = 'شروط الاستخدام';
      filePath = 'assets/html/terms.html';
    }

    try {
      final htmlContent = await rootBundle.loadString(filePath);

      final pageController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted);

      pageController.addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (JavaScriptMessage message) {
          if (message.message == 'close') {
            Navigator.of(context).pop();
          }
        },
      );

      pageController
        ..setNavigationDelegate(
            NavigationDelegate(
              onPageFinished: (_) {
                pageController.runJavaScript('''
                  const backBtn = document.getElementById('back-btn');
                  if (backBtn) {
                    backBtn.addEventListener('click', (e) => {
                      e.preventDefault();
                      FlutterChannel.postMessage('close');
                    });
                  }
                ''');
              },
            ),
        )
        ..loadHtmlString(htmlContent);

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.black,
        builder: (context) {
          return Scaffold(
            backgroundColor: Colors.black,
            appBar: AppBar(
              backgroundColor: Colors.black,
              title: Text(title, style: const TextStyle(color: Colors.white)),
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ),
            body: WebViewWidget(controller: pageController),
          );
        },
      );
    } catch (e) {
      print('Error loading page: $e');
    }
  }

  void _injectUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;

    if (user != null) {
      final jsCode = '''
        window.userData = {
          username: "${user.username}",
          displayName: "${user.displayName}",
          avatar: "${user.avatarUrl ?? ''}",
          rank: ${user.stats.globalRank},
          totalClicks: ${user.stats.totalClicks},
          totalConversions: ${user.stats.totalConversions},
          conversionRate: ${user.stats.conversionRate.toStringAsFixed(1)}
        };
        if (window.updateProfileData) {
          window.updateProfileData(window.userData);
        }
      ''';

      _webViewController.runJavaScript(jsCode);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLocalizations.of(context);

    return WillPopScope(
      onWillPop: () async {
        Navigator.pop(context);
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          title: Text(lang.myPublicPage ?? "صفحتي", style: const TextStyle(color: Colors.white)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _webViewController),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
          ],
        ),
      ),
    );
  }
}
