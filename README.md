# زاد — مذاكرة تفاعلية (Zad Study App)

تطبيق ويب بسيط (HTML/CSS/JS فقط، بدون أي مكتبات) لمذاكرة ٧ مواد على مدى سنتين.
كل محاضرة = ملف JSON واحد، والقالب يعرضه تلقائيًا (ملخّص + ببساطة، بطاقات، اختبار، تحدّي).

## البنية

```
index.html          صفحة المواد السبعة
subject.html        قائمة محاضرات المادة (حسب السنة)
lecture.html        عارض المحاضرة (يقرأ ملف JSON)
assets/style.css    التصميم المشترك
assets/app.js       المنطق المشترك
data/subjects.json  فهرس المواد والمحاضرات
data/<subject>/<id>.json   محتوى كل محاضرة
```

## النشر على GitHub Pages (مجانًا)

1. اعملي حساب على GitHub، ثم New repository باسم مثل `zad-app` (Public).
2. ارفعي كل الملفات دي (اسحبيها في صفحة الريبو → Add file → Upload files → Commit)، أو بالأوامر:
   ```
   git init
   git add .
   git commit -m "first version"
   git branch -M main
   git remote add origin https://github.com/<username>/zad-app.git
   git push -u origin main
   ```
3. في الريبو: **Settings → Pages**.
4. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → **Save**.
5. استني دقيقة، وهيظهر لينك زي:
   `https://<username>.github.io/zad-app/`
6. افتحيه من الموبايل، ومن قائمة المتصفح اختاري **Add to Home Screen** ليشتغل كأنه تطبيق.

## إضافة محاضرة جديدة

1. انسخي أي ملف موجود (مثلاً `data/fiqh/y1-lec1.json`) وعدّلي محتواه.
2. حطّيه في مجلد المادة باسم مثل `y1-lec2.json`.
3. أضيفي سطرًا له في `data/subjects.json` تحت السنة المناسبة:
   ```json
   { "id": "y1-lec2", "no": 2, "title": "المحاضرة الثانية", "subtitle": "..." }
   ```
4. خلاص — يظهر تلقائيًا في صفحة المادة.

## مخطط ملف المحاضرة (JSON)

- `title`, `subtitle`, `subjectName`, `lead` — العناوين والمقدمة (HTML مسموح).
- `summary[]` — أقسام الملخّص: `{ num, heading, html }` (استخدمي كلاسات: `sacred`, `baladi`, `ex`, `callout`, `flow`…).
- `cardFilters[]` — أزرار تصنيف البطاقات: `{ key, label }`.
- `cards[]` — البطاقات: `{ c, cat, q, back }` (c = مفتاح التصنيف).
- `quiz[]` — الأسئلة: `{ q, o:[...], a:index, e }` (a = رقم الإجابة الصحيحة من 0).
- `hard[]` — أسئلة التحدّي: `{ q, a }`.

## ملاحظة مهمة

يجب فتح الموقع عبر رابط (GitHub Pages / خادم محلي) وليس بالنقر المزدوج على الملف،
لأن `fetch` لملفات JSON لا يعمل مع بروتوكول `file://`.
للتجربة محليًا: `python3 -m http.server` داخل المجلد ثم افتحي `http://localhost:8000`.
