import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ImgBBService {
  static const String _apiKey = 'a103a6f291178211bb6c422653a01cbb';
  static const String _uploadUrl = 'https://api.imgbb.com/1/upload';

  static Future<String?> uploadImage(File imageFile) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      final cleaned = base64Image.split(',').last;

      final response = await http.post(
        Uri.parse(_uploadUrl),
        body: {
          'key': _apiKey,
          'image': cleaned,
        },
      );

      final data = jsonDecode(response.body);

      if (data["success"] == true) {
        return data["data"]["url"];
      } else {
        print('[ImgBB] Failed: ${response.body}');
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  static Future<String?> uploadImageFromPath(String path) async {
    final file = File(path);
    if (!await file.exists()) return null;
    return uploadImage(file);
  }
}
