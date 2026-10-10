/* Real backend for the coaching site: talks to Supabase over plain HTTPS (fetch).
   No library is downloaded from any CDN, so nothing extra can be blocked.
   Exposes window.API, the same set of functions the screens already use. */
(function(){
'use strict';
const CFG = window.APP_CONFIG || {};
const BASE = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = CFG.SUPABASE_ANON_KEY || '';
const SKEY = 'coach_site_session_v1';

/* ---------- session (kept in this browser only) ---------- */
let sess = null;
try { sess = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { sess = null; }
function saveSess(s){
  sess = s;
  try { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch (e) {}
}
function toSession(d){
  if (!d || !d.access_token) return null;
  return {access_token: d.access_token, refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)), user: d.user || (sess && sess.user) || null};
}
function mkErr(j, status){
  const msg = (j && (j.message || j.msg || j.error_description || j.error)) || ('HTTP ' + status);
  const e = new Error(String(msg)); e.code = j && (j.code || j.error_code); e.status = status; return e;
}
async function raw(path, opt){
  opt = opt || {};
  const h = Object.assign({apikey: KEY}, opt.headers || {});
  if (opt.auth !== false) h.Authorization = 'Bearer ' + ((sess && sess.access_token) || KEY);
  if (opt.json !== undefined){ h['Content-Type'] = 'application/json'; }
  const r = await fetch(BASE + path, {method: opt.method || 'GET', headers: h, body: opt.json !== undefined ? JSON.stringify(opt.json) : opt.body});
  const text = await r.text(); let j = null;
  try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
  if (!r.ok) throw mkErr(j, r.status);
  return opt.text ? text : j;
}
let refreshing = null;
async function refresh(){
  if (!sess || !sess.refresh_token) return;
  if (!refreshing){
    refreshing = raw('/auth/v1/token?grant_type=refresh_token', {method: 'POST', auth: false, json: {refresh_token: sess.refresh_token}})
      .then(d => { saveSess(toSession(d)); })
      .catch(() => { saveSess(null); })
      .finally(() => { refreshing = null; });
  }
  await refreshing;
}
async function call(path, opt){
  if (sess && sess.expires_at && sess.expires_at - 60 < Date.now() / 1000) await refresh();
  try { return await raw(path, opt); }
  catch (e){
    if (e.status === 401 && sess){ await refresh(); return raw(path, opt); }
    throw e;
  }
}
const q = v => encodeURIComponent(v);
const rest = (path, opt) => call('/rest/v1/' + path, opt);
const rpc = (fn, args) => call('/rest/v1/rpc/' + fn, {method: 'POST', json: args || {}});
const sel = (table, query) => rest(table + '?select=*' + (query ? '&' + query : ''));
const ins = (table, row) => rest(table, {method: 'POST', json: row, headers: {Prefer: 'return=minimal'}});
const upd = (table, query, row) => rest(table + '?' + query, {method: 'PATCH', json: row, headers: {Prefer: 'return=minimal'}});
const del = (table, query) => rest(table + '?' + query, {method: 'DELETE', headers: {Prefer: 'return=minimal'}});
const uid = () => { if (!sess || !sess.user) throw new Error('not_logged_in'); return sess.user.id; };
const withBy = s => Object.assign({}, s, {by: s.canceled_by});

let coachFlag = null;
async function isCoach(){
  if (!sess) return false;
  if (coachFlag && coachFlag.id === sess.user.id) return coachFlag.v;
  const v = await rpc('is_coach') === true;
  coachFlag = {id: sess.user.id, v};
  return v;
}

window.API = {
  isPreview: false,

  /* ----- account ----- */
  async getUser(){
    if (!sess) return null;
    try {
      if (sess.expires_at - 60 < Date.now() / 1000) await refresh();
      if (!sess) return null;
      if (!sess.user){ sess.user = await raw('/auth/v1/user'); saveSess(sess); }
      return {id: sess.user.id, email: sess.user.email, isCoach: await isCoach()};
    } catch (e) {
      if (e && e.status && e.status < 500 && e.status !== 0){ saveSess(null); return null; }
      throw e;
    }
  },
  async signUp(f){
    const d = await raw('/auth/v1/signup', {method: 'POST', auth: false, json: {
      email: f.email, password: f.password,
      data: {first_name: f.first_name, last_name: f.last_name, age: String(f.age), gender: f.gender || '', mobile: f.mobile, parent_mobile: f.parent_mobile || ''}}});
    const s = toSession(d);
    if (!s) return {needsConfirm: true};
    saveSess(s); coachFlag = null;
    return {needsConfirm: false};
  },
  async signIn(email, password){
    const d = await raw('/auth/v1/token?grant_type=password', {method: 'POST', auth: false, json: {email, password}});
    saveSess(toSession(d)); coachFlag = null;
  },
  async signOut(){
    try { if (sess) await raw('/auth/v1/logout', {method: 'POST'}); } catch (e) {}
    saveSess(null); coachFlag = null;
  },

  /* ----- public data (everyone) ----- */
  async getPublic(){
    const [settings, slots, groups, occ, counts, extras, closed] = await Promise.all([
      sel('settings', 'id=eq.1'), sel('slots'), sel('groups', 'order=weekday.asc,start_hour.asc'),
      rpc('get_occupancy'), rpc('get_group_counts'), rpc('get_extras'), sel('closed_days', 'order=date.asc')]);
    const cm = {}; (counts || []).forEach(c => { cm[c.group_id] = Number(c.n); });
    return {settings: settings[0] || {}, slots, groups, occ: occ || [], counts: cm, extras: extras || [], closed};
  },

  /* ----- student ----- */
  async getMine(){
    const id = uid(), f = 'student_id=eq.' + q(id);
    const [prof, bookings, members, extras, skips, ledger, receipts, card, messages] = await Promise.all([
      sel('profiles', 'id=eq.' + q(id)), sel('bookings', f + '&order=weekday.asc,hour.asc'), sel('group_members', f),
      sel('extras', f), sel('session_skips', 'order=date.asc'), sel('ledger', f + '&order=created_at.asc'),
      sel('receipts', f + '&order=created_at.desc'), rpc('get_card_info'), sel('messages', f + '&order=created_at.asc')]);
    return {profile: prof[0] || null, bookings, members, extras, skips: (skips || []).map(withBy), ledger, receipts, messages: messages || [], card: (card && card[0]) || null};
  },
  async book(weekday, hour){ await ins('bookings', {student_id: uid(), weekday, hour}); },
  async cancelBooking(id){ await del('bookings', 'id=eq.' + q(id)); },
  async joinGroup(gid){ await ins('group_members', {group_id: gid, student_id: uid()}); },
  async leaveGroup(gid){ await del('group_members', 'group_id=eq.' + q(gid) + '&student_id=eq.' + q(uid())); },
  async finalize(){ return rpc('finalize_registration'); },
  async uploadReceipt(blob, claimed, note){
    const id = uid(), path = id + '/' + Date.now() + '.jpg';
    await call('/storage/v1/object/receipts/' + path, {method: 'POST', body: blob, headers: {'Content-Type': 'image/jpeg', 'x-upsert': 'false'}});
    await ins('receipts', {student_id: id, path, claimed_amount: claimed || null, note: note || ''});
  },
  async receiptUrl(path){
    const d = await call('/storage/v1/object/sign/receipts/' + path, {method: 'POST', json: {expiresIn: 3600}});
    const u = d && (d.signedURL || d.signedUrl);
    if (!u) return '';
    return BASE + '/storage/v1' + (u.charAt(0) === '/' ? u : '/' + u);
  },
  bookExtra(id){ return rpc('book_extra', {p_id: id}); },
  cancelMySession(bid, date){ return rpc('cancel_my_session', {p_booking: bid, p_date: date}); },
  restoreMySession(bid, date){ return rpc('restore_my_session', {p_booking: bid, p_date: date}); },

  /* ----- coach ----- */
  async getCoach(){
    const me = uid();
    const [profiles, bookings, members, ledger, receipts, skips, priv, messages] = await Promise.all([
      sel('profiles', 'order=first_name.asc'), sel('bookings'), sel('group_members'),
      sel('ledger', 'order=created_at.asc'), sel('receipts', 'order=created_at.desc'), sel('session_skips', 'order=date.asc'), sel('private_settings', 'id=eq.1'), sel('messages', 'order=created_at.asc')]);
    return {profiles: profiles.filter(p => p.id !== me), bookings, members, ledger, receipts, skips: (skips || []).map(withBy), messages: messages || [], priv: priv[0] || {}};
  },
  toggleSlot(weekday, hour, on, sport){ return rpc('set_slot', {p_weekday: weekday, p_hour: hour, p_sport: sport || 'tennis', p_on: !!on}); },
  bulkSlots(sport, weekdays, from, to, on){ return rpc('bulk_slots', {p_sport: sport || 'tennis', p_weekdays: weekdays, p_from: from, p_to: to, p_on: !!on}); },
  async saveGroup(g){
    const row = {title: g.title, sport: g.sport === 'body' ? 'body' : 'tennis', weekday: g.weekday, start_hour: g.start_hour, duration: g.duration, price: g.price || 0, capacity: g.capacity || null, note: g.note || ''};
    if (g.id) await upd('groups', 'id=eq.' + q(g.id), row); else await ins('groups', row);
  },
  async deleteGroup(id){ await del('groups', 'id=eq.' + q(id)); },
  async saveSettings(p){
    const pub = p.pub || {}, priv = p.priv || {};
    if (Object.keys(pub).length) await upd('settings', 'id=eq.1', pub);
    if (Object.keys(priv).length) await upd('private_settings', 'id=eq.1', priv);
  },
  async addLedger(x){ await ins('ledger', {student_id: x.student_id, kind: x.kind, title: x.title || '', amount: x.amount}); },
  async deleteLedger(id){ await del('ledger', 'id=eq.' + q(id)); },
  async decideReceipt(id, amount, accept){ await rpc('decide_receipt', {p_id: id, p_amount: amount, p_accept: !!accept}); },
  async cancelBookingCoach(id){ await del('bookings', 'id=eq.' + q(id)); },
  async removeMember(gid, sid){ await del('group_members', 'group_id=eq.' + q(gid) + '&student_id=eq.' + q(sid)); },
  offerExtra(x){ return rpc('offer_extra', {p_date: x.date, p_hour: x.hour, p_price: x.price, p_note: x.note || '', p_booking: x.booking_id || null, p_credit: !!x.credit, p_sport: x.sport === 'body' ? 'body' : 'tennis'}); },
  cancelDay(date, note, credit){ return rpc('cancel_day', {p_date: date, p_note: note || '', p_credit: !!credit}); },
  restoreDay(date){ return rpc('restore_day', {p_date: date}); },
  restoreSession(bid, date){ return rpc('restore_session', {p_booking: bid, p_date: date}); },
  assignMakeup(x){ return rpc('assign_makeup', {p_student: x.student_id, p_date: x.date, p_hour: x.hour, p_skip: x.skip}); },
  updateExtraPrice(id, price){ return rpc('update_extra_price', {p_id: id, p_price: price}); },
  deleteExtra(id){ return rpc('delete_extra', {p_id: id}); },

  /* ----- private chat (one student <-> coach) ----- */
  async getMessages(studentId){ return sel('messages', (studentId ? 'student_id=eq.' + q(studentId) + '&' : '') + 'order=created_at.asc'); },
  async sendMessage(studentId, body){
    const coach = await isCoach();
    await ins('messages', {student_id: coach ? studentId : uid(), sender: coach ? 'coach' : 'student', body: String(body).slice(0, 2000)});
  },
  markRead(studentId){ return rpc('mark_read', {p_student: studentId || null}); }
};
})();
