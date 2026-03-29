# @uoh/ui

مكتبة واجهة مشتركة + Design Tokens للمنصة، مع دعم RTL/LTR.

## Design tokens

- `src/tokens.css`: CSS variables (colors, typography, radius, shadows)
- `src/tokens.ts`: نفس القيم ككائن TypeScript للاستخدام في RN/JS
- `tailwind.preset.js`: preset لتوحيد Tailwind عبر `apps/web`

## Fonts

الخطوط تُحمّل من web عبر Google Fonts أو ملفات محلية لاحقًا:

- Arabic: `Noto Kufi Arabic`
- Latin: `Inter`

