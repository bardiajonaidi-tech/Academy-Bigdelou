const ASSET = (window.ASSETS || {top: 'img/logo-white-sm.png', round: 'img/logo-round.png'});
/* Coaching site UI. Talks to the backend only through window.API (see api-supabase.js / api-mock.js). */
(function(){
'use strict';
const API = window.API;
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d){ try { return localStorage.getItem('c_' + k) || d; } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('c_' + k, v); } catch (e) {} }
};

const S = {
  lang: store.get('lang', 'fa'), cal: store.get('cal', 'shamsi'),
  theme: store.get('theme', (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'),
  route: 'home', tab: null, user: null, pub: null, mine: null, co: null,
  weekOff: 0, detail: null, modal: null, q: '', gEdit: null, err: '', loading: true
};
const HOUR_FROM = 7, HOUR_TO = 22;

const DAYS = {
  fa: ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],
  en: ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
};
const DAYS_S = {
  fa: ['ش','ی','د','س','چ','پ','ج'],
  en: ['Sat','Sun','Mon','Tue','Wed','Thu','Fri']
};

const I = {
fa: {
  site: 'کلاس تنیس', login: 'ورود', register: 'ثبت‌نام', logout: 'خروج', enter_panel: 'ورود به پنل',
  shamsi: 'شمسی', gregorian: 'میلادی',
  hero_t: 'کلاس تنیس با {name}',
  hero_p: 'ساعت‌های خالی را ببینید، خودتان ثبت‌نام کنید و بدهی و پرداخت‌هایتان را یک‌جا دنبال کنید.',
  free_hours: 'ساعت‌های خالی هفته', prices: 'قیمت هر جلسه (۱ ساعت)', band_row: 'شروع بین ساعت {from} تا {to}',
  toman: 'تومان', groups_title: 'کلاس‌های گروهی', no_groups: 'فعلاً کلاس گروهی پیشنهاد نشده.',
  contact: 'شماره‌ی مربی', copy: 'کپی', copied: 'کپی شد', not_set: 'هنوز ثبت نشده',
  lg_free: 'خالی', lg_full: 'پُر', lg_off: 'خارج از ساعت کار', lg_sel: 'ساعت کلاس', lg_mine: 'کلاس شما',
  lg_g: 'G = کلاس گروهی',
  first_name: 'نام', last_name: 'نام خانوادگی', age: 'سن', gender: 'جنسیت (اختیاری)', female: 'دختر', male: 'پسر', choose: 'انتخاب کنید',
  mobile: 'شماره‌ی موبایل', parent_mobile: 'شماره‌ی موبایل پدر یا مادر', parent_req: 'برای زیر ۱۸ سال الزامی است', parent_opt: 'اختیاری',
  email: 'ایمیل', password: 'رمز عبور (حداقل ۶ حرف)', have_account: 'حساب دارید؟', no_account: 'حساب ندارید؟',
  err_generic: 'خطایی رخ داد. دوباره امتحان کنید.', err_required: 'همه‌ی فیلدهای لازم را پر کنید.',
  err_parent: 'برای زیر ۱۸ سال، شماره‌ی پدر یا مادر لازم است.', err_login: 'ایمیل یا رمز اشتباه است.',
  err_exists: 'با این ایمیل قبلاً ثبت‌نام شده است.', err_taken: 'این ساعت همین حالا پر شد.',
  err_group_full: 'ظرفیت این کلاس پر است.', err_slot_busy: 'این ساعت رزرو یا کلاس گروهی دارد و حذف نمی‌شود.',
  err_group_hours: 'ساعت‌های این کلاس باید داخل ساعت‌های کاری انتخاب‌شده باشند.',
  err_group_busy: 'در این ساعت‌ها کلاس خصوصی یا گروهی دیگری هست.',
  err_nothing: 'کلاس جدیدی برای ثبت نهایی نیست.', err_bad_amount: 'مبلغ درست نیست.', err_confirm_email: 'ثبت‌نام انجام شد. ایمیلتان را برای تأیید باز کنید و بعد وارد شوید.',
  tab_extras: 'جلسه‌ی اضافه', extras_title: 'جلسه‌های اضافه (تک‌جلسه)', extras_help_st: 'این جلسه‌ها از کلاس‌های لغوشده یا ساعت‌های خالی ساخته شده‌اند. هر کدام فقط یک جلسه است و قیمت جداگانه دارد؛ اولین نفری که ثبت کند، جلسه برای او می‌ماند.',
  ex_help_co: 'یک جلسه‌ی تک‌باری با قیمت دلخواه بسازید. هر شاگردی که زودتر ثبت کند، همان یک جلسه برایش می‌شود و همان لحظه به بدهی‌اش اضافه می‌شود. برای کلاس لغوشده‌ی یک شاگرد، در «تقویم» دکمه‌ی «لغو و ارائه» را بزنید.',
  ex_new: 'جلسه‌ی اضافه‌ی جدید', ex_date: 'تاریخ', ex_hour: 'ساعت شروع', ex_price: 'قیمت این جلسه (تومان)', ex_note: 'توضیح (اختیاری)', ex_create: 'ایجاد جلسه', ex_open: 'آزاد', ex_booked_by: 'ثبت‌شده توسط {name}',
  ex_delete: 'حذف', ex_book: 'ثبت‌نام در این جلسه', ex_book_q: 'ثبت‌نام در این جلسه؟', ex_one: 'فقط همین یک جلسه', ex_charge_now: 'مبلغ همین حالا به بدهی شما اضافه می‌شود و شماره کارت برای پرداخت نشان داده می‌شود.',
  ex_none: 'جلسه‌ی اضافه‌ای وجود ندارد.', ex_login: 'برای ثبت‌نام وارد شوید.', offer_cancel: 'لغو و ارائه به بقیه', offer_q: 'این جلسه لغو شود و به بقیه ارائه شود؟', offer_price: 'قیمت جلسه‌ی جدید (برای هر ساعت)',
  offer_credit: 'یک جلسه از بدهی شاگرد کم شود', offer_go: 'لغو و ارائه', canceled_lbl: 'لغو شد', my_extras: 'جلسه‌های اضافه‌ی من', my_canceled: 'جلسه‌های لغوشده‌ی من (این تاریخ‌ها برگزار نمی‌شود)',
  extracharge: 'جلسه‌ی اضافه', sessioncredit: 'اعتبار جلسه‌ی لغوشده', err_extra_taken: 'این جلسه را فرد دیگری گرفت.', err_extra_conflict: 'در این تاریخ و ساعت کلاس دیگری وجود دارد.', ex_reminder: 'افزودن به تقویم گوشی',
  cancel_day: 'لغو روز', day_restore: 'برگرداندن', day_canceled: 'کل روز لغو شد', cancel_day_q: 'همه‌ی کلاس‌های این روز لغو شود؟',
  cancel_day_help: 'همه‌ی کلاس‌های خصوصی و گروهی این روز لغو می‌شود و شاگردها در برنامه‌شان می‌بینند. جلسه‌های اضافه‌ی همین روز هم حذف و پولشان برگردانده می‌شود. هر وقت خواستید می‌توانید روز را برگردانید.',
  cancel_day_note: 'پیام برای شاگردها (اختیاری)', cancel_day_credit: 'یک جلسه از بدهی شاگردهای ثبت‌نهایی‌شده کم شود', cancel_day_go: 'لغو کل روز', closed_banner: 'کلاس‌های {date} لغو شده است.', session_restore: 'برگرداندن این جلسه',
  sk_cancel: 'لغو یک جلسه', sk_pick_q: 'کدام جلسه را لغو می‌کنید؟', sk_rule: 'اگر کسی جلسه‌ی لغوشده‌ی شما را بگیرد، یک جلسه‌ی جبرانی طلب دارید و مربی برایتان برگزار می‌کند. اگر کسی نگیرد و ساعت خالی بماند، همین جلسه از تعداد جلسه‌هایتان کم می‌شود.',
  sk_none: 'جلسه‌ی قابل لغوی در ۸ هفته‌ی آینده نیست.', sk_notice: 'حداقل {n} ساعت قبل از کلاس می‌شود لغو کرد.', st_pending: 'منتظر خریدار', st_makeup: 'جلسه‌ی جبرانی طلب دارید', st_forfeit: 'از جلسه‌هایتان کم شد', sk_withdraw: 'پس گرفتن لغو',
  makeup_owed: 'جلسه‌ی جبرانی طلبکار: {n}', makeup_lbl: 'جبرانی', err_too_late: 'برای لغو، حداقل {n} ساعت به شروع کلاس باید مانده باشد.', cancel_hours: 'حداقل ساعت مانده به کلاس برای لغو توسط شاگرد',
  mk_title: 'جلسه‌ی جبرانی', mk_help: 'این شاگرد {n} جلسه‌ی جبرانی طلب دارد (جلسه‌هایی که لغو کرده و فرد دیگری گرفته). تاریخ و ساعت جلسه‌ی جبرانی را بگذارید.', mk_create: 'ثبت جلسه‌ی جبرانی', ex_save_price: 'ذخیره', ex_from_student: 'از لغو شاگرد', canceled_by_st: 'لغو توسط شاگرد',
  mk_wait: 'مربی تاریخ و ساعتش را مشخص می‌کند.',
  theme_to_dark: 'حالت تاریک', theme_to_light: 'حالت روشن',
  tab_schedule: 'برنامه‌ی هفته', tab_groups: 'کلاس گروهی', tab_mine: 'کلاس‌ها و پرداخت',
  tap_hint: 'روی یک ساعت سبز بزنید تا آن را هر هفته برای خودتان رزرو کنید. G یعنی کلاس گروهی.',
  book_q: 'رزرو {day} ساعت {hour}؟', book_price: 'هزینه‌ی هر جلسه: {price} تومان', book_note: 'این کلاس هر هفته تکرار می‌شود.',
  confirm: 'تأیید', cancel: 'انصراف', cancel_class: 'لغو این کلاس', cancel_q: 'این کلاس لغو شود؟',
  locked: 'این کلاس ثبت نهایی شده است. برای لغو با مربی تماس بگیرید.', booked: 'رزرو شد', canceled: 'لغو شد',
  group_when: '{day} ساعت {from} تا {to}', per_session: 'هر جلسه', spots_left: '{n} جای خالی', unlimited: 'ظرفیت نامحدود',
  join: 'ثبت‌نام در این کلاس', leave: 'انصراف از ثبت‌نام', joined: 'ثبت‌نام شده', full: 'پُر',
  my_private: 'کلاس‌های خصوصی من', my_groups: 'کلاس‌های گروهی من', none_yet: 'هنوز چیزی انتخاب نکرده‌اید.',
  weekly: 'جمع هفتگی', monthly: 'جمع ترم ({n} هفته)', finalize: 'ثبت نهایی کلاس‌ها',
  finalize_help: 'بعد از ثبت نهایی، هزینه‌ی کل ترم ({n} هفته) به بدهی شما اضافه می‌شود و شماره‌ی کارت نمایش داده می‌شود.',
  finalized: 'ثبت نهایی انجام شد', price_unset: 'قیمت بعضی ساعت‌ها هنوز تعیین نشده است.',
  pay: 'پرداخت', pay_card: 'مبلغ را کارت‌به‌کارت به این شماره واریز کنید و عکس فیش را همین‌جا بفرستید.',
  card_holder: 'به نام', your_debt: 'بدهی شما', bal_owed: 'مانده بدهی', paid_off: 'تسویه شده', credit: 'بستانکار',
  upload_receipt: 'ارسال عکس فیش', receipt_photo: 'عکس فیش', claimed: 'مبلغ واریزی (تومان، اختیاری)', note: 'توضیح (اختیاری)',
  send: 'ارسال', sent: 'فیش ارسال شد', receipts: 'فیش‌ها', st_pending: 'در انتظار تأیید', st_confirmed: 'تأیید شد', st_rejected: 'رد شد',
  history: 'گردش حساب', charge: 'بدهی', payment: 'پرداخت', tuitionterm: 'شهریه ترم', payment_t: 'پرداخت (تأیید فیش)',
  reminder: 'افزودن یادآور کلاس‌ها به گوشی',
  reminder_help: 'یک فایل تقویم دانلود می‌شود. بازش کنید تا کلاس‌ها با یادآور ۳۰ دقیقه قبل به تقویم گوشی (اندروید یا آیفون) اضافه شوند.',
  ics_preview: 'پیش‌نمایش: در سایت اصلی این متن به‌صورت فایل تقویم دانلود می‌شود.', close: 'بستن',
  tab_calendar: 'تقویم', tab_hours: 'ساعت‌های کاری', tab_cgroups: 'کلاس گروهی', tab_students: 'شاگردها', tab_settings: 'تنظیمات',
  this_week: 'این هفته', prev: 'قبلی', next: 'بعدی', nothing_day: 'کلاسی ندارد.', private_with: 'خصوصی: {name}', group_lbl: 'گروهی: {title}',
  hours_help: 'ساعت‌هایی را که کلاس می‌گذارید آبی کنید. بقیه خاکستری می‌مانند. شاگردها فقط آبی‌ها را می‌بینند (سبز اگر خالی، قرمز اگر پر).',
  term_start: 'شروع ترم', term_weeks: 'تعداد هفته‌های ترم', save: 'ذخیره', saved: 'ذخیره شد', dot_hint: '● یعنی کلاس خصوصی دارد و G یعنی کلاس گروهی.',
  g_new: 'کلاس گروهی جدید', g_edit: 'ویرایش کلاس گروهی', g_title: 'عنوان کلاس', g_day: 'روز', g_start: 'ساعت شروع', g_dur: 'مدت (ساعت)',
  g_price: 'قیمت هر جلسه برای هر شاگرد (تومان)', g_cap: 'ظرفیت (اختیاری)', g_note: 'توضیح (اختیاری)',
  g_create: 'ایجاد کلاس', g_delete: 'حذف', g_enrolled: 'ثبت‌نام‌شده‌ها', g_none_enrolled: 'هنوز کسی ثبت‌نام نکرده', g_deleted: 'حذف شد',
  g_help: 'کلاس گروهی را روی ساعت‌های کاری آبی بگذارید. شاگردها آن را می‌بینند و خودشان ثبت‌نام می‌کنند.',
  s_search: 'جستجوی شاگرد', s_none: 'شاگردی ثبت‌نام نکرده است.', s_classes: 'کلاس‌ها', back: 'بازگشت',
  age_lbl: 'سن', gender_lbl: 'جنسیت', add_charge: 'ثبت بدهی', add_payment: 'ثبت پرداخت دستی', amount: 'مبلغ (تومان)', title_lbl: 'عنوان',
  monthly_charge: 'افزودن شهریه ترم از روی کلاس‌ها', pending_receipts: 'فیش‌های در انتظار', accept: 'تأیید پرداخت', reject: 'رد فیش',
  paid_amount: 'مبلغ تأییدشده (تومان)',
  paid_hint: 'اگر مبلغ برابر کل بدهی باشد، بدهی صفر می‌شود. اگر کمتر باشد همان مقدار از بدهی کم می‌شود.',
  claimed_lbl: 'مبلغ اعلام‌شده', del: 'حذف', total_debt: 'مجموع بدهی‌ها', debtors: 'بدهکار', pending_tag: 'فیش جدید',
  set_coach: 'نام مربی', set_bio: 'معرفی کوتاه', set_phone: 'شماره‌ی موبایل (برای همه نمایش داده می‌شود)', set_card: 'شماره‌ی کارت',
  set_holder: 'نام صاحب کارت', set_bands: 'قیمت کلاس خصوصی بر اساس ساعت شروع', band_from: 'از ساعت', band_to: 'تا ساعت', band_price: 'قیمت (تومان)',
  add_band: 'افزودن بازه', set_card_note: 'شماره‌ی کارت فقط بعد از ثبت نهایی کلاس‌ها به شاگرد نشان داده می‌شود.',
  weekly_cost: 'هزینه‌ی هفتگی', no_classes: 'کلاسی ندارد.', demo_banner: 'پیش‌نمایش با داده‌ی نمونه: هر کاری اینجا می‌کنید ذخیره نمی‌شود.',
  loading: 'در حال بارگذاری…', since: 'عضویت', ledger_empty: 'هنوز چیزی ثبت نشده.', no_receipts: 'فیشی ارسال نشده.'
},
en: {
  site: 'Tennis classes', login: 'Log in', register: 'Sign up', logout: 'Log out', enter_panel: 'Open my panel',
  shamsi: 'Shamsi', gregorian: 'Gregorian',
  hero_t: 'Tennis classes with {name}',
  hero_p: 'See the free hours, sign up by yourself, and follow your balance and payments in one place.',
  free_hours: 'Free hours this week', prices: 'Price per session (1 hour)', band_row: 'Starting between {from} and {to}',
  toman: 'Toman', groups_title: 'Group classes', no_groups: 'No group classes proposed yet.',
  contact: 'Coach phone', copy: 'Copy', copied: 'Copied', not_set: 'Not set yet',
  lg_free: 'Free', lg_full: 'Full', lg_off: 'Not a class hour', lg_sel: 'Class hour', lg_mine: 'Your class',
  lg_g: 'G = group class',
  first_name: 'First name', last_name: 'Last name', age: 'Age', gender: 'Gender (optional)', female: 'Girl', male: 'Boy', choose: 'Choose',
  mobile: 'Mobile number', parent_mobile: 'Parent mobile number', parent_req: 'Required under 18', parent_opt: 'Optional',
  email: 'Email', password: 'Password (min 6 characters)', have_account: 'Have an account?', no_account: 'No account yet?',
  err_generic: 'Something went wrong. Please try again.', err_required: 'Please fill in all required fields.',
  err_parent: 'A parent mobile number is required under 18.', err_login: 'Wrong email or password.',
  err_exists: 'This email is already registered.', err_taken: 'That hour was just taken.',
  err_group_full: 'This class is full.', err_slot_busy: 'This hour has a booking or group class and cannot be removed.',
  err_group_hours: 'The class hours must be inside the selected class hours.',
  err_group_busy: 'Another private or group class already uses these hours.',
  err_nothing: 'There are no new classes to finalize.', err_bad_amount: 'The amount is not valid.', err_confirm_email: 'Signed up. Open your email to confirm, then log in.',
  tab_extras: 'Extra sessions', extras_title: 'Extra sessions (one-off)', extras_help_st: 'These come from canceled classes or free hours. Each is a single session with its own price; the first person to sign up gets it.',
  ex_help_co: 'Create a one-off session with any price. The first student to sign up gets that single session and is charged right away. To re-offer a student\'s canceled class, use the "Cancel & offer" button in the Calendar.',
  ex_new: 'New extra session', ex_date: 'Date', ex_hour: 'Start hour', ex_price: 'Price of this session (Toman)', ex_note: 'Note (optional)', ex_create: 'Create session', ex_open: 'Open', ex_booked_by: 'Booked by {name}',
  ex_delete: 'Delete', ex_book: 'Sign up for this session', ex_book_q: 'Sign up for this session?', ex_one: 'This single session only', ex_charge_now: 'The price is added to your balance right now and the card number is shown for payment.',
  ex_none: 'No extra sessions right now.', ex_login: 'Log in to sign up.', offer_cancel: 'Cancel & offer to others', offer_q: 'Cancel this session and offer it to everyone else?', offer_price: 'Price of the new session (per hour)',
  offer_credit: 'Take one session off the student\'s balance', offer_go: 'Cancel & offer', canceled_lbl: 'Canceled', my_extras: 'My extra sessions', my_canceled: 'My canceled sessions (not held on these dates)',
  extracharge: 'Extra session', sessioncredit: 'Credit for canceled session', err_extra_taken: 'Someone else just took this session.', err_extra_conflict: 'There is already a class at that date and hour.', ex_reminder: 'Add to phone calendar',
  cancel_day: 'Cancel day', day_restore: 'Restore', day_canceled: 'Whole day canceled', cancel_day_q: 'Cancel all classes on this day?',
  cancel_day_help: 'All private and group classes on this day are canceled and students see it in their schedule. Extra sessions on that day are removed and refunded. You can restore the day any time.',
  cancel_day_note: 'Message to students (optional)', cancel_day_credit: 'Take one session off the balance of students who already finalized', cancel_day_go: 'Cancel whole day', closed_banner: 'Classes on {date} are canceled.', session_restore: 'Restore this session',
  sk_cancel: 'Cancel one session', sk_pick_q: 'Which session do you want to cancel?', sk_rule: 'If someone takes your canceled session, you get a make-up session that the coach will hold for you. If nobody takes it and the hour stays empty, this session is deducted from your sessions.',
  sk_none: 'No cancelable sessions in the next 8 weeks.', sk_notice: 'You can cancel up to {n} hours before the class.', st_pending: 'Waiting for a taker', st_makeup: 'You are owed a make-up session', st_forfeit: 'Deducted from your sessions', sk_withdraw: 'Withdraw cancellation',
  makeup_owed: 'Make-up sessions owed: {n}', makeup_lbl: 'Make-up', err_too_late: 'You can only cancel at least {n} hours before the class starts.', cancel_hours: 'Minimum hours before class for a student to cancel',
  mk_title: 'Make-up session', mk_help: 'This student is owed {n} make-up session(s) (sessions they canceled that someone else took). Pick a date and hour.', mk_create: 'Schedule make-up session', ex_save_price: 'Save', ex_from_student: 'From student cancellation', canceled_by_st: 'Canceled by student',
  mk_wait: 'Your coach will set the date and hour.',
  theme_to_dark: 'Dark mode', theme_to_light: 'Light mode',
  tab_schedule: 'Weekly schedule', tab_groups: 'Group classes', tab_mine: 'My classes & payment',
  tap_hint: 'Tap a green hour to book it every week. G means group class.',
  book_q: 'Book {day} at {hour}?', book_price: 'Price per session: {price} Toman', book_note: 'This class repeats every week.',
  confirm: 'Confirm', cancel: 'Cancel', cancel_class: 'Cancel this class', cancel_q: 'Cancel this class?',
  locked: 'This class is already finalized. Contact the coach to cancel it.', booked: 'Booked', canceled: 'Canceled',
  group_when: '{day} {from} to {to}', per_session: 'per session', spots_left: '{n} spots left', unlimited: 'Unlimited spots',
  join: 'Join this class', leave: 'Leave this class', joined: 'Joined', full: 'Full',
  my_private: 'My private classes', my_groups: 'My group classes', none_yet: 'Nothing selected yet.',
  weekly: 'Weekly total', monthly: 'Term total ({n} weeks)', finalize: 'Finalize my classes',
  finalize_help: 'After finalizing, the fee for the whole term ({n} weeks) is added to your balance and the card number is shown.',
  finalized: 'Registration finalized', price_unset: 'Some hours have no price set yet.',
  pay: 'Payment', pay_card: 'Transfer the amount to this card and send the receipt photo here.',
  card_holder: 'Card holder', your_debt: 'You owe', bal_owed: 'Balance owed', paid_off: 'Paid in full', credit: 'Credit',
  upload_receipt: 'Send receipt photo', receipt_photo: 'Receipt photo', claimed: 'Amount you paid (Toman, optional)', note: 'Note (optional)',
  send: 'Send', sent: 'Receipt sent', receipts: 'Receipts', st_pending: 'Waiting for approval', st_confirmed: 'Approved', st_rejected: 'Rejected',
  history: 'Account history', charge: 'Charge', payment: 'Payment', tuitionterm: 'Term tuition', payment_t: 'Payment (receipt approved)',
  reminder: 'Add class reminders to my phone',
  reminder_help: 'A calendar file will download. Open it to add your classes, with a 30-minute reminder, to your phone calendar (Android or iPhone).',
  ics_preview: 'Preview: on the real site this text downloads as a calendar file.', close: 'Close',
  tab_calendar: 'Calendar', tab_hours: 'Class hours', tab_cgroups: 'Group classes', tab_students: 'Students', tab_settings: 'Settings',
  this_week: 'This week', prev: 'Previous', next: 'Next', nothing_day: 'No classes.', private_with: 'Private: {name}', group_lbl: 'Group: {title}',
  hours_help: 'Tap the hours you teach to make them blue. The rest stay gray. Students only see the blue hours (green if free, red if taken).',
  term_start: 'Term start', term_weeks: 'Weeks in the term', save: 'Save', saved: 'Saved', dot_hint: '● means a private class, G means a group class.',
  g_new: 'New group class', g_edit: 'Edit group class', g_title: 'Class title', g_day: 'Day', g_start: 'Start hour', g_dur: 'Length (hours)',
  g_price: 'Price per session per student (Toman)', g_cap: 'Capacity (optional)', g_note: 'Note (optional)',
  g_create: 'Create class', g_delete: 'Delete', g_enrolled: 'Enrolled', g_none_enrolled: 'Nobody has joined yet', g_deleted: 'Deleted',
  g_help: 'Place the group class on blue class hours. Students will see it and join by themselves.',
  s_search: 'Search students', s_none: 'No students have signed up yet.', s_classes: 'Classes', back: 'Back',
  age_lbl: 'Age', gender_lbl: 'Gender', add_charge: 'Add charge', add_payment: 'Add payment manually', amount: 'Amount (Toman)', title_lbl: 'Title',
  monthly_charge: 'Add term tuition from classes', pending_receipts: 'Receipts waiting', accept: 'Approve payment', reject: 'Reject receipt',
  paid_amount: 'Approved amount (Toman)',
  paid_hint: 'If the amount equals the full balance, the balance becomes zero. If less, that amount is subtracted.',
  claimed_lbl: 'Amount stated', del: 'Delete', total_debt: 'Total owed', debtors: 'owing', pending_tag: 'New receipt',
  set_coach: 'Coach name', set_bio: 'Short intro', set_phone: 'Mobile number (shown to everyone)', set_card: 'Card number',
  set_holder: 'Card holder name', set_bands: 'Private class price by start hour', band_from: 'From hour', band_to: 'To hour', band_price: 'Price (Toman)',
  add_band: 'Add range', set_card_note: 'The card number is shown to a student only after they finalize their classes.',
  weekly_cost: 'Weekly cost', no_classes: 'No classes.', demo_banner: 'Preview with sample data: nothing you do here is saved.',
  loading: 'Loading…', since: 'Joined', ledger_empty: 'Nothing recorded yet.', no_receipts: 'No receipts sent.'
}};
function t(k, p){
  let s = I[S.lang][k]; if (s == null) s = I.fa[k]; if (s == null) s = k;
  if (p) for (const x in p) s = s.split('{' + x + '}').join(p[x]);
  return s;
}

/* ---------- formatting ---------- */
const nloc = () => S.lang === 'fa' ? 'fa-IR' : 'en-US';
const dloc = () => nloc() + '-u-ca-' + (S.cal === 'shamsi' ? 'persian' : 'gregory');
const nfmt = n => new Intl.NumberFormat(nloc()).format(Math.round(Number(n) || 0));
const hh = h => new Intl.NumberFormat(nloc(), {minimumIntegerDigits: 2, useGrouping: false}).format(h) + ':00';
const isoToDate = iso => new Date(iso + 'T12:00:00');
function fmtDate(d, opts){ try { return new Intl.DateTimeFormat(dloc(), opts || {year: 'numeric', month: 'long', day: 'numeric'}).format(d); } catch (e) { return String(d); } }
const toLatin = s => String(s == null ? '' : s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const parseAmt = s => { const x = toLatin(s).replace(/[^\d]/g, '').slice(0, 12); return x ? parseInt(x, 10) : 0; };
const parseIntOr = (s, d) => { const x = toLatin(s).replace(/[^\d]/g, '').slice(0, 4); return x ? parseInt(x, 10) : d; };
const persDay = d => (d.getDay() + 1) % 7;
const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayIso = () => isoOf(new Date());
const isoWd = iso => persDay(isoToDate(iso));
const fullName = p => p ? ((p.first_name || '') + ' ' + (p.last_name || '')).trim() : '';
const rid = () => Math.random().toString(36).slice(2, 10);
const termWeeks = () => Number(S.pub && S.pub.settings && S.pub.settings.term_weeks) || 12;

function priceAt(h){
  const b = (S.pub && S.pub.settings && S.pub.settings.bands) || [];
  for (const x of b) if (h >= x.from && h < x.to) return Number(x.price) || 0;
  return 0;
}
const balanceOf = rows => (rows || []).reduce((a, r) => a + (r.kind === 'charge' ? Number(r.amount) : -Number(r.amount)), 0);
function ltitle(r){
  const x = r.title || '';
  if (x[0] === '#') { const k = x.slice(1); return t(k === 'payment' ? 'payment_t' : k); }
  return x;
}
function errText(e){
  const m = String((e && (e.message || e.code)) || e || '');
  const c = e && e.code;
  if (c === '23505' || m.includes('duplicate') || m.includes('slot_taken_by_group') || m === 'taken') return t('err_taken');
  if (m.includes('too_late')) return t('err_too_late', {n: nfmt((S.pub && S.pub.settings && S.pub.settings.cancel_hours) || 12)});
  if (m.includes('extra_taken')) return t('err_extra_taken');
  if (m.includes('extra_conflict')) return t('err_extra_conflict');
  if (m.includes('group_full')) return t('err_group_full');
  if (c === '23503' || m.includes('slot_in_group') || m.includes('foreign key')) return t('err_slot_busy');
  if (m.includes('hour_not_in_slots')) return t('err_group_hours');
  if (m.includes('hour_has_booking') || m.includes('group_overlap')) return t('err_group_busy');
  if (m.includes('nothing_to_finalize')) return t('err_nothing');
  if (m.includes('bad_amount')) return t('err_bad_amount');
  if (m.includes('already registered') || m.includes('already been registered')) return t('err_exists');
  if (m.includes('Invalid login')) return t('err_login');
  return t('err_generic');
}
let toastT;
function toast(msg){
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}
function compressImage(file){
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('image')), 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); };
    img.src = url;
  });
}
/* ---------- calendar file with reminders ---------- */
function buildIcs(items, st){
  const p2 = n => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const fmt = (d, h) => { const x = new Date(d); x.setHours(h, 0, 0, 0); return x.getFullYear() + p2(x.getMonth() + 1) + p2(x.getDate()) + 'T' + p2(x.getHours()) + p2(x.getMinutes()) + '00'; };
  const esc2 = s => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  let start = st.term_start ? isoToDate(st.term_start) : new Date();
  const today = new Date(); today.setHours(12, 0, 0, 0);
  if (start < today) start = today;
  const weeks = st.term_weeks || 12;
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Coaching site//EN', 'CALSCALE:GREGORIAN'];
  items.forEach(it => {
    let d = new Date(start);
    if (it.date) d = isoToDate(it.date); else d.setDate(d.getDate() + (((it.wd + 6) % 7) - d.getDay() + 7) % 7);
    L.push('BEGIN:VEVENT', 'UID:' + it.uid + '@coach', 'DTSTAMP:' + stamp,
      'DTSTART:' + fmt(d, it.start), 'DTEND:' + fmt(d, it.start + it.dur));
    if (!it.date) L.push('RRULE:FREQ=WEEKLY;COUNT=' + weeks);
    (it.ex || []).forEach(x => L.push('EXDATE:' + fmt(isoToDate(x), it.start)));
    L.push('SUMMARY:' + esc2(it.title),
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc2(it.title), 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

/* ---------- shared view pieces ---------- */
const slotSet = () => new Set((S.pub.slots || []).map(s => s.weekday + ':' + s.hour));
const occMap = () => { const m = new Map(); (S.pub.occ || []).forEach(o => m.set(o.weekday + ':' + o.hour, o)); return m; };
const groupById = id => (S.pub.groups || []).find(g => g.id === id);
const groupCount = id => Number((S.pub.counts || {})[id] || 0);

function gridHtml(fn){
  const l = S.lang;
  let h = '<div class="gridwrap"><div class="grid"><div class="gh"></div>';
  for (let d = 0; d < 7; d++) h += '<div class="gh">' + DAYS_S[l][d] + '</div>';
  for (let hr = HOUR_FROM; hr < HOUR_TO; hr++){
    h += '<div class="gl">' + hh(hr) + '</div>';
    for (let d = 0; d < 7; d++){
      const c = fn(d, hr), label = esc(DAYS[l][d] + ' ' + hh(hr));
      if (c.act) h += '<button class="cell ' + c.cls + '" data-act="' + c.act + '" data-wd="' + d + '" data-h="' + hr + '"' + (c.ref ? ' data-ref="' + esc(c.ref) + '"' : '') + ' aria-label="' + label + '">' + (c.txt || '') + '</button>';
      else h += '<div class="cell ' + c.cls + '" role="img" aria-label="' + label + '">' + (c.txt || '') + '</div>';
    }
  }
  return h + '</div></div>';
}
function legend(keys){
  const names = {free: 'lg_free', full: 'lg_full', off: 'lg_off', sel: 'lg_sel', mine: 'lg_mine'};
  return '<div class="legend">' + keys.map(k => '<span><i class="' + k + '"></i>' + t(names[k]) + '</span>').join('') + '</div>';
}
function bookingCell(interactive){
  const slots = slotSet(), occ = occMap();
  return (d, h) => {
    const key = d + ':' + h;
    if (!slots.has(key)) return {cls: 'off'};
    const o = occ.get(key);
    if (o){
      const g = o.kind === 'group';
      if (o.mine) return {cls: 'mine', txt: g ? 'G✓' : '✓', act: interactive ? (g ? 'cell-group' : 'cell-mine') : '', ref: o.ref_id};
      return {cls: 'full', txt: g ? 'G' : '×', act: (interactive && g) ? 'cell-group' : '', ref: o.ref_id};
    }
    return {cls: 'free', act: interactive ? 'cell-free' : ''};
  };
}
function pricesCard(){
  const bands = ((S.pub.settings.bands) || []).filter(b => Number(b.price) > 0);
  if (!bands.length) return '';
  return '<div class="card"><h3>' + t('prices') + '</h3><div class="list">' + bands.map(b =>
    '<div class="item"><span>' + t('band_row', {from: hh(b.from), to: hh(b.to)}) + '</span><span class="amt">' + nfmt(b.price) + ' ' + t('toman') + '</span></div>').join('') + '</div></div>';
}
function groupWhen(g){ return t('group_when', {day: DAYS[S.lang][g.weekday], from: hh(g.start_hour), to: hh(g.start_hour + g.duration)}); }
function groupCard(g, mode){
  const n = groupCount(g.id), cap = g.capacity;
  const joinedRow = S.mine && (S.mine.members || []).find(m => m.group_id === g.id);
  const left = cap == null ? t('unlimited') : (cap - n > 0 ? t('spots_left', {n: nfmt(cap - n)}) : t('full'));
  let act = '';
  if (mode === 'student'){
    if (joinedRow) act = joinedRow.charged ? '<p class="muted small">' + t('locked') + '</p>' : '<button class="btn block" data-act="leave" data-id="' + esc(g.id) + '">' + t('leave') + '</button>';
    else act = '<button class="btn primary block" data-act="join" data-id="' + esc(g.id) + '"' + ((cap != null && cap - n <= 0) ? ' disabled' : '') + '>' + t('join') + '</button>';
  }
  return '<div class="card"><div class="row between"><h3>' + esc(g.title) + '</h3>' + (joinedRow ? '<span class="tag ok">' + t('joined') + '</span>' : '') + '</div>' +
    '<p>' + groupWhen(g) + '</p><p class="muted small">' + nfmt(g.price) + ' ' + t('toman') + ' · ' + t('per_session') + ' · ' + left + '</p>' +
    (g.note ? '<p class="small">' + esc(g.note) + '</p>' : '') + act + '</div>';
}

/* ---------- chrome ---------- */
function extraWhen(e){ return fmtDate(isoToDate(e.date), {weekday: 'long', month: 'long', day: 'numeric'}) + ' · ' + hh(e.hour) + '–' + hh(e.hour + 1); }
const dtOf = (iso, h) => new Date(iso + 'T' + String(h).padStart(2, '0') + ':00:00');
const mkKey = sk => sk.booking_id + '|' + sk.date;
function skipExtra(sk){ return (S.pub.extras || []).find(e => e.from_booking === sk.booking_id && e.date === sk.date); }
function skipStatus(sk){
  if (sk.by !== 'student') return 'coach';
  const e = skipExtra(sk);
  if (e && e.booked) return 'makeup';
  if (!e || dtOf(sk.date, e.hour) <= new Date()) return 'forfeit';
  return 'pending';
}
function makeupUsed(sk, extras){ return (extras || []).some(e => e.makeup_for === mkKey(sk)); }
function openExtras(){ return (S.pub.extras || []).filter(e => !e.booked && e.date >= todayIso()).sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour, 'en', {numeric: true})); }
function extraCard(e){
  const mode = S.user && !S.user.isCoach ? 'student' : (S.user ? 'none' : 'visitor');
  return '<div class="item"><div><div class="t">' + extraWhen(e) + '</div><div class="muted small">' + t('ex_one') + (e.note ? ' · ' + esc(e.note) : '') + '</div></div><div style="text-align:end"><div class="amt">' + nfmt(e.price) + '</div>' +
    (mode === 'student' ? '<button class="btn sm primary" data-act="ex-ask" data-id="' + esc(e.id) + '">' + t('ex_book') + '</button>' : (mode === 'visitor' ? '<span class="muted small">' + t('ex_login') + '</span>' : '')) + '</div></div>';
}
function extrasPublicCard(){
  const l = openExtras(); if (!l.length) return '';
  return '<div class="card" style="gap:6px"><h3>' + t('extras_title') + '</h3><p class="muted small">' + t('extras_help_st') + '</p><div class="list">' + l.map(extraCard).join('') + '</div></div>';
}
function viewTop(){
  const name = (S.pub && S.pub.settings && S.pub.settings.coach_name) || '';
  const sw = (act, items, cur) => items.map(([v, label]) => '<button class="pill-btn" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + (cur === v) + '">' + label + '</button>').join('');
  let h = '<header class="topbar"><a class="brand" href="#" data-act="nav" data-route="home" aria-label="' + esc(name || t('site')) + '"><img src="' + ASSET.top + '" alt="' + esc(name || t('site')) + '"></a><div class="top-tools">' +
    sw('lang', [['fa', 'فا'], ['en', 'EN']], S.lang) + '<button class="pill-btn" data-act="theme" aria-label="' + t(S.theme === 'dark' ? 'theme_to_light' : 'theme_to_dark') + '" title="' + t(S.theme === 'dark' ? 'theme_to_light' : 'theme_to_dark') + '">' + (S.theme === 'dark' ? '☀' : '☾') + '</button>' + sw('cal', [['shamsi', t('shamsi')], ['gregory', t('gregorian')]], S.cal);
  if (S.user){
    if (S.route !== 'app') h += '<button class="pill-btn on" data-act="nav" data-route="app">' + t('enter_panel') + '</button>';
    h += '<button class="pill-btn" data-act="logout">' + t('logout') + '</button>';
  } else {
    h += '<button class="pill-btn" data-act="nav" data-route="login">' + t('login') + '</button><button class="pill-btn on" data-act="nav" data-route="register">' + t('register') + '</button>';
  }
  return h + '</div></header>';
}
function tabsHtml(tabs){
  return '<nav class="tabs">' + tabs.map(([k, l]) => '<button class="pill-btn" data-act="tab" data-tab="' + k + '" aria-pressed="' + (S.tab === k) + '">' + t(l) + '</button>').join('') + '</nav>';
}

/* ---------- public home ---------- */
function viewHome(){
  const st = S.pub.settings, name = st.coach_name || '';
  let h = '<section class="hero"><img class="mark" src="' + ASSET.round + '" alt=""><h1>' + esc(name ? t('hero_t', {name}) : t('site')) + '</h1><p>' + t('hero_p') + '</p>' + (st.bio ? '<p>' + esc(st.bio) + '</p>' : '') +
    '<div class="row">' + (S.user ? '<button class="btn primary" data-act="nav" data-route="app">' + t('enter_panel') + '</button>' :
      '<button class="btn primary" data-act="nav" data-route="register">' + t('register') + '</button><button class="btn" data-act="nav" data-route="login">' + t('login') + '</button>') + '</div></section><div class="page">';
  h += '<div class="card"><h3>' + t('contact') + '</h3><div class="row between">' + (st.phone ?
    '<span class="card-num">' + esc(st.phone) + '</span><button class="btn sm" data-act="copy" data-text="' + esc(st.phone) + '">' + t('copy') + '</button>' : '<span class="muted">' + t('not_set') + '</span>') + '</div></div>';
  h += closedBanners() + extrasPublicCard();
  h += pricesCard();
  h += '<div class="card"><h3>' + t('free_hours') + '</h3>' + gridHtml(bookingCell(false)) + legend(['free', 'full', 'off']) + '<p class="muted small">' + t('lg_g') + '</p></div>';
  h += '<div class="card" style="gap:6px"><h3>' + t('groups_title') + '</h3>' + ((S.pub.groups || []).length ?
    '<div class="list">' + S.pub.groups.map(g => '<div class="item"><div><div class="t">' + esc(g.title) + '</div><div class="muted small">' + groupWhen(g) + '</div></div><span class="amt">' + nfmt(g.price) + '</span></div>').join('') + '</div>' :
    '<p class="muted">' + t('no_groups') + '</p>') + '</div></div>';
  return h;
}

/* ---------- login / register ---------- */
function viewLogin(){
  return '<div class="page"><div class="card"><h2>' + t('login') + '</h2><form class="form" data-form="login" novalidate>' +
    '<label for="l_email">' + t('email') + '</label><input class="inp" id="l_email" name="email" type="email" dir="ltr" autocomplete="email">' +
    '<label for="l_pw">' + t('password').replace(/\s*\(.*\)/, '') + '</label><input class="inp" id="l_pw" name="password" type="password" dir="ltr" autocomplete="current-password">' +
    '<p class="err" id="formerr" role="alert"></p><button class="btn primary block" type="submit">' + t('login') + '</button></form>' +
    '<p class="muted small">' + t('no_account') + ' <a href="#" data-act="nav" data-route="register">' + t('register') + '</a></p></div></div>';
}
function viewRegister(){
  return '<div class="page"><div class="card"><h2>' + t('register') + '</h2><form class="form" data-form="register" novalidate>' +
    '<div class="two"><div><label for="r_fn">' + t('first_name') + '</label><input class="inp" id="r_fn" name="first_name" autocomplete="given-name"></div>' +
    '<div><label for="r_ln">' + t('last_name') + '</label><input class="inp" id="r_ln" name="last_name" autocomplete="family-name"></div></div>' +
    '<div class="two"><div><label for="r_age">' + t('age') + '</label><input class="inp" id="r_age" name="age" inputmode="numeric" maxlength="3"></div>' +
    '<div><label for="r_g">' + t('gender') + '</label><select class="inp" id="r_g" name="gender"><option value="">' + t('choose') + '</option><option value="female">' + t('female') + '</option><option value="male">' + t('male') + '</option></select></div></div>' +
    '<label for="r_m">' + t('mobile') + '</label><input class="inp" id="r_m" name="mobile" type="tel" dir="ltr" inputmode="tel" autocomplete="tel">' +
    '<label for="r_pm">' + t('parent_mobile') + ' <span id="pm_hint">(' + t('parent_opt') + ')</span></label><input class="inp" id="r_pm" name="parent_mobile" type="tel" dir="ltr" inputmode="tel">' +
    '<label for="r_e">' + t('email') + '</label><input class="inp" id="r_e" name="email" type="email" dir="ltr" autocomplete="email">' +
    '<label for="r_p">' + t('password') + '</label><input class="inp" id="r_p" name="password" type="password" dir="ltr" autocomplete="new-password">' +
    '<p class="err" id="formerr" role="alert"></p><button class="btn primary block" type="submit">' + t('register') + '</button></form>' +
    '<p class="muted small">' + t('have_account') + ' <a href="#" data-act="nav" data-route="login">' + t('login') + '</a></p></div></div>';
}

/* ---------- student ---------- */
function viewStudent(){
  const tabs = [['schedule', 'tab_schedule'], ['groups', 'tab_groups'], ['mine', 'tab_mine']];
  if (!tabs.some(x => x[0] === S.tab)) S.tab = 'schedule';
  let body;
  if (S.tab === 'schedule') body = closedBanners() + extrasPublicCard() + '<div class="card"><h3>' + t('free_hours') + '</h3><p class="muted small">' + t('tap_hint') + '</p>' + gridHtml(bookingCell(true)) + legend(['free', 'full', 'off', 'mine']) + '</div>' + pricesCard();
  else if (S.tab === 'groups') body = (S.pub.groups || []).length ? S.pub.groups.map(g => groupCard(g, 'student')).join('') : '<div class="empty">' + t('no_groups') + '</div>';
  else body = stMine();
  return tabsHtml(tabs) + '<div class="page">' + body + '</div>';
}
function myClasses(){
  const m = S.mine, arr = [];
  (m.bookings || []).forEach(b => arr.push({kind: 'private', id: b.id, wd: b.weekday, start: b.hour, dur: 1, price: priceAt(b.hour), charged: b.charged, title: t('site')}));
  (m.members || []).forEach(x => { const g = groupById(x.group_id); if (g) arr.push({kind: 'group', id: g.id, wd: g.weekday, start: g.start_hour, dur: g.duration, price: Number(g.price), charged: x.charged, title: g.title}); });
  return arr.sort((a, b) => a.wd - b.wd || a.start - b.start);
}
function ledgerList(rows){
  const r = (rows || []).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  if (!r.length) return '<p class="muted">' + t('ledger_empty') + '</p>';
  return '<div class="list">' + r.map(x => '<div class="item"><div><div class="t">' + esc(ltitle(x)) + '</div><div class="muted small">' + fmtDate(new Date(x.created_at)) + '</div></div>' +
    '<span class="amt ' + (x.kind === 'charge' ? 'debt' : 'ok') + '">' + (x.kind === 'charge' ? '+' : '−') + nfmt(x.amount) + '</span></div>').join('') + '</div>';
}
function balBox(b, coach){
  const cls = b > 0 ? 'debt' : 'ok';
  return '<div class="bal ' + cls + '"><span>' + (b > 0 ? t(coach ? 'bal_owed' : 'your_debt') : (b < 0 ? t('credit') : t('paid_off'))) + '</span><span class="big num">' + nfmt(Math.abs(b)) + ' <small style="font-size:13px;font-family:var(--font-body)">' + t('toman') + '</small></span></div>';
}
function receiptList(rows){
  if (!rows || !rows.length) return '<p class="muted">' + t('no_receipts') + '</p>';
  const tag = {pending: 'warn', confirmed: 'ok', rejected: 'debt'};
  return '<div class="list">' + rows.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map(r =>
    '<div class="item" style="grid-template-columns:64px minmax(0,1fr) auto"><img data-path="' + esc(r.path) + '" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;background:var(--surface-2)">' +
    '<div><div class="muted small">' + fmtDate(new Date(r.created_at)) + '</div>' + (r.claimed_amount ? '<div class="small">' + t('claimed_lbl') + ': ' + nfmt(r.claimed_amount) + '</div>' : '') +
    (r.status === 'confirmed' ? '<div class="small">' + nfmt(r.confirmed_amount) + ' ' + t('toman') + '</div>' : '') + '</div><span class="tag ' + tag[r.status] + '">' + t('st_' + r.status) + '</span></div>').join('') + '</div>';
}
function stMine(){
  const m = S.mine, cl = myClasses(), st = S.pub.settings;
  const week = cl.reduce((a, c) => a + c.price, 0), pend = cl.filter(c => !c.charged).reduce((a, c) => a + c.price, 0);
  const owedTop = (m.skips || []).filter(x => skipStatus(x) === 'makeup' && !makeupUsed(x, m.extras)).length;
  let h = (owedTop ? '<div class="notice"><b>' + t('makeup_owed', {n: nfmt(owedTop)}) + '</b><br>' + t('st_makeup') + ' — ' + t('mk_wait') + '</div>' : '') + '<div class="card"><h3>' + t('my_private') + ' / ' + t('my_groups') + '</h3>';
  if (!cl.length) h += '<p class="muted">' + t('none_yet') + '</p>';
  else {
    h += '<div class="list">' + cl.map(c => '<div class="item"><div><div class="t">' + DAYS[S.lang][c.wd] + ' ' + hh(c.start) + '–' + hh(c.start + c.dur) + '</div><div class="muted small">' +
      (c.kind === 'group' ? t('group_lbl', {title: esc(c.title)}) : t('tab_schedule')) + ' · ' + nfmt(c.price) + ' ' + t('toman') + '</div></div>' +
      (c.charged ? '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="tag ok">' + t('finalized') + '</span>' + (c.kind === 'private' ? '<button class="btn sm" data-act="sk-ask" data-id="' + esc(c.id) + '">' + t('sk_cancel') + '</button>' : '') + '</div>' : '<button class="btn sm" data-act="' + (c.kind === 'group' ? 'leave' : 'ask-cancel') + '" data-id="' + esc(c.id) + '">' + t('cancel_class') + '</button>') + '</div>').join('') + '</div>' +
      '<div class="row between"><span class="muted">' + t('weekly') + '</span><b class="num">' + nfmt(week) + ' ' + t('toman') + '</b></div>' +
      '<div class="row between"><span class="muted">' + t('monthly', {n: nfmt(termWeeks())}) + '</span><b class="num">' + nfmt(week * termWeeks()) + ' ' + t('toman') + '</b></div>';
    if (cl.some(c => c.price === 0)) h += '<p class="banner">' + t('price_unset') + '</p>';
    if (cl.some(c => !c.charged)) h += '<p class="muted small">' + t('finalize_help', {n: nfmt(termWeeks())}) + '</p><button class="btn primary block" data-act="finalize">' + t('finalize') + ' (' + nfmt(pend * termWeeks()) + ' ' + t('toman') + ')</button>';
    h += '<button class="btn block" data-act="ics">' + t('reminder') + '</button><p class="muted small">' + t('reminder_help') + '</p>';
  }
  h += '</div>';
  const myEx = (m.extras || []).slice().sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour, 'en', {numeric: true}));
  const mySkAll = (m.skips || []), owed = mySkAll.filter(x => skipStatus(x) === 'makeup' && !makeupUsed(x, m.extras)).length;
  if (myEx.length) h += '<div class="card"><h3>' + t('my_extras') + '</h3><div class="list">' + myEx.map(e => '<div class="item"><div><div class="t">' + extraWhen(e) + '</div><div class="muted small">' + (e.price > 0 ? nfmt(e.price) + ' ' + t('toman') : t('makeup_lbl')) + '</div></div><button class="btn sm" data-act="ics-extra" data-id="' + esc(e.id) + '">' + t('ex_reminder') + '</button></div>').join('') + '</div></div>';
  const mySk = mySkAll.filter(x => x.date >= todayIso() || skipStatus(x) !== 'coach').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  if (mySk.length) h += '<div class="card"><h3>' + t('my_canceled') + '</h3><div class="list">' + mySk.map(x => {
    const b = (m.bookings || []).find(y => y.id === x.booking_id), g = x.group_id ? groupById(x.group_id) : null, st = skipStatus(x);
    const tag = st === 'pending' ? '<span class="tag warn">' + t('st_pending') + '</span><button class="btn sm" data-act="sk-withdraw" data-bid="' + esc(x.booking_id) + '" data-iso="' + x.date + '">' + t('sk_withdraw') + '</button>' :
      st === 'makeup' ? '<span class="tag ok">' + t('st_makeup') + (makeupUsed(x, m.extras) ? ' ✓' : '') + '</span>' : st === 'forfeit' ? '<span class="tag debt">' + t('st_forfeit') + '</span>' : '<span class="tag warn">' + t('canceled_lbl') + '</span>';
    return '<div class="item"><div class="t">' + fmtDate(isoToDate(x.date), {weekday: 'long', month: 'long', day: 'numeric'}) + (b ? ' · ' + hh(b.hour) : '') + (g ? ' · ' + esc(g.title) : '') + '</div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + tag + '</div></div>';
  }).join('') + '</div></div>';
  const bal = balanceOf(m.ledger);
  if (m.card){
    h += '<div class="card"><h3>' + t('pay') + '</h3>' + balBox(bal) + '<p class="muted small">' + t('pay_card') + '</p>' +
      '<div class="card-num">' + esc(m.card.card_number || t('not_set')) + '</div><p class="muted small">' + t('card_holder') + ': ' + esc(m.card.card_holder || '') + '</p>' +
      '<form class="form" data-form="receipt"><label for="rc_f">' + t('receipt_photo') + '</label><input class="inp" id="rc_f" name="file" type="file" accept="image/*">' +
      '<label for="rc_a">' + t('claimed') + '</label><input class="inp amt-in" id="rc_a" name="claimed" inputmode="numeric">' +
      '<label for="rc_n">' + t('note') + '</label><input class="inp" id="rc_n" name="note" maxlength="200">' +
      '<p class="err" id="formerr" role="alert"></p><button class="btn primary block" type="submit">' + t('send') + '</button></form></div>' +
      '<div class="card"><h3>' + t('receipts') + '</h3>' + receiptList(m.receipts) + '</div>';
  }
  if ((m.ledger || []).length) h += '<div class="card"><h3>' + t('history') + '</h3>' + ledgerList(m.ledger) + '</div>';
  return h;
}

/* ---------- coach ---------- */
function viewCoach(){
  const tabs = [['calendar', 'tab_calendar'], ['hours', 'tab_hours'], ['groups', 'tab_cgroups'], ['extras', 'tab_extras'], ['students', 'tab_students'], ['settings', 'tab_settings']];
  if (!tabs.some(x => x[0] === S.tab)) S.tab = 'calendar';
  const f = {calendar: coCalendar, hours: coHours, groups: coGroups, extras: coExtras, students: coStudents, settings: coSettings}[S.tab];
  return tabsHtml(tabs) + '<div class="page">' + f() + '</div>';
}
function weekStart(off){
  const d = new Date(); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - persDay(d) + off * 7);
  return d;
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const profMap = () => { const m = {}; (S.co.profiles || []).forEach(p => m[p.id] = p); return m; };
const skipped = (bid, iso) => (S.co.skips || []).some(x => x.booking_id === bid && x.date === iso);
const gskipped = (gid, iso) => (S.co.skips || []).some(x => x.group_id === gid && x.date === iso);
const closedOn = iso => (S.pub.closed || []).find(c => c.date === iso);
function closedBanners(){
  const l = (S.pub.closed || []).filter(c => c.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date));
  return l.map(c => '<p class="banner">' + t('closed_banner', {date: fmtDate(isoToDate(c.date), {weekday: 'long', month: 'long', day: 'numeric'})}) + (c.note ? ' ' + esc(c.note) : '') + '</p>').join('');
}
function coEvents(wd, iso){
  const pm = profMap(), ev = [];
  const all = (S.co.bookings || []).filter(b => b.weekday === wd).sort((a, b) => a.hour - b.hour);
  all.filter(b => skipped(b.id, iso)).forEach(b => ev.push({kind: 'canceled', bid: b.id, day: (S.co.skips || []).some(x => x.booking_id === b.id && x.date === iso && x.day), start: b.hour, end: b.hour + 1, label: t('private_with', {name: esc(fullName(pm[b.student_id]))}) + ' — ' + t((S.co.skips || []).some(x => x.booking_id === b.id && x.date === iso && x.by === 'student') ? 'canceled_by_st' : 'canceled_lbl')}));
  all.filter(b => !skipped(b.id, iso)).forEach(b => {
    const last = ev[ev.length - 1];
    if (last && last.kind === 'private' && last.sid === b.student_id && last.end === b.hour){ last.end = b.hour + 1; last.ids.push(b.id); }
    else ev.push({kind: 'private', sid: b.student_id, ids: [b.id], start: b.hour, end: b.hour + 1, label: t('private_with', {name: esc(fullName(pm[b.student_id]))})});
  });
  (S.pub.extras || []).filter(e => e.date === iso).forEach(e => ev.push({kind: 'extra', start: e.hour, end: e.hour + 1, label: t('extracharge') + ' · ' + (e.student_id ? esc(fullName(pm[e.student_id])) : t('ex_open')) + ' · ' + nfmt(e.price)}));
  (S.pub.groups || []).filter(g => g.weekday === wd).forEach(g => {
    if (gskipped(g.id, iso)){ ev.push({kind: 'canceled', day: true, start: g.start_hour, end: g.start_hour + g.duration, label: t('group_lbl', {title: esc(g.title)}) + ' — ' + t('canceled_lbl')}); return; }
    const names = (S.co.members || []).filter(m => m.group_id === g.id).map(m => esc(fullName(pm[m.student_id])));
    ev.push({kind: 'group', start: g.start_hour, end: g.start_hour + g.duration, label: t('group_lbl', {title: esc(g.title)}) + (names.length ? ' (' + names.join('، ') + ')' : '')});
  });
  return ev.sort((a, b) => a.start - b.start);
}
function coCalendar(){
  const ws = weekStart(S.weekOff), md = {month: 'long', day: 'numeric'}, now = new Date();
  let h = '<div class="card"><div class="row between"><button class="btn sm" data-act="wk" data-v="-1">‹ ' + t('prev') + '</button><b>' + (S.weekOff === 0 ? t('this_week') + ' · ' : '') + fmtDate(ws, md) + ' – ' + fmtDate(addDays(ws, 6), md) + '</b><button class="btn sm" data-act="wk" data-v="1">' + t('next') + ' ›</button></div>';
  if (S.weekOff !== 0) h += '<button class="btn sm" data-act="wk" data-v="0">' + t('this_week') + '</button>';
  for (let d = 0; d < 7; d++){
    const dt = addDays(ws, d), iso = isoOf(dt), ev = coEvents(d, iso), today = dt.toDateString() === now.toDateString();
    h += '<div class="day' + (today ? ' today' : '') + '"><div><div class="dn">' + DAYS[S.lang][d] + '</div><div class="dd">' + fmtDate(dt, {month: 'short', day: 'numeric'}) + '</div>' +
      (iso < todayIso() ? '' : (closedOn(iso) ? '<span class="tag warn" style="margin-top:4px">' + t('canceled_lbl') + '</span><button class="btn sm" style="margin-top:4px" data-act="day-restore" data-iso="' + iso + '">' + t('day_restore') + '</button>' : '<button class="btn sm danger" style="margin-top:4px" data-act="day-ask" data-iso="' + iso + '">' + t('cancel_day') + '</button>')) +
      '</div><div>' + (closedOn(iso) && closedOn(iso).note ? '<div class="muted small ev">' + esc(closedOn(iso).note) + '</div>' : '') +
      (ev.length ? ev.map(e => '<div class="ev ' + e.kind + '"><span class="tm">' + hh(e.start) + '–' + hh(e.end) + '</span><span class="who">' + e.label + '</span>' +
        (e.kind === 'canceled' && !e.day && iso >= todayIso() ? '<button class="btn sm" data-act="sess-restore" data-bid="' + esc(e.bid) + '" data-iso="' + iso + '">' + t('session_restore') + '</button>' : '') +
        (e.kind === 'private' && iso >= todayIso() ? '<button class="btn sm" data-act="offer-ask" data-ids="' + e.ids.join(',') + '" data-iso="' + iso + '" data-start="' + e.start + '" data-end="' + e.end + '">' + t('offer_cancel') + '</button>' : '') + '</div>').join('') : '<div class="muted small ev">' + t('nothing_day') + '</div>') + '</div></div>';
  }
  return h + '</div>';
}
function coHours(){
  const st = S.pub.settings, slots = slotSet(), occ = occMap();
  const cell = (d, hr) => { const k = d + ':' + hr, o = occ.get(k); return {cls: slots.has(k) ? 'sel' : 'off', txt: o ? (o.kind === 'group' ? 'G' : '●') : '', act: 'tog'}; };
  return '<div class="card"><form class="form" data-form="term"><div class="two"><div><label for="t_s">' + t('term_start') + '</label><input class="inp" id="t_s" name="term_start" type="date" value="' + esc(st.term_start || '') + '"></div>' +
    '<div><label for="t_w">' + t('term_weeks') + '</label><input class="inp" id="t_w" name="term_weeks" inputmode="numeric" value="' + esc(nfmt(st.term_weeks || 12)) + '"></div></div>' +
    '<label for="t_c">' + t('cancel_hours') + '</label><input class="inp" id="t_c" name="cancel_hours" inputmode="numeric" value="' + esc(nfmt(st.cancel_hours == null ? 12 : st.cancel_hours)) + '">' +
    '<p class="muted small" id="t_prev">' + (st.term_start ? fmtDate(isoToDate(st.term_start)) : '') + '</p><button class="btn primary" type="submit">' + t('save') + '</button></form></div>' +
    '<div class="card"><p class="muted small">' + t('hours_help') + '</p>' + gridHtml(cell) + legend(['sel', 'off']) + '<p class="muted small">' + t('dot_hint') + '</p></div>';
}
function hourOptions(sel){ let o = ''; for (let h = HOUR_FROM; h < HOUR_TO; h++) o += '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' + hh(h) + '</option>'; return o; }
function coGroups(){
  const g = S.gEdit ? groupById(S.gEdit) : null, pm = profMap();
  let h = '<div class="card"><h3>' + (g ? t('g_edit') : t('g_new')) + '</h3><p class="muted small">' + t('g_help') + '</p><form class="form" data-form="group" data-id="' + esc(g ? g.id : '') + '">' +
    '<label for="g_t">' + t('g_title') + '</label><input class="inp" id="g_t" name="title" maxlength="60" value="' + esc(g ? g.title : '') + '">' +
    '<div class="two"><div><label for="g_d">' + t('g_day') + '</label><select class="inp" id="g_d" name="weekday">' + DAYS[S.lang].map((n, i) => '<option value="' + i + '"' + (g && g.weekday === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
    '<div><label for="g_s">' + t('g_start') + '</label><select class="inp" id="g_s" name="start_hour">' + hourOptions(g ? g.start_hour : 16) + '</select></div></div>' +
    '<div class="two"><div><label for="g_l">' + t('g_dur') + '</label><select class="inp" id="g_l" name="duration">' + [1, 2, 3, 4].map(n => '<option value="' + n + '"' + (g && g.duration === n ? ' selected' : '') + '>' + nfmt(n) + '</option>').join('') + '</select></div>' +
    '<div><label for="g_c">' + t('g_cap') + '</label><input class="inp" id="g_c" name="capacity" inputmode="numeric" value="' + esc(g && g.capacity ? nfmt(g.capacity) : '') + '"></div></div>' +
    '<label for="g_p">' + t('g_price') + '</label><input class="inp amt-in" id="g_p" name="price" inputmode="numeric" value="' + esc(g ? nfmt(g.price) : '') + '">' +
    '<label for="g_n">' + t('g_note') + '</label><input class="inp" id="g_n" name="note" maxlength="200" value="' + esc(g ? g.note : '') + '">' +
    '<p class="err" id="formerr" role="alert"></p><div class="row"><button class="btn primary grow" type="submit">' + (g ? t('save') : t('g_create')) + '</button>' + (g ? '<button class="btn" type="button" data-act="g-cancel">' + t('cancel') + '</button>' : '') + '</div></form></div>';
  (S.pub.groups || []).forEach(x => {
    const names = (S.co.members || []).filter(m => m.group_id === x.id).map(m => esc(fullName(pm[m.student_id])));
    h += '<div class="card"><h3>' + esc(x.title) + '</h3><p>' + groupWhen(x) + '</p><p class="muted small">' + nfmt(x.price) + ' ' + t('toman') + ' · ' + t('per_session') + (x.capacity ? ' · ' + nfmt(names.length) + '/' + nfmt(x.capacity) : '') + '</p>' +
      '<p class="small"><b>' + t('g_enrolled') + ':</b> ' + (names.length ? names.join('، ') : t('g_none_enrolled')) + '</p>' +
      '<div class="row"><button class="btn sm" data-act="g-edit" data-id="' + esc(x.id) + '">' + t('save').replace(t('save'), '✎') + '</button><button class="btn sm danger" data-act="g-del" data-id="' + esc(x.id) + '">' + t('g_delete') + '</button></div></div>';
  });
  return h;
}
function coExtras(){
  const pm = profMap(), td = todayIso();
  const l = (S.pub.extras || []).filter(e => e.date >= td).sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour, 'en', {numeric: true}));
  let h = '<div class="card"><h3>' + t('ex_new') + '</h3><p class="muted small">' + t('ex_help_co') + '</p><form class="form" data-form="extra">' +
    '<div class="two"><div><label for="x_d">' + t('ex_date') + '</label><input class="inp" id="x_d" name="date" type="date" min="' + td + '" value="' + td + '"></div>' +
    '<div><label for="x_h">' + t('ex_hour') + '</label><select class="inp" id="x_h" name="hour">' + hourOptions(16) + '</select></div></div>' +
    '<label for="x_p">' + t('ex_price') + '</label><input class="inp amt-in" id="x_p" name="price" inputmode="numeric" value="' + esc(nfmt(priceAt(16))) + '">' +
    '<label for="x_n">' + t('ex_note') + '</label><input class="inp" id="x_n" name="note" maxlength="120">' +
    '<p class="err" id="formerr" role="alert"></p><button class="btn primary block" type="submit">' + t('ex_create') + '</button></form></div>';
  h += '<div class="card" style="gap:6px"><h3>' + t('extras_title') + '</h3>' + (l.length ? '<div class="list">' + l.map(e => '<div class="item"><div><div class="t">' + extraWhen(e) + '</div><div class="muted small">' + nfmt(e.price) + ' ' + t('toman') + (e.note ? ' · ' + esc(e.note) : '') + '</div></div>' +
    (e.student_id ? '<span class="tag ok">' + (e.makeup_for ? t('makeup_lbl') + ' · ' : '') + t('ex_booked_by', {name: esc(fullName(pm[e.student_id]))}) + '</span>' :
    '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="tag warn">' + t('ex_open') + (e.from_booking && (S.co.skips || []).some(s => s.booking_id === e.from_booking && s.date === e.date && s.by === 'student') ? ' · ' + t('ex_from_student') : '') + '</span>' +
    '<div class="row" style="flex-wrap:nowrap"><input class="inp amt-in" style="width:104px;min-height:34px;padding:4px 8px" id="xp_' + esc(e.id) + '" inputmode="numeric" value="' + esc(nfmt(e.price)) + '"><button class="btn sm" data-act="ex-price" data-id="' + esc(e.id) + '">' + t('ex_save_price') + '</button>' +
    (e.from_booking && (S.co.skips || []).some(s => s.booking_id === e.from_booking && s.date === e.date && s.by === 'student') ? '' : '<button class="btn sm danger" data-act="ex-del" data-id="' + esc(e.id) + '">' + t('ex_delete') + '</button>') + '</div></div>') + '</div>').join('') + '</div>' : '<p class="muted">' + t('ex_none') + '</p>') + '</div>';
  return h;
}
function stuStats(p){
  const led = (S.co.ledger || []).filter(x => x.student_id === p.id);
  const pend = (S.co.receipts || []).filter(r => r.student_id === p.id && r.status === 'pending').length;
  const n = (S.co.bookings || []).filter(b => b.student_id === p.id).length + (S.co.members || []).filter(m => m.student_id === p.id).length;
  return {bal: balanceOf(led), pend, n};
}
function studentRows(){
  const q = toLatin(S.q).toLowerCase().trim();
  const rows = (S.co.profiles || []).filter(p => !q || (fullName(p) + ' ' + (p.mobile || '')).toLowerCase().includes(q)).map(p => ({p, s: stuStats(p)}))
    .sort((a, b) => b.s.bal - a.s.bal || fullName(a.p).localeCompare(fullName(b.p), 'fa'));
  if (!rows.length) return '<p class="empty">' + t('s_none') + '</p>';
  return '<div class="list">' + rows.map(({p, s}) => '<button class="item" data-act="stu" data-id="' + esc(p.id) + '"><div><div class="t">' + esc(fullName(p)) + '</div><div class="muted small">' + t('s_classes') + ': ' + nfmt(s.n) + '</div>' +
    (s.pend ? '<span class="tag warn">' + t('pending_tag') + '</span>' : '') + '</div>' +
    (s.bal > 0 ? '<span class="amt debt">' + nfmt(s.bal) + '</span>' : '<span class="tag ok">' + t('paid_off') + '</span>') + '</button>').join('') + '</div>';
}
function coStudents(){
  if (S.detail) return coDetail();
  let total = 0, debtors = 0;
  (S.co.profiles || []).forEach(p => { const b = stuStats(p).bal; if (b > 0){ total += b; debtors++; } });
  return '<div class="bal ' + (total > 0 ? 'debt' : 'ok') + '"><span>' + t('total_debt') + ' (' + nfmt(debtors) + ' ' + t('debtors') + ')</span><span class="big num">' + nfmt(total) + '</span></div>' +
    '<div class="card"><input class="inp" id="q" type="search" placeholder="' + t('s_search') + '" value="' + esc(S.q) + '" autocomplete="off"><div id="slist">' + studentRows() + '</div></div>';
}
function weeklyOf(id){
  let w = 0;
  (S.co.bookings || []).filter(b => b.student_id === id).forEach(b => w += priceAt(b.hour));
  (S.co.members || []).filter(m => m.student_id === id).forEach(m => { const g = groupById(m.group_id); if (g) w += Number(g.price); });
  return w;
}
function coDetail(){
  const p = (S.co.profiles || []).find(x => x.id === S.detail); if (!p) return '';
  const led = (S.co.ledger || []).filter(x => x.student_id === p.id), bal = balanceOf(led);
  const bs = (S.co.bookings || []).filter(b => b.student_id === p.id), ms = (S.co.members || []).filter(m => m.student_id === p.id);
  const rc = (S.co.receipts || []).filter(r => r.student_id === p.id);
  const tel = n => n ? '<a href="tel:' + esc(n) + '" dir="ltr">' + esc(n) + '</a>' : '—';
  let h = '<div class="row between"><button class="btn sm" data-act="stu-back">‹ ' + t('back') + '</button><h2>' + esc(fullName(p)) + '</h2></div>' + balBox(bal, true);
  h += '<div class="card"><div class="row between"><span class="muted">' + t('age_lbl') + '</span><b>' + (p.age != null ? nfmt(p.age) : '—') + '</b></div>' +
    '<div class="row between"><span class="muted">' + t('gender_lbl') + '</span><b>' + (p.gender ? t(p.gender) : '—') + '</b></div>' +
    '<div class="row between"><span class="muted">' + t('mobile') + '</span><b>' + tel(p.mobile) + '</b></div>' +
    '<div class="row between"><span class="muted">' + t('parent_mobile') + '</span><b>' + tel(p.parent_mobile) + '</b></div></div>';
  const pend = rc.filter(r => r.status === 'pending');
  if (pend.length){
    h += '<div class="card"><h3>' + t('pending_receipts') + '</h3>' + pend.map(r => {
      const def = bal > 0 ? bal : (r.claimed_amount || 0);
      return '<div class="form" style="border-top:1px solid var(--line);padding-top:10px"><img class="receipt-img" data-path="' + esc(r.path) + '" alt=""><div class="muted small">' + fmtDate(new Date(r.created_at)) +
        (r.claimed_amount ? ' · ' + t('claimed_lbl') + ': ' + nfmt(r.claimed_amount) : '') + (r.note ? ' · ' + esc(r.note) : '') + '</div>' +
        '<label for="ra_' + esc(r.id) + '">' + t('paid_amount') + '</label><input class="inp amt-in" id="ra_' + esc(r.id) + '" inputmode="numeric" value="' + (def ? nfmt(def) : '') + '">' +
        '<p class="muted small">' + t('paid_hint') + '</p><div class="row"><button class="btn primary grow" data-act="accept" data-id="' + esc(r.id) + '">' + t('accept') + '</button><button class="btn danger" data-act="reject" data-id="' + esc(r.id) + '">' + t('reject') + '</button></div></div>';
    }).join('') + '</div>';
  }
  const stSk = (S.co.skips || []).filter(s => s.by === 'student' && bs.some(b => b.id === s.booking_id) && skipStatus(s) === 'makeup' && !makeupUsed(s, S.co.extras_all || S.pub.extras));
  if (stSk.length){
    h += '<div class="card"><h3>' + t('mk_title') + '</h3><p class="notice">' + t('mk_help', {n: nfmt(stSk.length)}) + '</p><form class="form" data-form="makeup" data-skip="' + esc(mkKey(stSk[0])) + '">' +
      '<div class="two"><div><label for="mk_d">' + t('ex_date') + '</label><input class="inp" id="mk_d" name="date" type="date" min="' + todayIso() + '" value="' + todayIso() + '"></div><div><label for="mk_h">' + t('ex_hour') + '</label><select class="inp" id="mk_h" name="hour">' + hourOptions(16) + '</select></div></div>' +
      '<p class="err" id="formerr" role="alert"></p><button class="btn primary block" type="submit">' + t('mk_create') + '</button></form></div>';
  }
  h += '<div class="card"><h3>' + t('s_classes') + '</h3>';
  if (!bs.length && !ms.length) h += '<p class="muted">' + t('no_classes') + '</p>';
  else h += '<div class="list">' + bs.sort((a, b) => a.weekday - b.weekday || a.hour - b.hour).map(b => '<div class="item"><div><div class="t">' + DAYS[S.lang][b.weekday] + ' ' + hh(b.hour) + '–' + hh(b.hour + 1) + '</div><div class="muted small">' + nfmt(priceAt(b.hour)) + ' ' + t('toman') + '</div></div><button class="btn sm danger" data-act="co-cancel-b" data-id="' + esc(b.id) + '">' + t('cancel_class') + '</button></div>').join('') +
    ms.map(m => { const g = groupById(m.group_id); return g ? '<div class="item"><div><div class="t">' + esc(g.title) + '</div><div class="muted small">' + groupWhen(g) + ' · ' + nfmt(g.price) + ' ' + t('toman') + '</div></div><button class="btn sm danger" data-act="co-rm-member" data-id="' + esc(g.id) + '">' + t('cancel_class') + '</button></div>' : ''; }).join('') + '</div>' +
    '<div class="row between"><span class="muted">' + t('weekly_cost') + '</span><b class="num">' + nfmt(weeklyOf(p.id)) + ' ' + t('toman') + '</b></div>' +
    '<button class="btn block" data-act="monthly">' + t('monthly_charge') + ' (' + nfmt(weeklyOf(p.id) * termWeeks()) + ')</button>';
  h += '</div>';
  h += '<div class="card"><h3>' + t('add_charge') + ' / ' + t('add_payment') + '</h3><form class="form" data-form="ledger"><label for="ld_t">' + t('title_lbl') + '</label><input class="inp" id="ld_t" name="title" maxlength="80">' +
    '<label for="ld_a">' + t('amount') + '</label><input class="inp amt-in" id="ld_a" name="amount" inputmode="numeric"><p class="err" id="formerr" role="alert"></p>' +
    '<div class="row"><button class="btn danger grow" type="submit" name="kind" value="charge">' + t('add_charge') + '</button><button class="btn primary grow" type="submit" name="kind" value="payment">' + t('add_payment') + '</button></div></form></div>';
  h += '<div class="card"><h3>' + t('history') + '</h3>' + (led.length ? '<div class="list">' + led.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map(x =>
    '<div class="item" style="grid-template-columns:minmax(0,1fr) auto auto"><div><div class="t">' + esc(ltitle(x)) + '</div><div class="muted small">' + fmtDate(new Date(x.created_at)) + '</div></div><span class="amt ' + (x.kind === 'charge' ? 'debt' : 'ok') + '">' + (x.kind === 'charge' ? '+' : '−') + nfmt(x.amount) + '</span>' +
    '<button class="btn sm" data-act="ld-del" data-id="' + esc(x.id) + '" aria-label="' + t('del') + '">✕</button></div>').join('') + '</div>' : '<p class="muted">' + t('ledger_empty') + '</p>') + '</div>';
  const old = rc.filter(r => r.status !== 'pending');
  if (old.length) h += '<div class="card"><h3>' + t('receipts') + '</h3>' + receiptList(old) + '</div>';
  return h;
}
function bandRow(b){
  return '<div class="row band"><input class="inp" style="flex:1 1 70px;min-width:0" data-f="from" inputmode="numeric" aria-label="' + t('band_from') + '" placeholder="' + t('band_from') + '" value="' + (b ? nfmt(b.from) : '') + '">' +
    '<input class="inp" style="flex:1 1 70px;min-width:0" data-f="to" inputmode="numeric" aria-label="' + t('band_to') + '" placeholder="' + t('band_to') + '" value="' + (b ? nfmt(b.to) : '') + '">' +
    '<input class="inp amt-in" style="flex:2 1 120px;min-width:0" data-f="price" inputmode="numeric" aria-label="' + t('band_price') + '" placeholder="' + t('band_price') + '" value="' + (b && b.price ? nfmt(b.price) : '') + '">' +
    '<button class="btn sm danger" type="button" data-act="rm-band" aria-label="' + t('del') + '">✕</button></div>';
}
function coSettings(){
  const st = S.pub.settings, pv = S.co.priv || {};
  return '<div class="card"><form class="form" data-form="settings">' +
    '<label for="s_n">' + t('set_coach') + '</label><input class="inp" id="s_n" name="coach_name" maxlength="60" value="' + esc(st.coach_name) + '">' +
    '<label for="s_b">' + t('set_bio') + '</label><textarea class="inp" id="s_b" name="bio" rows="3" maxlength="400">' + esc(st.bio) + '</textarea>' +
    '<label for="s_p">' + t('set_phone') + '</label><input class="inp" id="s_p" name="phone" type="tel" dir="ltr" maxlength="20" value="' + esc(st.phone) + '">' +
    '<label for="s_c">' + t('set_card') + '</label><input class="inp" id="s_c" name="card_number" dir="ltr" inputmode="numeric" maxlength="24" value="' + esc(pv.card_number || '') + '">' +
    '<label for="s_h">' + t('set_holder') + '</label><input class="inp" id="s_h" name="card_holder" maxlength="60" value="' + esc(pv.card_holder || '') + '"><p class="muted small">' + t('set_card_note') + '</p>' +
    '<h3 style="margin-top:12px">' + t('set_bands') + '</h3><div id="bands" class="form">' + (st.bands || []).map(bandRow).join('') + '</div>' +
    '<button class="btn sm" type="button" data-act="add-band" style="align-self:flex-start">+ ' + t('add_band') + '</button>' +
    '<button class="btn primary block" type="submit" style="margin-top:12px">' + t('save') + '</button></form></div>';
}

/* ---------- modals ---------- */
function viewModal(){
  const m = S.modal; if (!m) return '';
  let b = '';
  if (m.type === 'book'){
    b = '<h3>' + t('book_q', {day: DAYS[S.lang][m.wd], hour: hh(m.h)}) + '</h3><p>' + t('book_price', {price: nfmt(priceAt(m.h))}) + '</p><p class="muted small">' + t('book_note') + '</p>' +
      '<div class="row"><button class="btn primary grow" data-act="do-book">' + t('confirm') + '</button><button class="btn" data-act="close-modal">' + t('cancel') + '</button></div>';
  } else if (m.type === 'cancel'){
    const bk = (S.mine.bookings || []).find(x => x.weekday === m.wd && x.hour === m.h);
    b = '<h3>' + t('cancel_q') + '</h3><p>' + DAYS[S.lang][m.wd] + ' ' + hh(m.h) + '</p>' +
      (bk && bk.charged ? '<p class="banner">' + t('locked') + '</p><button class="btn block" data-act="close-modal">' + t('close') + '</button>' :
      '<div class="row"><button class="btn danger grow" data-act="do-cancel" data-id="' + esc(bk ? bk.id : '') + '">' + t('cancel_class') + '</button><button class="btn" data-act="close-modal">' + t('close') + '</button></div>');
  } else if (m.type === 'group'){
    const g = groupById(m.id);
    b = g ? groupCard(g, S.user && !S.user.isCoach ? 'student' : 'none') + '<button class="btn block" data-act="close-modal">' + t('close') + '</button>' : '';
  } else if (m.type === 'extra'){
    const e = (S.pub.extras || []).find(x => x.id === m.id);
    b = e ? '<h3>' + t('ex_book_q') + '</h3><p>' + extraWhen(e) + '</p><p><b>' + nfmt(e.price) + ' ' + t('toman') + '</b> · ' + t('ex_one') + '</p><p class="muted small">' + t('ex_charge_now') + '</p>' +
      '<div class="row"><button class="btn primary grow" data-act="ex-book" data-id="' + esc(e.id) + '">' + t('confirm') + '</button><button class="btn" data-act="close-modal">' + t('cancel') + '</button></div>' : '';
  } else if (m.type === 'skpick'){
    const bk = (S.mine.bookings || []).find(x => x.id === m.bid), nh = S.pub.settings.cancel_hours == null ? 12 : S.pub.settings.cancel_hours, opts = [];
    if (bk){
      const d0 = new Date(); d0.setHours(12, 0, 0, 0);
      for (let i = 0; i < 56 && opts.length < 6; i++){
        const d = addDays(d0, i), iso = isoOf(d);
        if (persDay(d) !== bk.weekday || dtOf(iso, bk.hour) - Date.now() < nh * 36e5) continue;
        if ((S.mine.skips || []).some(s => s.booking_id === bk.id && s.date === iso) || closedOn(iso)) continue;
        opts.push(iso);
      }
    }
    b = '<h3>' + t('sk_pick_q') + '</h3><p class="muted small">' + t('sk_rule') + ' ' + t('sk_notice', {n: nfmt(nh)}) + '</p>' +
      (opts.length ? '<div class="list">' + opts.map(iso => '<button class="item" data-act="sk-do" data-bid="' + esc(bk.id) + '" data-iso="' + iso + '"><span class="t">' + fmtDate(isoToDate(iso), {weekday: 'long', month: 'long', day: 'numeric'}) + ' · ' + hh(bk.hour) + '</span><span class="tag warn">' + t('cancel_class') + '</span></button>').join('') + '</div>' : '<p class="muted">' + t('sk_none') + '</p>') +
      '<button class="btn block" data-act="close-modal">' + t('close') + '</button>';
  } else if (m.type === 'cancelday'){
    b = '<h3>' + t('cancel_day_q') + '</h3><p>' + fmtDate(isoToDate(m.iso), {weekday: 'long', month: 'long', day: 'numeric'}) + '</p><p class="muted small">' + t('cancel_day_help') + '</p>' +
      '<form class="form" data-form="cancelday"><label for="cd_n">' + t('cancel_day_note') + '</label><input class="inp" id="cd_n" name="note" maxlength="120">' +
      '<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" name="credit" checked> ' + t('cancel_day_credit') + '</label>' +
      '<p class="err" id="formerr" role="alert"></p><div class="row"><button class="btn danger grow" type="submit">' + t('cancel_day_go') + '</button><button class="btn" type="button" data-act="close-modal">' + t('close') + '</button></div></form>';
  } else if (m.type === 'offer'){
    b = '<h3>' + t('offer_q') + '</h3><p>' + fmtDate(isoToDate(m.iso), {weekday: 'long', month: 'long', day: 'numeric'}) + ' · ' + hh(m.start) + '–' + hh(m.end) + '</p>' +
      '<form class="form" data-form="offer"><label for="o_p">' + t('offer_price') + '</label><input class="inp amt-in" id="o_p" name="price" inputmode="numeric" value="' + esc(nfmt(priceAt(m.start))) + '">' +
      '<label for="o_n">' + t('ex_note') + '</label><input class="inp" id="o_n" name="note" maxlength="120">' +
      '<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" name="credit" checked> ' + t('offer_credit') + '</label>' +
      '<p class="err" id="formerr" role="alert"></p><div class="row"><button class="btn primary grow" type="submit">' + t('offer_go') + '</button><button class="btn" type="button" data-act="close-modal">' + t('close') + '</button></div></form>';
  } else if (m.type === 'ics'){
    b = '<h3>' + t('reminder') + '</h3><pre class="ics">' + esc(m.text) + '</pre><p class="muted small">' + t('ics_preview') + '</p><button class="btn block" data-act="close-modal">' + t('close') + '</button>';
  }
  return '<div class="modal-bg" data-act="bg-close"><div class="modal" role="dialog" aria-modal="true">' + b + '</div></div>';
}

/* ---------- render ---------- */
const urlCache = new Map();
function hydrateImages(){
  document.querySelectorAll('img[data-path]').forEach(async im => {
    const p = im.dataset.path;
    try {
      if (!urlCache.has(p)) urlCache.set(p, API.receiptUrl(p));
      const u = await urlCache.get(p);
      if (u) im.src = u;
    } catch (e) { urlCache.delete(p); }
  });
}
function render(){
  const root = $('#app'); if (!root) return;
  const y = window.scrollY;
  document.documentElement.setAttribute('data-theme', S.theme);
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === 'fa' ? 'rtl' : 'ltr';
  const nm = S.pub && S.pub.settings && S.pub.settings.coach_name;
  document.title = (nm ? nm + ' · ' : '') + t('site');
  let body;
  if (S.loading || !S.pub) body = '<p class="empty">' + t('loading') + '</p>';
  else if (S.route === 'login') body = viewLogin();
  else if (S.route === 'register') body = viewRegister();
  else if (S.route === 'app'){
    if (!S.user) body = viewLogin();
    else if (S.user.isCoach) body = S.co ? viewCoach() : '<p class="empty">' + t('loading') + '</p>';
    else body = S.mine ? viewStudent() : '<p class="empty">' + t('loading') + '</p>';
  } else body = viewHome();
  root.innerHTML = '<div class="wrap">' + viewTop() + (API.isPreview ? '<p class="banner" style="margin-top:10px">' + t('demo_banner') + '</p>' : '') + body + '</div>' + viewModal();
  hydrateImages();
  window.scrollTo(0, y);
}
async function refreshData(){
  S.pub = await API.getPublic();
  if (S.user){
    if (S.user.isCoach) S.co = await API.getCoach();
    else S.mine = await API.getMine();
  }
}
async function doAct(fn, okKey){
  try { await fn(); await refreshData(); if (okKey) toast(t(okKey)); }
  catch (err){ toast(errText(err)); }
  render();
}
async function afterAuth(){
  S.user = await API.getUser(); S.co = null; S.mine = null;
  await refreshData();
  S.route = 'app'; S.tab = null; S.detail = null; S.modal = null;
  render(); window.scrollTo(0, 0);
}
function downloadText(name, text){
  const b = new Blob([text], {type: 'text/calendar;charset=utf-8'}), u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
function arm(el, fn){
  if (el.dataset.armed){ fn(); return; }
  el.dataset.armed = '1'; el.dataset.orig = el.textContent; el.textContent = '?';
  setTimeout(() => { if (el.isConnected && el.dataset.armed){ delete el.dataset.armed; el.textContent = el.dataset.orig; } }, 2500);
}

/* ---------- clicks ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  if (a === 'bg-close'){ if (e.target === el){ S.modal = null; render(); } return; }
  if (el.tagName === 'A') e.preventDefault();
  switch (a){
    case 'theme': S.theme = S.theme === 'dark' ? 'light' : 'dark'; store.set('theme', S.theme); render(); break;
    case 'lang': S.lang = d.v; store.set('lang', S.lang); render(); break;
    case 'cal': S.cal = d.v; store.set('cal', S.cal); render(); break;
    case 'nav': S.route = d.route; S.modal = null; S.detail = null; render(); window.scrollTo(0, 0); break;
    case 'logout': try { await API.signOut(); } catch (x) {} S.user = null; S.mine = null; S.co = null; S.route = 'home'; S.tab = null; render(); window.scrollTo(0, 0); break;
    case 'tab': S.tab = d.tab; S.detail = null; S.gEdit = null; render(); break;
    case 'cell-free': S.modal = {type: 'book', wd: +d.wd, h: +d.h}; render(); break;
    case 'cell-mine': S.modal = {type: 'cancel', wd: +d.wd, h: +d.h}; render(); break;
    case 'cell-group': S.modal = {type: 'group', id: d.ref}; render(); break;
    case 'ask-cancel': {
      const b = (S.mine.bookings || []).find(x => x.id === d.id);
      if (b){ S.modal = {type: 'cancel', wd: b.weekday, h: b.hour}; render(); }
      break;
    }
    case 'close-modal': S.modal = null; render(); break;
    case 'do-book': { const m = S.modal; S.modal = null; await doAct(() => API.book(m.wd, m.h), 'booked'); break; }
    case 'do-cancel': S.modal = null; await doAct(() => API.cancelBooking(d.id), 'canceled'); break;
    case 'join': S.modal = null; await doAct(() => API.joinGroup(d.id), 'booked'); break;
    case 'leave': S.modal = null; await doAct(() => API.leaveGroup(d.id), 'canceled'); break;
    case 'finalize': await doAct(() => API.finalize(), 'finalized'); break;
    case 'ics': {
      const skx = (S.mine.skips || []);
      const items = myClasses().map(c => ({uid: c.kind + c.id + c.wd + c.start, wd: c.wd, start: c.start, dur: c.dur, ex: skx.filter(x => c.kind === 'private' ? x.booking_id === c.id : x.group_id === c.id).map(x => x.date), title: (c.kind === 'group' ? c.title : t('site')) + ' – ' + (S.pub.settings.coach_name || '')}));
      const text = buildIcs(items, S.pub.settings);
      if (API.isPreview){ S.modal = {type: 'ics', text}; render(); } else downloadText('classes.ics', text);
      break;
    }
    case 'ex-ask': S.modal = {type: 'extra', id: d.id}; render(); break;
    case 'ex-book': S.modal = null; await doAct(() => API.bookExtra(d.id), 'booked'); S.tab = 'mine'; render(); window.scrollTo(0, 0); break;
    case 'ex-del': arm(el, () => doAct(() => API.deleteExtra(d.id), 'g_deleted')); break;
    case 'offer-ask': S.modal = {type: 'offer', ids: d.ids.split(','), iso: d.iso, start: +d.start, end: +d.end}; render(); break;
    case 'ics-extra': {
      const e = (S.mine.extras || []).find(x => x.id === d.id); if (!e) break;
      const text = buildIcs([{uid: 'x' + e.id, date: e.date, start: e.hour, dur: 1, title: t('extracharge') + ' – ' + (S.pub.settings.coach_name || '')}], S.pub.settings);
      if (API.isPreview){ S.modal = {type: 'ics', text}; render(); } else downloadText('session.ics', text);
      break;
    }
    case 'day-ask': S.modal = {type: 'cancelday', iso: d.iso}; render(); break;
    case 'day-restore': arm(el, () => doAct(() => API.restoreDay(d.iso), 'saved')); break;
    case 'sess-restore': await doAct(() => API.restoreSession(d.bid, d.iso), 'saved'); break;
    case 'sk-ask': S.modal = {type: 'skpick', bid: d.id}; render(); break;
    case 'sk-do': S.modal = null; await doAct(() => API.cancelMySession(d.bid, d.iso), 'saved'); break;
    case 'sk-withdraw': await doAct(() => API.restoreMySession(d.bid, d.iso), 'saved'); break;
    case 'ex-price': { const pr = parseAmt(($('#xp_' + d.id) || {}).value); if (!pr){ toast(t('err_bad_amount')); break; } await doAct(() => API.updateExtraPrice(d.id, pr), 'saved'); break; }
    case 'copy': try { await navigator.clipboard.writeText(d.text); toast(t('copied')); } catch (x) { toast(d.text); } break;
    case 'tog': { const on = !slotSet().has(d.wd + ':' + d.h); await doAct(() => API.toggleSlot(+d.wd, +d.h, on)); break; }
    case 'wk': S.weekOff = d.v === '0' ? 0 : S.weekOff + Number(d.v); render(); break;
    case 'g-edit': S.gEdit = d.id; render(); window.scrollTo(0, 0); break;
    case 'g-cancel': S.gEdit = null; render(); break;
    case 'g-del': arm(el, () => { S.gEdit = null; doAct(() => API.deleteGroup(d.id), 'g_deleted'); }); break;
    case 'stu': S.detail = d.id; render(); window.scrollTo(0, 0); break;
    case 'stu-back': S.detail = null; render(); break;
    case 'monthly': {
      const w = weeklyOf(S.detail);
      if (!w){ toast(t('price_unset')); break; }
      await doAct(() => API.addLedger({student_id: S.detail, kind: 'charge', title: '#tuitionterm', amount: w * termWeeks()}), 'saved'); break;
    }
    case 'accept': { const amt = parseAmt(($('#ra_' + d.id) || {}).value); if (!amt){ toast(t('err_bad_amount')); break; } await doAct(() => API.decideReceipt(d.id, amt, true), 'saved'); break; }
    case 'reject': await doAct(() => API.decideReceipt(d.id, null, false), 'saved'); break;
    case 'co-cancel-b': await doAct(() => API.cancelBookingCoach(d.id), 'canceled'); break;
    case 'co-rm-member': await doAct(() => API.removeMember(d.id, S.detail), 'canceled'); break;
    case 'ld-del': arm(el, () => doAct(() => API.deleteLedger(d.id), 'g_deleted')); break;
    case 'add-band': $('#bands').insertAdjacentHTML('beforeend', bandRow(null)); break;
    case 'rm-band': el.closest('.band').remove(); break;
  }
});

/* ---------- forms ---------- */
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const k = f.dataset.form, fd = new FormData(f);
  const err = m => { const x = $('#formerr'); if (x) x.textContent = m; };
  const v = n => String(fd.get(n) || '').trim();
  try {
    if (k === 'login'){
      if (!v('email') || !v('password')) return err(t('err_required'));
      await API.signIn(v('email'), v('password')); await afterAuth();
    } else if (k === 'register'){
      const age = parseIntOr(v('age'), NaN);
      if (!v('first_name') || !v('last_name') || isNaN(age) || !v('mobile') || !v('email') || v('password').length < 6) return err(t('err_required'));
      if (age < 18 && !v('parent_mobile')) return err(t('err_parent'));
      const r = await API.signUp({first_name: v('first_name'), last_name: v('last_name'), age, gender: v('gender'), mobile: toLatin(v('mobile')), parent_mobile: toLatin(v('parent_mobile')), email: v('email'), password: v('password')});
      if (r && r.needsConfirm){ S.route = 'login'; render(); toast(t('err_confirm_email')); } else await afterAuth();
    } else if (k === 'receipt'){
      const file = fd.get('file');
      if (!file || !file.size) return err(t('err_required'));
      const blob = await compressImage(file);
      await API.uploadReceipt(blob, parseAmt(v('claimed')) || null, v('note'));
      await refreshData(); render(); toast(t('sent'));
    } else if (k === 'group'){
      const start = +v('start_hour'), dur = +v('duration');
      if (!v('title') || start + dur > 24) return err(t('err_required'));
      await API.saveGroup({id: f.dataset.id || null, title: v('title'), weekday: +v('weekday'), start_hour: start, duration: dur, price: parseAmt(v('price')), capacity: parseIntOr(v('capacity'), 0) || null, note: v('note')});
      S.gEdit = null; await refreshData(); render(); toast(t('saved'));
    } else if (k === 'extra'){
      const price = parseAmt(v('price')); if (!v('date') || !price) return err(t('err_bad_amount'));
      await API.offerExtra({date: v('date'), hour: +v('hour'), price, note: v('note')});
      await refreshData(); render(); toast(t('saved'));
    } else if (k === 'makeup'){
      await API.assignMakeup({student_id: S.detail, date: v('date'), hour: +v('hour'), skip: f.dataset.skip});
      await refreshData(); render(); toast(t('saved'));
    } else if (k === 'cancelday'){
      const m = S.modal; await API.cancelDay(m.iso, v('note'), !!fd.get('credit'));
      S.modal = null; await refreshData(); render(); toast(t('saved'));
    } else if (k === 'offer'){
      const price = parseAmt(v('price')), m = S.modal; if (!price) return err(t('err_bad_amount'));
      const credit = !!fd.get('credit');
      for (let i = 0; i < m.ids.length; i++) await API.offerExtra({date: m.iso, hour: m.start + i, price, note: v('note'), booking_id: m.ids[i], credit});
      S.modal = null; await refreshData(); render(); toast(t('saved'));
    } else if (k === 'term'){
      const wk = parseIntOr(v('term_weeks'), 12);
      await API.saveSettings({pub: {term_start: v('term_start') || null, term_weeks: Math.min(60, Math.max(1, wk)), cancel_hours: Math.min(168, Math.max(0, parseIntOr(v('cancel_hours'), 12)))}});
      await refreshData(); render(); toast(t('saved'));
    } else if (k === 'settings'){
      const bands = [];
      for (const r of document.querySelectorAll('#bands .band')){
        const from = parseIntOr(r.querySelector('[data-f="from"]').value, NaN), to = parseIntOr(r.querySelector('[data-f="to"]').value, NaN), price = parseAmt(r.querySelector('[data-f="price"]').value);
        if (isNaN(from) && isNaN(to) && !price) continue;
        if (isNaN(from) || isNaN(to) || from >= to || to > 24) return toast(t('err_required'));
        bands.push({from, to, price});
      }
      await API.saveSettings({pub: {coach_name: v('coach_name'), bio: v('bio'), phone: toLatin(v('phone')), bands}, priv: {card_number: toLatin(v('card_number')), card_holder: v('card_holder')}});
      await refreshData(); render(); toast(t('saved'));
    } else if (k === 'ledger'){
      const amount = parseAmt(v('amount')), kind = (e.submitter && e.submitter.value) || 'charge';
      if (!amount) return err(t('err_bad_amount'));
      await API.addLedger({student_id: S.detail, kind, title: v('title') || (kind === 'charge' ? t('charge') : t('payment')), amount});
      await refreshData(); render(); toast(t('saved'));
    }
  } catch (x){
    const m = errText(x);
    if ($('#formerr')) err(m); else toast(m);
  }
});

/* ---------- live inputs ---------- */
document.addEventListener('input', e => {
  const el = e.target;
  if (el.classList && el.classList.contains('amt-in')){ const n = parseAmt(el.value); el.value = n ? nfmt(n) : ''; }
  else if (el.id === 'q'){ S.q = el.value; const l = $('#slist'); if (l) l.innerHTML = studentRows(); }
  else if (el.id === 'r_age'){ const a = parseIntOr(el.value, NaN), h = $('#pm_hint'); if (h) h.textContent = '(' + (!isNaN(a) && a < 18 ? t('parent_req') : t('parent_opt')) + ')'; }
  else if (el.id === 't_s'){ const p = $('#t_prev'); if (p) p.textContent = el.value ? fmtDate(isoToDate(el.value)) : ''; }
});

/* ---------- start ---------- */
async function start(route){
  S.loading = true; render();
  try {
    S.user = await API.getUser(); S.co = null; S.mine = null;
    await refreshData();
  } catch (x){ toast(errText(x)); }
  S.loading = false;
  S.route = route || (S.user ? 'app' : 'home'); S.tab = null; S.detail = null; S.modal = null;
  render();
}
window.App = {reload: start};
start();
})();
