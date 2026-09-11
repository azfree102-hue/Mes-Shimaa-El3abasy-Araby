# منصة الأستاذة شيماء العباسي — Full Stack

المشروع مقسوم إلى جزئين:

- `student/` واجهة الطالب.
- `teacher/` لوحة الأستاذة.
- `config/` و`core/` و`manage.py` = Django Backend.
- قاعدة البيانات = PostgreSQL على Render، وSQLite محليًا.
- `api-config.js` = عنوان Django API الذي تستخدمه صفحات GitHub Pages.
- `static-bridge.js` = مزامنة البيانات بين الأجهزة.

## 1) تشغيل Django محليًا في Termux

```bash
cd miss_shaimaa
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8080
```

للاختبار على نفس الهاتف:
`http://127.0.0.1:8080/`

## 2) نشر الـ Backend على Render

ارفع المشروع كاملًا إلى GitHub ثم في Render اختر:

**New + → Blueprint**

واختر مستودع GitHub الذي يحتوي على `render.yaml`.

سيتم إنشاء:
- Web Service باسم `miss-shaimaa`
- PostgreSQL database باسم `miss-shaimaa-db`

بعد نجاح النشر، Render سيعطيك رابطًا مثل:

`https://miss-shaimaa.onrender.com`

اختبر:
`https://YOUR-RENDER-URL/api/health/`

يجب أن يظهر:

```json
{"ok":true,"service":"miss-shaimaa-api"}
```

## 3) ربط GitHub Pages بالـ Backend

افتح:

`api-config.js`

وغيّر:

```js
window.PLATFORM_API_URL = "https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com";
```

إلى رابط Render الحقيقي، مثال:

```js
window.PLATFORM_API_URL = "https://miss-shaimaa.onrender.com";
```

ثم ارفع الملف إلى GitHub واعمل Commit.

## 4) تشغيل GitHub Pages

في مستودع GitHub:

**Settings → Pages**

اختَر:

- **Deploy from a branch**
- Branch: `main`
- Folder: `/ (root)`

بعد النشر سيكون رابط الطالب:

`https://USERNAME.github.io/REPOSITORY/`

ورابط لوحة الأستاذة:

`https://USERNAME.github.io/REPOSITORY/teacher/`

## 5) مهم جدًا

لا ترفع `db.sqlite3` إلى GitHub.

GitHub Pages لا يشغّل Django. لذلك:
- GitHub Pages = الواجهة.
- Render = Django + PostgreSQL.

بعد ربط `api-config.js`، أي طلب أو درس أو اختبار أو ملف يتم حفظه عبر Django في قاعدة البيانات، وليس في جهاز واحد فقط.

## 6) المزامنة

الواجهة تسحب البيانات عند فتحها، وتفحص التحديثات الجديدة كل 5 ثوانٍ.

لذلك:
1. الطالب يرسل طلب انضمام من هاتفه.
2. الطلب يصل إلى Django/PostgreSQL.
3. لوحة الأستاذة تسحب التحديث.
4. يظهر الطلب على جهاز الأستاذة بدون الاعتماد على `localStorage` الخاص بجهاز الطالب.

## 7) ملاحظة أمان

هذه النسخة تحل مشكلة مشاركة البيانات بين الأجهزة، لكن نظام تسجيل الدخول الحالي للطالب/الأستاذة ما زال Frontend-based. لا تعتبره نظام مصادقة احترافيًا قبل إضافة Authentication حقيقي على Django.
