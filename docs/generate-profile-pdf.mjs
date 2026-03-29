/**
 * UOH Meetings Platform — Professional Profile PDF Generator
 * Captures screenshots from the running platform and generates a PDF document.
 *
 * Usage: node docs/generate-profile-pdf.mjs
 * Requirements: Platform running on localhost:8091, API on localhost:5182
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEB_URL = 'http://localhost:8091';
const API_URL = 'http://localhost:5182';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_PDF = path.join(__dirname, 'منصة-اجتماعات-جامعة-حائل-العرض-الفني.pdf');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Pages to capture
const PAGES = [
  { name: 'login', path: '/login', title: 'صفحة تسجيل الدخول', needsAuth: false, wait: 1500 },
  { name: 'dashboard', path: '/', title: 'لوحة المعلومات الرئيسية', needsAuth: true, wait: 2500 },
  { name: 'committees', path: '/committees', title: 'إدارة اللجان', needsAuth: true, wait: 2000 },
  { name: 'meetings', path: '/meetings', title: 'إدارة الاجتماعات', needsAuth: true, wait: 2000 },
  { name: 'calendar', path: '/calendar', title: 'التقويم', needsAuth: true, wait: 2000 },
  { name: 'moms', path: '/moms', title: 'محاضر الاجتماعات', needsAuth: true, wait: 2000 },
  { name: 'tasks', path: '/tasks', title: 'المهام والتوصيات', needsAuth: true, wait: 2000 },
  { name: 'votes', path: '/votes', title: 'التصويت', needsAuth: true, wait: 2000 },
  { name: 'surveys', path: '/surveys', title: 'الاستبيانات', needsAuth: true, wait: 2000 },
  { name: 'directives', path: '/directives', title: 'التوجيهات والقرارات', needsAuth: true, wait: 2000 },
  { name: 'evaluations', path: '/evaluations', title: 'التقييمات', needsAuth: true, wait: 2000 },
  { name: 'locations', path: '/locations', title: 'المواقع والقاعات', needsAuth: true, wait: 2000 },
  { name: 'room-booking', path: '/room-booking', title: 'حجز القاعات', needsAuth: true, wait: 2000 },
  { name: 'reports', path: '/reports', title: 'التقارير', needsAuth: true, wait: 2000 },
  { name: 'workflow', path: '/workflow', title: 'سير العمل', needsAuth: true, wait: 2000 },
  { name: 'acknowledgments', path: '/acknowledgments', title: 'الإقرارات', needsAuth: true, wait: 2000 },
  { name: 'profile', path: '/profile', title: 'الملف الشخصي', needsAuth: true, wait: 2000 },
  { name: 'admin-users', path: '/admin/users', title: 'إدارة المستخدمين', needsAuth: true, wait: 2000 },
  { name: 'admin-roles', path: '/admin/roles', title: 'إدارة الأدوار', needsAuth: true, wait: 2000 },
  { name: 'admin-permissions', path: '/admin/permissions', title: 'إدارة الصلاحيات', needsAuth: true, wait: 2000 },
  { name: 'admin-adsync', path: '/admin/ad-sync', title: 'مزامنة Active Directory', needsAuth: true, wait: 2000 },
];

async function main() {
  console.log('🚀 Starting UOH Platform Profile PDF Generator...\n');

  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar-SA,ar;q=0.9' });

  // Step 1: Capture LOGIN page BEFORE authentication
  console.log('📷 Capturing login page first (unauthenticated)...');
  try {
    await page.goto(WEB_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    const loginPath = path.join(SCREENSHOTS_DIR, 'login.png');
    await page.screenshot({ path: loginPath, fullPage: false, type: 'png' });
    console.log('   ✅ Login page captured\n');
  } catch (err) {
    console.log(`   ⚠️ Login capture: ${err.message.slice(0, 60)}\n`);
  }

  // Step 2: Authenticate
  console.log('🔐 Logging in as SystemAdmin...');
  try {
    const loginData = await page.evaluate(async (apiUrl) => {
      const resp = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sysadmin@uoh.edu.sa', password: 'Uoh@2024' }),
      });
      if (!resp.ok) throw new Error(`Login failed: ${resp.status}`);
      return resp.json();
    }, API_URL);

    await page.evaluate((data) => {
      localStorage.setItem('uoh_auth', JSON.stringify({ user: data.user, token: data.token }));
    }, loginData);

    // Navigate to home to trigger auth state update
    await page.goto(WEB_URL + '/', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    console.log('✅ Logged in successfully\n');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    await browser.close();
    process.exit(1);
  }

  // Step 3: Capture all authenticated pages
  console.log('📸 Capturing screenshots...\n');
  const screenshots = {};

  // Add login screenshot manually
  const loginFile = path.join(SCREENSHOTS_DIR, 'login.png');
  if (fs.existsSync(loginFile)) screenshots['login'] = loginFile;

  for (const pg of PAGES) {
    if (pg.name === 'login') continue; // Already captured
    const url = WEB_URL + pg.path;
    const filePath = path.join(SCREENSHOTS_DIR, `${pg.name}.png`);

    try {
      console.log(`  📷 ${pg.title} (${pg.path})...`);

      // Re-inject auth before each navigation (in case page clears it)
      await page.evaluate(() => {
        const auth = localStorage.getItem('uoh_auth');
        if (!auth) {
          // Re-read from session - fallback
          console.warn('Auth lost, page may not load correctly');
        }
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
      await delay(pg.wait);

      // Wait for meaningful content — look for sidebar nav or main content
      try {
        await page.waitForSelector('nav, [class*="sidebar"], [class*="Sidebar"], main, [role="main"], h1, h2', { timeout: 5000 });
        await delay(500); // Extra settle time after content appears
      } catch { /* page might not have these selectors */ }

      // Hide any toast/notification overlays
      await page.evaluate(() => {
        document.querySelectorAll('[role="alert"], .Toastify, [class*="toast"], [class*="Toast"]').forEach(el => el.remove());
      });

      await page.screenshot({ path: filePath, fullPage: false, type: 'png' });

      // Verify screenshot has actual content (> 15KB usually means real content)
      const stat = fs.statSync(filePath);
      if (stat.size > 12000) {
        screenshots[pg.name] = filePath;
        console.log(`     ✅ Saved (${Math.round(stat.size/1024)}KB)`);
      } else {
        console.log(`     ⚠️ Might be blank (${Math.round(stat.size/1024)}KB), retrying...`);
        // Retry with longer wait
        await page.reload({ waitUntil: 'networkidle2', timeout: 20000 });
        await delay(3000);
        await page.screenshot({ path: filePath, fullPage: false, type: 'png' });
        const stat2 = fs.statSync(filePath);
        screenshots[pg.name] = filePath;
        console.log(`     ✅ Retry saved (${Math.round(stat2.size/1024)}KB)`);
      }
    } catch (err) {
      console.log(`     ⚠️ Skipped: ${err.message.slice(0, 80)}`);
    }
  }

  // Step 3: Generate PDF from HTML with embedded screenshots
  console.log('\n📄 Generating PDF document...');

  const screenshotImages = {};
  for (const [name, filePath] of Object.entries(screenshots)) {
    try {
      const data = fs.readFileSync(filePath);
      screenshotImages[name] = `data:image/png;base64,${data.toString('base64')}`;
    } catch {}
  }

  const htmlContent = generateHTML(screenshotImages);

  // Write temp HTML
  const tempHtml = path.join(__dirname, '_temp_profile.html');
  fs.writeFileSync(tempHtml, htmlContent, 'utf-8');

  // Open in new page and print to PDF
  const pdfPage = await browser.newPage();
  await pdfPage.goto('file:///' + tempHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });

  await pdfPage.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    preferCSSPageSize: true,
  });

  // Cleanup
  fs.unlinkSync(tempHtml);

  await browser.close();

  console.log(`\n✅ PDF generated successfully!`);
  console.log(`📁 Output: ${OUTPUT_PDF}`);
  console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}/`);
}

function generateHTML(images) {
  const img = (name, fallback = '') => {
    if (images[name]) {
      return `<img src="${images[name]}" alt="${fallback}" style="width:100%;height:auto;display:block;border-radius:8px;">`;
    }
    return `<div style="height:200px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:8px;color:#999;font-size:14px;">${fallback}</div>`;
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
:root{--p:#1a6b4f;--pd:#0f4a36;--pl:#2f8f71;--a:#d4a853;--al:#f0d48a;--t:#1a2332;--tm:#5a6a7e;--b:#d4e0da;--bg:#f8faf9;--w:#fff}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cairo','Segoe UI',sans-serif;color:var(--t);line-height:1.8;font-size:13px}

@page{size:A4;margin:0}
.page{width:210mm;min-height:297mm;padding:0;position:relative;page-break-after:always;overflow:hidden}
.page:last-child{page-break-after:auto}

/* COVER */
.cover{background:linear-gradient(135deg,var(--pd) 0%,var(--p) 40%,var(--pl) 100%);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--a),var(--al),var(--a))}
.cover-logo{width:100px;height:100px;background:rgba(255,255,255,0.15);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:32px;border:2px solid rgba(255,255,255,0.2)}
.cover-badge{display:inline-block;background:rgba(212,168,83,0.2);border:1px solid var(--a);color:var(--al);padding:5px 20px;border-radius:30px;font-size:12px;font-weight:600;margin-bottom:24px}
.cover h1{font-size:40px;font-weight:900;margin-bottom:10px;text-shadow:0 2px 20px rgba(0,0,0,0.2)}
.cover p.sub{font-size:17px;opacity:0.9;max-width:500px;margin-bottom:40px;line-height:1.8}
.cover-meta{display:flex;gap:30px;font-size:13px;opacity:0.8}

/* CONTENT PAGES */
.cp{padding:28px 36px}
.sh{display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid var(--p)}
.sn{background:var(--p);color:white;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0}
.sh h2{font-size:22px;font-weight:800;color:var(--pd)}
.sh small{font-size:12px;color:var(--tm);display:block}

/* SCREENSHOT */
.ss{margin:16px 0;border-radius:10px;overflow:hidden;border:1px solid var(--b);box-shadow:0 2px 12px rgba(0,0,0,0.06)}
.ss img{width:100%;height:auto;display:block}
.ss-cap{padding:8px 14px;background:#f5f7f6;font-size:11px;color:var(--tm);font-weight:600;text-align:center;border-top:1px solid var(--b)}
.ss-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}

/* MODULE */
.mod{padding:18px;background:var(--w);border-radius:12px;border:1px solid var(--b);box-shadow:0 2px 10px rgba(0,0,0,0.04);margin:14px 0}
.mod h3{font-size:16px;font-weight:700;color:var(--pd);margin-bottom:10px}
.mod h4{font-size:13px;font-weight:600;color:var(--p);margin:10px 0 6px}
.mod p{color:var(--tm);font-size:12px;line-height:1.7}
.mod ul{list-style:none;margin:6px 0}
.mod ul li{padding:3px 0;font-size:12px;display:flex;align-items:flex-start;gap:6px}
.mod ul li::before{content:'\\25C6';color:var(--p);font-size:8px;margin-top:5px;flex-shrink:0}

/* STATS */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}
.stat{background:linear-gradient(135deg,var(--p),var(--pl));color:white;padding:18px 14px;border-radius:12px;text-align:center}
.stat.gold{background:linear-gradient(135deg,#b8860b,var(--a))}
.stat-n{font-size:32px;font-weight:900;line-height:1}
.stat-l{font-size:11px;opacity:0.9;margin-top:4px}

/* FEATURES */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
.fc{background:var(--w);border:1px solid var(--b);border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.fc h3{font-size:14px;font-weight:700;color:var(--pd);margin-bottom:6px}
.fc p{color:var(--tm);font-size:11px;line-height:1.6}

/* FLOW */
.flow{display:flex;align-items:center;justify-content:center;gap:8px;margin:14px 0;flex-wrap:wrap}
.flow-s{background:var(--p);color:white;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600}
.flow-s.lt{background:var(--bg);color:var(--pd);border:2px solid var(--p)}
.flow-a{color:var(--p);font-weight:700;font-size:16px}

/* TABLE */
.rtbl{width:100%;border-collapse:separate;border-spacing:0;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin:14px 0}
.rtbl th{background:var(--p);color:white;padding:10px 14px;font-size:12px;text-align:right}
.rtbl td{padding:8px 14px;font-size:11px;border-bottom:1px solid var(--b);background:var(--w)}
.rtbl tr:nth-child(even) td{background:var(--bg)}
.rb{display:inline-block;padding:2px 10px;border-radius:16px;font-size:10px;font-weight:700}
.rb-a{background:#fce4ec;color:#c62828}.rb-h{background:#e8eaf6;color:#283593}
.rb-s{background:#e0f2f1;color:#00695c}.rb-m{background:#fff3e0;color:#e65100}
.rb-o{background:#f3e5f5;color:#6a1b9a}

/* TECH */
.tg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
.tc{background:#f5f7f6;border-radius:10px;padding:14px;text-align:center;border:1px solid var(--b)}
.tc h4{font-size:12px;font-weight:700;color:var(--pd);margin-bottom:8px}
.tags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.tag{background:var(--w);border:1px solid var(--b);padding:2px 8px;border-radius:14px;font-size:10px;font-weight:600;color:var(--p)}

/* SECURITY */
.sg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
.si{display:flex;align-items:flex-start;gap:10px;padding:14px;background:#f5f7f6;border-radius:10px;border-right:3px solid var(--p)}
.si .ic{font-size:22px;flex-shrink:0}
.si h4{font-size:12px;font-weight:700;color:var(--pd);margin-bottom:3px}
.si p{font-size:10.5px;color:var(--tm);line-height:1.5}

/* INFO */
.info{background:linear-gradient(135deg,#f1f7f4,#e8f5e9);border-right:4px solid var(--p);padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0}
.info p{color:var(--t);font-size:12px}
.hl{color:var(--p);font-weight:700}

.divider{height:3px;background:linear-gradient(90deg,var(--p),var(--a),var(--p));border-radius:2px;margin:24px 0;opacity:0.2}

.footer{text-align:center;padding:16px;color:var(--tm);font-size:10px;border-top:2px solid var(--b);margin-top:20px}
</style>
</head>
<body>

<!-- ===== COVER ===== -->
<div class="page cover">
  <div class="cover-logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64">
      <rect width="32" height="32" rx="6.4" fill="rgba(255,255,255,0.15)"/>
      <rect x="5.76" y="5.76" width="20.48" height="4.16" rx="1.28" fill="#FFF" opacity="0.95"/>
      <rect x="9.6" y="4.16" width="1.92" height="3.84" rx="0.96" fill="#FFF"/>
      <rect x="20.48" y="4.16" width="1.92" height="3.84" rx="0.96" fill="#FFF"/>
      <rect x="5.76" y="9.92" width="20.48" height="14.4" rx="1.28" fill="#FFF" opacity="0.9"/>
      <path d="M10.24 16.64 L14.4 20.8 L21.76 13.44" fill="none" stroke="#1e5f4c" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="16" y="28.16" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="3.84" fill="#FFF">UOH</text>
    </svg>
  </div>
  <div class="cover-badge">العرض الفني التفصيلي</div>
  <h1>منصة اجتماعات جامعة حائل</h1>
  <p class="sub">نظام متكامل لإدارة اللجان والاجتماعات والمحاضر والمهام والاستبيانات والتقارير مع دعم كامل للعمل التعاوني اللحظي</p>
  <div class="cover-meta">
    <span>&#128197; مارس ٢٠٢٦</span>
    <span>&#128196; الإصدار 1.0</span>
    <span>&#127891; جامعة حائل</span>
  </div>
</div>

<!-- ===== TOC ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">&#128195;</div><div><h2>فهرس المحتويات</h2></div></div>
  <div style="columns:2;column-gap:30px;margin-top:20px;">
  ${[
    'نظرة عامة على المنصة',
    'لوحة المعلومات الرئيسية',
    'إدارة اللجان',
    'إدارة الاجتماعات',
    'التقويم التفاعلي',
    'محاضر الاجتماعات',
    'المهام والتوصيات',
    'نظام التصويت',
    'الاستبيانات والاستطلاعات',
    'التوجيهات والقرارات',
    'نظام التقييم',
    'المواقع وحجز القاعات',
    'التقارير ومؤشرات الأداء',
    'نظام سير العمل',
    'الإقرارات والتعهدات',
    'المراسلات الفورية والإشعارات',
    'الملف الشخصي',
    'لوحة تحكم المسؤول',
    'تكامل Active Directory',
    'الأدوار والصلاحيات',
    'البنية التقنية',
    'الأمان والحماية',
    'تطبيق الجوال',
  ].map((t,i) => `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed #d4e0da;">
    <span style="background:var(--p);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${i+1}</span>
    <span style="font-size:13px">${t}</span>
  </div>`).join('')}
  </div>
</div>

<!-- ===== 1. OVERVIEW ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١</div><div><h2>نظرة عامة على المنصة</h2><small>Platform Overview</small></div></div>
  <div class="info">
    <p><strong>منصة اجتماعات جامعة حائل</strong> هي نظام إلكتروني متكامل صُمِّم خصيصاً لإدارة الاجتماعات واللجان الجامعية بكفاءة عالية. تغطي المنصة دورة حياة الاجتماع بالكامل مع دعم كامل للغة العربية ونظام أدوار وصلاحيات متقدم يتكامل مع <span class="hl">Azure Active Directory</span>.</p>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-n">+١٥٠</div><div class="stat-l">واجهة برمجية (API)</div></div>
    <div class="stat"><div class="stat-n">٢٧</div><div class="stat-l">صفحة ووحدة وظيفية</div></div>
    <div class="stat gold"><div class="stat-n">٣</div><div class="stat-l">محور تواصل لحظي</div></div>
    <div class="stat"><div class="stat-n">٣٧+</div><div class="stat-l">كيان بيانات</div></div>
  </div>
  <div class="fg">
    <div class="fc"><h3>&#128218; إدارة شاملة للجان</h3><p>إنشاء وإدارة لجان هرمية مع لجان فرعية وتعيين الأعضاء والأدوار مع دعم أنواع متعددة.</p></div>
    <div class="fc"><h3>&#128197; جدولة ذكية للاجتماعات</h3><p>تقويم متكامل مع حجز القاعات ودعم الاجتماعات الحضورية والافتراضية.</p></div>
    <div class="fc"><h3>&#128203; محاضر آلية</h3><p>محاضر اجتماعات مع تسجيل الحضور والقرارات ونظام اعتماد متعدد المراحل.</p></div>
    <div class="fc"><h3>&#9889; تواصل لحظي</h3><p>محادثات فورية وإشعارات WebPush واستبيانات حية بنتائج لحظية.</p></div>
  </div>
  <div class="ss">
    ${img('login', 'صفحة تسجيل الدخول')}
    <div class="ss-cap">صفحة تسجيل الدخول — دعم المصادقة المحلية و Azure AD</div>
  </div>
</div>

<!-- ===== 2. DASHBOARD ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٢</div><div><h2>لوحة المعلومات الرئيسية</h2><small>Dashboard & KPIs</small></div></div>
  <div class="mod">
    <h3>&#128202; لوحة معلومات قابلة للتخصيص</h3>
    <p>لوحة معلومات ديناميكية تعرض مؤشرات الأداء الرئيسية بشكل لحظي مع إمكانية تخصيص التخطيط لكل مستخدم.</p>
    <ul>
      <li>إحصائيات الاجتماعات والحضور والمهام والاستبيانات</li>
      <li>سحب وإفلات لتخصيص ترتيب العناصر</li>
      <li>تخطيطات افتراضية مختلفة حسب الدور</li>
      <li>ربط مصادر بيانات خارجية عبر API</li>
      <li>عرض تصنيفات الجامعات ومؤشرات الأداء</li>
    </ul>
  </div>
  <div class="ss">
    ${img('dashboard', 'لوحة المعلومات')}
    <div class="ss-cap">لوحة المعلومات الرئيسية — إحصائيات ومؤشرات أداء شاملة</div>
  </div>
</div>

<!-- ===== 3. COMMITTEES ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٣</div><div><h2>إدارة اللجان</h2><small>Committees Management</small></div></div>
  <div class="mod">
    <h3>&#127979; نظام شامل لإدارة اللجان</h3>
    <p>نظام متكامل لإنشاء وإدارة اللجان بهيكل هرمي يدعم اللجان الفرعية.</p>
    <h4>أنواع اللجان</h4>
    <ul>
      <li><strong>تنفيذية</strong> — لجان صنع القرار العليا</li>
      <li><strong>إدارية</strong> — لجان الإدارة والتنظيم</li>
      <li><strong>استشارية</strong> — لجان الاستشارة والتوجيه</li>
      <li><strong>فنية</strong> — لجان متخصصة</li>
      <li><strong>خاصة</strong> — لجان المهام المحددة</li>
    </ul>
    <h4>الإمكانيات</h4>
    <ul>
      <li>هيكل هرمي مع لجان فرعية وعرض شجري</li>
      <li>تعيين رئيس اللجنة وأمين السر والأعضاء</li>
      <li>حالات: نشطة — معلّقة — مؤرشفة — غير نشطة</li>
    </ul>
  </div>
  <div class="ss">
    ${img('committees', 'إدارة اللجان')}
    <div class="ss-cap">صفحة إدارة اللجان مع الفلترة والبحث</div>
  </div>
</div>

<!-- ===== 4. MEETINGS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٤</div><div><h2>إدارة الاجتماعات</h2><small>Meetings Management</small></div></div>
  <div class="mod">
    <h3>&#128197; دورة حياة كاملة للاجتماع</h3>
    <div class="flow">
      <div class="flow-s">مسودة</div><div class="flow-a">&#8592;</div>
      <div class="flow-s lt">مجدول</div><div class="flow-a">&#8592;</div>
      <div class="flow-s">منشور</div><div class="flow-a">&#8592;</div>
      <div class="flow-s lt">جاري</div><div class="flow-a">&#8592;</div>
      <div class="flow-s">مكتمل</div>
    </div>
    <ul>
      <li>أنواع: دورية — طارئة — خاصة — سنوية — مراجعة</li>
      <li>جدول أعمال مفصّل مع بنود قابلة للترتيب</li>
      <li>دعوات مع أدوار: حاضر، مقدّم، منظّم، ضيف، مراقب</li>
      <li>دعم Teams, Zoom, WebEx, Google Meet</li>
      <li>إشعارات تلقائية للمدعوين</li>
    </ul>
  </div>
  <div class="ss">
    ${img('meetings', 'الاجتماعات')}
    <div class="ss-cap">قائمة الاجتماعات مع الفلترة حسب اللجنة والحالة</div>
  </div>
</div>

<!-- ===== 5. CALENDAR ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٥</div><div><h2>التقويم التفاعلي</h2><small>Interactive Calendar</small></div></div>
  <div class="mod">
    <h3>&#128467; تقويم متكامل</h3>
    <ul>
      <li>عرض شهري / أسبوعي / يومي</li>
      <li>عرض اجتماعات كل اللجان أو لجنة محددة</li>
      <li>ألوان مختلفة حسب حالة الاجتماع</li>
      <li>إنشاء اجتماع سريع بالنقر على التاريخ</li>
    </ul>
  </div>
  <div class="ss">
    ${img('calendar', 'التقويم')}
    <div class="ss-cap">التقويم التفاعلي — عرض شهري للاجتماعات</div>
  </div>
</div>

<!-- ===== 6. MOM ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٦</div><div><h2>محاضر الاجتماعات</h2><small>Minutes of Meetings</small></div></div>
  <div class="mod">
    <h3>&#128203; نظام متكامل لمحاضر الاجتماعات</h3>
    <div class="flow">
      <div class="flow-s">مسودة</div><div class="flow-a">&#8592;</div>
      <div class="flow-s lt">بانتظار الاعتماد</div><div class="flow-a">&#8592;</div>
      <div class="flow-s">معتمد</div>
    </div>
    <h4>مكونات المحضر</h4>
    <ul>
      <li><strong>تسجيل الحضور</strong> — حالة كل مدعو (حاضر، غائب، معتذر، متأخر)</li>
      <li><strong>محضر البنود</strong> — توثيق ما تم مناقشته</li>
      <li><strong>القرارات</strong> — القرارات المتخذة مع ربطها بالبنود</li>
      <li><strong>التوصيات</strong> — مهام متابعة مع مسؤولين ومواعيد</li>
      <li><strong>سجل تدقيق</strong> — كل تعديل واعتماد ورفض</li>
      <li>تصدير إلى Word (.docx) و PDF</li>
    </ul>
  </div>
  <div class="ss">
    ${img('moms', 'المحاضر')}
    <div class="ss-cap">صفحة محاضر الاجتماعات</div>
  </div>
</div>

<!-- ===== 7. TASKS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٧</div><div><h2>المهام والتوصيات</h2><small>Tasks & Recommendations</small></div></div>
  <div class="mod">
    <h3>&#9745; نظام متابعة المهام والتوصيات</h3>
    <ul>
      <li>حالات: معلّقة — قيد التنفيذ — مكتملة — متأخرة — ملغاة</li>
      <li>أولويات: منخفضة — متوسطة — عالية — حرجة</li>
      <li>مهام هرمية مع مهام فرعية (Subtasks)</li>
      <li>تتبع نسبة الإنجاز لكل مهمة</li>
      <li>لوحة تحليلات المهام (Task Dashboard)</li>
      <li>عرض "مهامي" المسندة للمستخدم</li>
    </ul>
  </div>
  <div class="ss">
    ${img('tasks', 'المهام')}
    <div class="ss-cap">المهام والتوصيات مع نسب الإنجاز</div>
  </div>
</div>

<!-- ===== 8. VOTING ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٨</div><div><h2>نظام التصويت</h2><small>Voting System</small></div></div>
  <div class="mod">
    <h3>&#128499; تصويت إلكتروني آمن</h3>
    <ul>
      <li>جلسات تصويت مرتبطة بالاجتماعات</li>
      <li>فتح وإغلاق التصويت مع التحكم الكامل</li>
      <li>تصويت سري مع خيارات متعددة</li>
      <li>عرض النتائج بشكل رسومي فوري</li>
      <li>حالات: مسودة — مفتوح — مغلق — مؤرشف</li>
    </ul>
  </div>
  <div class="ss">
    ${img('votes', 'التصويت')}
    <div class="ss-cap">نظام التصويت الإلكتروني</div>
  </div>
</div>

<!-- ===== 9. SURVEYS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٩</div><div><h2>الاستبيانات والاستطلاعات</h2><small>Surveys & Polls</small></div></div>
  <div class="mod">
    <h3>&#128202; نظام استبيانات متقدم مع استبيانات حية</h3>
    <h4>أنواع الأسئلة</h4>
    <ul>
      <li>اختيار واحد — اختيار متعدد — تقييم — نص مفتوح — مصفوفة</li>
    </ul>
    <h4>التحليلات</h4>
    <ul>
      <li>رسوم بيانية تفاعلية وسحابة الكلمات (Word Cloud)</li>
      <li>تحليل ديموغرافي وزمني للاستجابات</li>
      <li>تصدير إلى Excel و PDF</li>
      <li>قوالب استبيانات قابلة لإعادة الاستخدام</li>
      <li>سحب عشوائي على المستجيبين (Lucky Draw)</li>
    </ul>
    <h4>الاستبيانات الحية (Live Surveys)</h4>
    <ul>
      <li>جلسة حية بكود دخول فريد — بدون تسجيل</li>
      <li>عرض المقدّم (Presenter) مع تحكم بالأسئلة</li>
      <li>نتائج لحظية عبر SignalR</li>
      <li>عدد المشاركين المتصلين مباشرة</li>
    </ul>
  </div>
  <div class="ss">
    ${img('surveys', 'الاستبيانات')}
    <div class="ss-cap">الاستبيانات والاستطلاعات مع التحليلات</div>
  </div>
</div>

<!-- ===== 10. DIRECTIVES ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٠</div><div><h2>التوجيهات والقرارات</h2><small>Directives & Decisions</small></div></div>
  <div class="mod">
    <h3>&#128220; إدارة التوجيهات العليا</h3>
    <ul>
      <li>إنشاء توجيهات مع تفاصيل كاملة</li>
      <li>حالات: مسودة — نشط — مؤرشف — ملغى</li>
      <li>ربط قرارات التنفيذ بكل توجيه</li>
      <li>متابعة حالة كل قرار وتتبع زمني</li>
    </ul>
  </div>
  <div class="ss">
    ${img('directives', 'التوجيهات')}
    <div class="ss-cap">التوجيهات والقرارات</div>
  </div>
  <div class="divider"></div>
  <div class="sh"><div class="sn">١١</div><div><h2>نظام التقييم</h2><small>Evaluation Framework</small></div></div>
  <div class="mod">
    <h3>&#11088; تقييم منهجي بمعايير مُخصصة</h3>
    <ul>
      <li>قوالب تقييم بمعايير وأوزان مخصصة</li>
      <li>جلسات تقييم مرتبطة باللجان</li>
      <li>جمع استجابات المقيّمين وتحليلها</li>
    </ul>
  </div>
  <div class="ss">
    ${img('evaluations', 'التقييمات')}
    <div class="ss-cap">نظام التقييم المنهجي</div>
  </div>
</div>

<!-- ===== 12. LOCATIONS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٢</div><div><h2>المواقع وحجز القاعات</h2><small>Locations & Room Booking</small></div></div>
  <div class="mod">
    <h3>&#127970; إدارة المواقع والقاعات</h3>
    <div class="flow">
      <div class="flow-s">حرم جامعي</div><div class="flow-a">&#8592;</div>
      <div class="flow-s lt">مبنى</div><div class="flow-a">&#8592;</div>
      <div class="flow-s">طابق</div><div class="flow-a">&#8592;</div>
      <div class="flow-s lt">قاعة</div>
    </div>
    <ul>
      <li>هيكل هرمي للمواقع من الحرم للقاعة</li>
      <li>حجز القاعات مع منع التعارض تلقائياً</li>
      <li>تقويم حجوزات لكل قاعة</li>
    </ul>
  </div>
  <div class="ss-grid">
    <div class="ss">${img('locations', 'المواقع')}<div class="ss-cap">إدارة المواقع</div></div>
    <div class="ss">${img('room-booking', 'حجز القاعات')}<div class="ss-cap">حجز القاعات</div></div>
  </div>
</div>

<!-- ===== 13. REPORTS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٣</div><div><h2>التقارير ومؤشرات الأداء</h2><small>Reports & KPIs</small></div></div>
  <div class="mod">
    <h3>&#128200; تقارير شاملة</h3>
    <h4>أنواع التقارير</h4>
    <ul>
      <li><strong>نشاط اللجان</strong> — اجتماعات، حضور، قرارات، إنجاز</li>
      <li><strong>الحضور</strong> — تحليل حضور الاجتماعات مع النسب</li>
      <li><strong>أداء المهام</strong> — حالة المهام ومعدل الإنجاز</li>
      <li><strong>مؤشرات KPIs</strong> — مؤشرات قياسية لكل لجنة</li>
      <li>تصدير جميع التقارير إلى Excel</li>
    </ul>
  </div>
  <div class="ss">
    ${img('reports', 'التقارير')}
    <div class="ss-cap">صفحة التقارير ومؤشرات الأداء</div>
  </div>
  <div class="divider"></div>
  <div class="sh"><div class="sn">١٤</div><div><h2>نظام سير العمل</h2><small>Workflow Engine</small></div></div>
  <div class="mod">
    <h3>&#9881; محرك سير عمل مرن</h3>
    <ul>
      <li>قوالب سير عمل بمراحل متعددة</li>
      <li>ربط بمحاضر الاجتماعات والعمليات</li>
      <li>سجل تدقيق كامل وإمكانية النسخ</li>
    </ul>
  </div>
  <div class="ss">
    ${img('workflow', 'سير العمل')}
    <div class="ss-cap">نظام سير العمل القابل للتخصيص</div>
  </div>
</div>

<!-- ===== 15. ACKNOWLEDGMENTS + CHAT ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٥</div><div><h2>الإقرارات والتعهدات</h2><small>Acknowledgments</small></div></div>
  <div class="mod">
    <h3>&#128221; نظام إقرارات إلزامي</h3>
    <ul>
      <li>فئات: سياسات — امتثال — تدريب — قانوني</li>
      <li>تتبع التوقيعات مع الطوابع الزمنية و IP</li>
      <li>تطبيق إلزامي عبر Middleware — HTTP 451</li>
    </ul>
  </div>
  <div class="ss">
    ${img('acknowledgments', 'الإقرارات')}
    <div class="ss-cap">الإقرارات والتعهدات الإلزامية</div>
  </div>
  <div class="divider"></div>
  <div class="sh"><div class="sn">١٦</div><div><h2>المراسلات والإشعارات</h2><small>Chat & Notifications</small></div></div>
  <div class="mod">
    <h3>&#128172; محادثات فورية + &#128276; إشعارات</h3>
    <ul>
      <li>محادثات فردية وجماعية بالوقت الفعلي عبر SignalR</li>
      <li>مؤشر الكتابة ومشاركة المرفقات</li>
      <li>إشعارات لحظية + Web Push Notifications</li>
      <li>بحث في أرشيف المحادثات</li>
    </ul>
  </div>
</div>

<!-- ===== 17. PROFILE + ADMIN ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٧</div><div><h2>الملف الشخصي</h2><small>User Profile</small></div></div>
  <div class="ss">
    ${img('profile', 'الملف الشخصي')}
    <div class="ss-cap">إدارة الملف الشخصي والتفضيلات</div>
  </div>
  <div class="divider"></div>
  <div class="sh"><div class="sn">١٨</div><div><h2>لوحة تحكم المسؤول</h2><small>Admin Panel</small></div></div>
  <div class="mod">
    <h3>&#128736; إدارة شاملة للنظام</h3>
    <ul>
      <li>إدارة المستخدمين — تفعيل/تعطيل/تعيين أدوار</li>
      <li>إدارة الأدوار — إنشاء/تعديل/تعيين صلاحيات</li>
      <li>إدارة الصلاحيات التفصيلية</li>
      <li>مزامنة Active Directory</li>
      <li>الإعلانات على مستوى المنصة</li>
    </ul>
  </div>
  <div class="ss-grid">
    <div class="ss">${img('admin-users', 'المستخدمين')}<div class="ss-cap">إدارة المستخدمين</div></div>
    <div class="ss">${img('admin-roles', 'الأدوار')}<div class="ss-cap">إدارة الأدوار</div></div>
  </div>
</div>

<!-- ===== 19. AD + PERMISSIONS ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">١٩</div><div><h2>تكامل Active Directory</h2><small>Azure AD / Entra ID Integration</small></div></div>
  <div class="mod">
    <h3>&#128279; تكامل كامل مع دليل المستخدمين</h3>
    <ul>
      <li>تسجيل دخول موحّد (SSO) عبر Azure AD</li>
      <li>مصادقة مزدوجة: Azure AD + محلية</li>
      <li>مزامنة المستخدمين وربط مجموعات AD بالأدوار</li>
      <li>اختبار الاتصال وسجل المزامنة</li>
    </ul>
  </div>
  <div class="ss-grid">
    <div class="ss">${img('admin-adsync', 'AD Sync')}<div class="ss-cap">مزامنة Active Directory</div></div>
    <div class="ss">${img('admin-permissions', 'الصلاحيات')}<div class="ss-cap">إدارة الصلاحيات</div></div>
  </div>
  <div class="divider"></div>
  <div class="sh"><div class="sn">٢٠</div><div><h2>الأدوار والصلاحيات</h2><small>Roles & Permissions (RBAC)</small></div></div>
  <table class="rtbl">
    <thead><tr><th>الدور</th><th>الوصف</th><th>المسؤوليات الرئيسية</th></tr></thead>
    <tbody>
      <tr><td><span class="rb rb-a">مدير النظام</span></td><td>SystemAdmin</td><td>إدارة كاملة — المستخدمين، الأدوار، الصلاحيات، اللجان، الإعدادات</td></tr>
      <tr><td><span class="rb rb-h">رئيس لجنة</span></td><td>CommitteeHead</td><td>رئاسة اللجنة، اعتماد المحاضر، التقييمات، الإشراف</td></tr>
      <tr><td><span class="rb rb-s">أمين لجنة</span></td><td>CommitteeSecretary</td><td>إنشاء الاجتماعات، كتابة المحاضر، الاستبيانات</td></tr>
      <tr><td><span class="rb rb-m">عضو لجنة</span></td><td>CommitteeMember</td><td>الحضور، التصويت، تنفيذ المهام</td></tr>
      <tr><td><span class="rb rb-o">مراقب</span></td><td>Observer</td><td>متابعة ومراقبة سير الاجتماعات</td></tr>
    </tbody>
  </table>
</div>

<!-- ===== 21. TECH STACK ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٢١</div><div><h2>البنية التقنية</h2><small>Technical Architecture</small></div></div>
  <div class="tg">
    <div class="tc"><h4>&#128187; Frontend</h4><div class="tags"><span class="tag">React 19</span><span class="tag">TypeScript 5.9</span><span class="tag">Vite 7</span><span class="tag">Tailwind CSS 4</span><span class="tag">react-i18next</span></div></div>
    <div class="tc"><h4>&#9881; Backend</h4><div class="tags"><span class="tag">.NET 8</span><span class="tag">ASP.NET Core</span><span class="tag">EF Core 8</span><span class="tag">SignalR</span><span class="tag">JWT</span></div></div>
    <div class="tc"><h4>&#128450; Database</h4><div class="tags"><span class="tag">PostgreSQL 16</span><span class="tag">Redis</span><span class="tag">MinIO (S3)</span><span class="tag">Docker</span></div></div>
    <div class="tc"><h4>&#128274; Security</h4><div class="tags"><span class="tag">Azure AD</span><span class="tag">JWT Bearer</span><span class="tag">RBAC</span><span class="tag">BCrypt</span></div></div>
    <div class="tc"><h4>&#128225; Real-time</h4><div class="tags"><span class="tag">SignalR Hubs</span><span class="tag">WebPush</span><span class="tag">WebSocket</span></div></div>
    <div class="tc"><h4>&#128241; Mobile</h4><div class="tags"><span class="tag">React Native</span><span class="tag">Expo</span><span class="tag">TypeScript</span><span class="tag">EAS</span></div></div>
  </div>
  <div class="mod">
    <h3>&#127959; معمارية النظام</h3>
    <p>معمارية Monorepo باستخدام NPM Workspaces تجمع الواجهة والخلفية والجوال.</p>
    <h4>هيكل المشروع</h4>
    <ul>
      <li><strong>apps/web</strong> — تطبيق الويب (React + TypeScript + Vite)</li>
      <li><strong>apps/api</strong> — واجهة برمجية (.NET 8 + EF Core + SignalR)</li>
      <li><strong>apps/mobile</strong> — تطبيق الجوال (React Native + Expo)</li>
      <li><strong>infra/</strong> — بنية تحتية (Docker Compose + Nginx)</li>
    </ul>
    <h4>أنماط التصميم</h4>
    <ul>
      <li>Primary Constructor — حقن التبعيات</li>
      <li>Repository Pattern عبر EF Core</li>
      <li>Middleware Pipeline للمصادقة</li>
      <li>PolicyScheme للمصادقة المزدوجة</li>
      <li>Presigned URLs لرفع وتنزيل آمن</li>
    </ul>
  </div>
</div>

<!-- ===== 22. SECURITY ===== -->
<div class="page cp">
  <div class="sh"><div class="sn">٢٢</div><div><h2>الأمان والحماية</h2><small>Security & Protection</small></div></div>
  <div class="sg">
    <div class="si"><div class="ic">&#128274;</div><div><h4>مصادقة مزدوجة</h4><p>Azure AD (SSO) + مصادقة محلية بـ BCrypt مع JWT.</p></div></div>
    <div class="si"><div class="ic">&#128737;</div><div><h4>تحكم بالوصول RBAC</h4><p>أدوار وصلاحيات تفصيلية مع انتهاء صلاحية.</p></div></div>
    <div class="si"><div class="ic">&#128209;</div><div><h4>سجل تدقيق كامل</h4><p>تسجيل كل إجراء مع الطابع الزمني و IP.</p></div></div>
    <div class="si"><div class="ic">&#128448;</div><div><h4>تصنيف الملفات</h4><p>عام، داخلي، سري، سري للغاية مع روابط مؤقتة.</p></div></div>
    <div class="si"><div class="ic">&#128272;</div><div><h4>تشفير البيانات</h4><p>BCrypt + HMAC-SHA256 + HTTPS كامل.</p></div></div>
    <div class="si"><div class="ic">&#9989;</div><div><h4>إقرارات إلزامية</h4><p>حجب الوصول (HTTP 451) حتى التوقيع.</p></div></div>
  </div>

  <div class="divider"></div>
  <div class="sh"><div class="sn">٢٣</div><div><h2>تطبيق الجوال</h2><small>Mobile Application</small></div></div>
  <div class="mod">
    <h3>&#128241; تطبيق جوال متعدد المنصات</h3>
    <p>تطبيق React Native + Expo يعمل على Android و iOS.</p>
    <ul>
      <li>تسجيل الدخول — الاجتماعات — المهام — الاستبيانات</li>
      <li>المحادثات الفورية — الإشعارات — الملف الشخصي</li>
      <li>دعم ثنائي اللغة (عربي/إنجليزي)</li>
    </ul>
  </div>
</div>

<!-- ===== CLOSING ===== -->
<div class="page cover" style="justify-content:center">
  <div class="cover-logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64">
      <rect width="32" height="32" rx="6.4" fill="rgba(255,255,255,0.15)"/>
      <rect x="5.76" y="5.76" width="20.48" height="4.16" rx="1.28" fill="#FFF" opacity="0.95"/>
      <rect x="9.6" y="4.16" width="1.92" height="3.84" rx="0.96" fill="#FFF"/>
      <rect x="20.48" y="4.16" width="1.92" height="3.84" rx="0.96" fill="#FFF"/>
      <rect x="5.76" y="9.92" width="20.48" height="14.4" rx="1.28" fill="#FFF" opacity="0.9"/>
      <path d="M10.24 16.64 L14.4 20.8 L21.76 13.44" fill="none" stroke="#1e5f4c" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="16" y="28.16" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="3.84" fill="#FFF">UOH</text>
    </svg>
  </div>
  <h2 style="font-size:32px;font-weight:800;margin-bottom:16px">شكراً لاطلاعكم</h2>
  <p style="font-size:16px;opacity:0.85;max-width:460px">منصة اجتماعات جامعة حائل — حل متكامل لإدارة اللجان والاجتماعات بكفاءة وشفافية</p>
  <div style="margin-top:30px;padding:16px 30px;background:rgba(255,255,255,0.1);border-radius:10px">
    <table style="color:white;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 16px;opacity:0.7">الجهة</td><td style="padding:6px 16px;font-weight:700">جامعة حائل</td></tr>
      <tr><td style="padding:6px 16px;opacity:0.7">المنصة</td><td style="padding:6px 16px;font-weight:700">نظام إدارة الاجتماعات واللجان</td></tr>
      <tr><td style="padding:6px 16px;opacity:0.7">الإصدار</td><td style="padding:6px 16px;font-weight:700">1.0</td></tr>
      <tr><td style="padding:6px 16px;opacity:0.7">التاريخ</td><td style="padding:6px 16px;font-weight:700">مارس ٢٠٢٦</td></tr>
    </table>
  </div>
  <div style="position:absolute;bottom:20px;font-size:11px;opacity:0.5">
    هذا المستند سري وموجه للجنة تقييم العروض الفنية فقط
  </div>
</div>

</body>
</html>`;
}

main().catch(console.error);
