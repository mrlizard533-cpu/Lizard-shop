const tg = window.Telegram?.WebApp;
const API_URL = "https://zyrkhebnfyuvnxlqfklu.supabase.co/functions/v1/telegram-api";
let balance = 0;
let orders = [];
let cardNumber = "";

if (tg) { tg.ready(); tg.expand(); }
function $(id){return document.getElementById(id)}
function money(n){return new Intl.NumberFormat("fa-IR").format(Number(n)||0)+" تومان"}
function updateBalance(){ $("balance").textContent=money(balance); $("profileBalance").textContent=money(balance); }
function openModal(html){$("modalContent").innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
async function api(data){
  if(!tg?.initData) throw new Error("فروشگاه را از داخل Telegram باز کنید.");
  const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,initData:tg.initData})});
  const j=await r.json().catch(()=>({})); if(!r.ok||!j.ok) throw new Error(j.error||"خطای سرور"); return j;
}
async function initUser(){
  const u=tg?.initDataUnsafe?.user; if(!u){$('hello').textContent="Lizard Shop — Telegram";return}
  $('hello').textContent=`سلام ${u.first_name||"دوست من"} 👋`; $('name').textContent=u.first_name||"-"; $('username').textContent=u.username?"@"+u.username:"بدون username";
  try{const j=await api({action:"init"}); balance=Number(j.wallet.balance||0); cardNumber=j.payment?.card_number||""; updateBalance();}
  catch(e){console.error(e);$('hello').textContent="ورود امن ناموفق بود ❌";}
}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.page).classList.add('active');if(b.dataset.page==='orders')loadOrders()});
const products={stars:[["50 Stars",50000],["100 Stars",100000],["250 Stars",250000],["500 Stars",500000],["1000 Stars",1000000]],gifts:[["Telegram Gift",100000]],premium:[["Premium 1 ماهه",250000]],games:[["CP / UC / جم",100000]]};
function openProduct(type){const titles={stars:"⭐ Telegram Stars",gifts:"🎁 Telegram Gifts",premium:"👑 Telegram Premium",games:"🎮 جم / UC / CP"};openModal(`<h2>${titles[type]}</h2><p>محصول را انتخاب کنید:</p>`+products[type].map((x,i)=>`<button class="option" onclick="selectProduct('${type}',${i})">${x[0]} — ${money(x[1])}</button>`).join(''))}
function selectProduct(type,i){const [title,price]=products[type][i];openModal(`<h2>📦 ${title}</h2><p>برای چه کسی است؟</p><button class="option" onclick="checkout('${escapeAttr(title)}','')">👤 برای خودم</button><button class="option" onclick="recipient('${escapeAttr(title)}')">👥 برای شخص دیگر</button>`)}
function recipient(title){openModal(`<h2>👥 گیرنده</h2><input id="recipient" class="input" maxlength="64" placeholder="@username"><button class="primary" onclick="checkout('${escapeAttr(title)}',document.getElementById('recipient').value.trim())">ادامه</button>`)}
function checkout(title,recipient){if(recipient===undefined)recipient="";if(recipient===""){const u=tg?.initDataUnsafe?.user;recipient=u?.username?("@"+u.username):"خودم"}const item=Object.values(products).flat().find(x=>x[0]===title);if(!item){return openModal('<h2>❌ محصول نامعتبر</h2>')}const price=item[1];if(balance<price){openModal(`<h2>❌ موجودی کافی نیست</h2><p>موجودی: <b>${money(balance)}</b></p><button class="primary" onclick="showTopup()">➕ افزایش موجودی</button>`);return}openModal(`<h2>🧾 تأیید سفارش</h2><div class="card"><p>محصول: <b>${escapeHtml(title)}</b></p><p>گیرنده: <b>${escapeHtml(recipient)}</b></p><p>قیمت: <b>${money(price)}</b></p></div><button class="primary" onclick="placeOrder('${escapeAttr(title)}','${escapeAttr(recipient)}')">🛒 پرداخت و ثبت سفارش</button>`)}
async function placeOrder(title,recipient){try{openModal('<h2>⏳ در حال ثبت سفارش...</h2>');const j=await api({action:'create_order',product:title,recipient});balance=Number(j.wallet.balance);updateBalance();openModal(`<h2>✅ سفارش ثبت شد</h2><p>شماره سفارش: <b>${escapeHtml(j.order.id)}</b></p><p>وضعیت: 🟡 ${escapeHtml(j.order.status)}</p><p>موجودی جدید: <b>${money(balance)}</b></p><button class="primary" onclick="closeModal();loadOrders()">باشه</button>`)}catch(e){openModal(`<h2>❌ سفارش ناموفق</h2><p>${escapeHtml(e.message)}</p><button class="primary" onclick="closeModal()">بستن</button>`)} }
async function loadOrders(){try{const j=await api({action:'orders'});orders=j.orders||[];renderOrders()}catch(e){$('ordersList').textContent='خطا در دریافت سفارش‌ها.'}}
function renderOrders(){if(!orders.length){$('ordersList').textContent='هنوز سفارشی ثبت نکرده‌اید.';return}$('ordersList').innerHTML=orders.map(o=>`<div class="card" style="margin-bottom:10px"><b>${escapeHtml(o.product)}</b><p>${escapeHtml(o.id)}</p><p>${money(o.price)}</p><p>گیرنده: ${escapeHtml(o.recipient)}</p><p>🟡 ${escapeHtml(o.status)}</p></div>`).join('')}
function showTopup(){const card=cardNumber||'در حال دریافت شماره کارت...';openModal(`<h2>➕ افزایش موجودی</h2><p>مبلغ انتقال را وارد کنید و سپس تصویر رسید را انتخاب کنید.</p><div class="card"><b>💳 شماره کارت</b><p dir="ltr">${escapeHtml(card)}</p></div><input id="topupAmount" class="input" type="number" min="1000" placeholder="مبلغ به تومان"><input id="receipt" class="input" type="file" accept="image/*"><p class="small">رسید برای بررسی به ادمین فروشگاه ارسال می‌شود. افزایش موجودی فقط پس از تأیید ادمین انجام می‌شود.</p><button class="primary" onclick="submitTopup()">📤 ارسال رسید</button>`)}
async function submitTopup(){const amount=Number($('topupAmount').value),file=$('receipt').files[0];if(!Number.isSafeInteger(amount)||amount<=0)return alert('مبلغ معتبر وارد کنید.');if(!file)return alert('تصویر رسید را انتخاب کنید.');if(file.size>8*1024*1024)return alert('حجم رسید باید کمتر از ۸ مگابایت باشد.');try{const fd=new FormData();fd.append('action','create_topup');fd.append('initData',tg.initData);fd.append('amount',String(amount));fd.append('receipt',file);openModal('<h2>⏳ در حال ارسال رسید...</h2>');const r=await fetch(API_URL,{method:'POST',body:fd}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||'ارسال رسید ناموفق بود');openModal(`<h2>✅ رسید ارسال شد</h2><p>شماره درخواست: <b>${escapeHtml(j.topup.id)}</b></p><p>پس از بررسی ادمین، نتیجه از طریق ربات به شما اعلام می‌شود.</p><button class="primary" onclick="closeModal()">باشه</button>`)}catch(e){openModal(`<h2>❌ ارسال ناموفق</h2><p>${escapeHtml(e.message)}</p><button class="primary" onclick="closeModal()">بستن</button>`)} }
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function escapeAttr(s){return String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/`/g,'\\`')}
initUser();
