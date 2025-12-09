# 📊 AffTok Diagrams

## قائمة الرسومات (15 رسمة)

| # | الملف | الوصف |
|---|-------|-------|
| 01 | `01_system_architecture.mmd` | هيكل النظام الكامل |
| 02 | `02_backend_architecture.mmd` | بنية الـ Backend (Go) |
| 03 | `03_admin_panel_rbac.mmd` | نظام الصلاحيات RBAC |
| 04 | `04_mobile_app_architecture.mmd` | بنية تطبيق الموبايل |
| 05 | `05_database_schema.mmd` | مخطط قاعدة البيانات |
| 06 | `06_click_tracking_flow.mmd` | تدفق تتبع النقرات |
| 07 | `07_conversion_flow.mmd` | تدفق التحويلات |
| 08 | `08_fraud_detection.mmd` | طبقات كشف الاحتيال |
| 09 | `09_advertiser_integration.mmd` | تكامل المعلنين |
| 10 | `10_webhook_delivery.mmd` | إرسال الـ Webhooks |
| 11 | `11_auth_flow.mmd` | تدفق المصادقة |
| 12 | `12_geo_targeting.mmd` | الاستهداف الجغرافي |
| 13 | `13_api_routes.mmd` | مسارات الـ API |
| 14 | `14_deployment.mmd` | هيكل النشر |
| 15 | `15_security_layers.mmd` | طبقات الأمان |

---

## تحويل Mermaid إلى PNG

### الطريقة 1: Mermaid CLI (مُوصى بها)

```bash
# تثبيت
npm install -g @mermaid-js/mermaid-cli

# تحويل ملف واحد
mmdc -i 01_system_architecture.mmd -o 01_system_architecture.png -t dark -b transparent

# تحويل جميع الملفات
for f in *.mmd; do mmdc -i "$f" -o "${f%.mmd}.png" -t dark -b transparent; done
```

### الطريقة 2: Mermaid Live Editor (أونلاين)

1. افتح: https://mermaid.live
2. انسخ محتوى ملف `.mmd`
3. الصق في المحرر
4. اضغط "Download PNG"

### الطريقة 3: VS Code Extension

1. تثبيت إضافة "Markdown Preview Mermaid Support"
2. فتح ملف `.mmd`
3. Preview → Export PNG

---

## تخصيص المظهر

```javascript
%%{init: {'theme': 'dark'}}%%   // ثيم داكن
%%{init: {'theme': 'forest'}}%% // ثيم أخضر
%%{init: {'theme': 'neutral'}}%% // ثيم محايد
```

---

## أمثلة الاستخدام

### في التوثيق (Markdown)

```markdown
![System Architecture](./diagrams/01_system_architecture.png)
```

### في HTML

```html
<img src="diagrams/01_system_architecture.png" alt="System Architecture">
```

---

## ملاحظات

- جميع الرسومات بثيم داكن (Dark Theme)
- متوافقة مع Mermaid v10+
- يمكن تعديلها بسهولة (نص عادي)

---

**آخر تحديث:** ديسمبر 8, 2025

