# Focus Flow – Weekly Ritual Coach

Focus Flow — macOS uchun Electron + React yordamida yaratilgan ultra-fokus haftalik reja va odatlar menejeri. Ilova sizga butun haftani soatlab rejalashtirish, vazifalar vaqtida eslatma olish, AI coachning kun yakunidagi xulosalarini ko'rish hamda coin-motivatsiya tizimi orqali o'zingizni rag'batlantirish imkonini beradi.

## Asosiy imkoniyatlar

- **Haftalik planner** – har bir kun va soat uchun vazifa bloklarini kiritish, 3 martagacha reschedule limiti bilan.
- **Katta dashboard** – hozirgi/kelayotgan vazifani yirik kartada ko'rsatadi, bajarilgan, kechikkan va o'tkazilgan ishlarni ranglar bilan ajratadi.
- **AI tanbeh** – kun yakunida avtomatik xulosa (coach report) va motivatsion tavsiyalar.
- **Widget oynasi** – asosiy ilovani ochmasdan turib keyingi vazifani ko'rish va tezkor bajarilgan deb belgilash.
- **Bildirishnomalar** – vazifa boshlanishidan 5 daqiqa oldin macOS notification yuboriladi.
- **Coin tizimi** – qiyinlik darajasiga qarab 10 / 20 / 30 / 40 coin beriladi, o'tkazib yuborilgan ishlar -10 coin qilib olinadi.
- **Reward store** – coinlaringizni Steam o'yini, kitob, SPA kuni va h.k. kabi mukofotlarga almashtirish.
- **Habit tracker** – masalan "Shakarsiz kun" kabi challenge'lar uchun har kunlik check-in va coin mukofotlari.

## O'rnatish va ishga tushirish

Ilovani ishga tushirish juda sodda: faqat Node.js (v18+) o'rnatilgan bo'lsa kifoya.

```bash
npm install
npm run dev
```

`npm run dev` komandasi Vite dev serverini ishga tushiradi va Electron oynasini ochadi. Agar dev server o'rniga brauzerda tekshirmoqchi bo'lsangiz, oddiy Vite server (`npm run dev:renderer`) ham ishlaydi.

### Build qilish

Hozircha `npm run build` komandasi faqat frontendni (`dist/`) tayyorlaydi. Electron paketlash uchun `electron-builder` qo'shilgan, keyingi qadam sifatida `npm run dist` skriptini qo'shishingiz mumkin.

## Har kunlik jarayon

1. Planner sahifasida haftalik bloklarni kiriting. Esingizda bo'lsin: haftasiga maksimal 3 ta reschedule.
2. Dashboard sahifasida bugungi vazifa va progressni kuzating, tugallangan sifatida belgilang.
3. Habit sahifasida challenge'larni belgilab, odatlar streakini ushlab turing.
4. Coin do'konida kerakli mukofotni tanlang va coin sarflang.
5. Kunning oxirida AI tanbeh kartasida coach xulosasini o'qing.

## Kengaytirish g'oyalari

1. **Kalendarga eksport** – vazifalarni Apple Calendar / Google Calendar bilan sinxronlashtirish.
2. **Focus session taymer** – Pomodoro yoki Deep Work taymeri qo'shish.
3. **AI prompt** – custom "tanbeh" generatsiyasi uchun ChatGPT API integratsiyasi.
4. **A'zolik rejimi** – do'stlar bilan challenge almashish yoki umumiy doska.

## Foydali skriptlar

- `npm run dev` – Electron + Vite dev muhiti.
- `npm run lint` – TypeScript tekshiruvi.
- `npm run preview` – build qilingan dist bilan Electron ishga tushirish.

## Dizayn bo'yicha eslatma

Tailwind CSS yordamida neon gradientli, ko'p soyali UI ishlatildi. Agar ranglar sxemasini o'zgartirmoqchi bo'lsangiz, `tailwind.config.cjs` faylida `colors` bo'limini moslashtiring.

Enjoy ultra fokus!
