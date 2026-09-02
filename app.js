const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* -------------------------
   State
------------------------- */

let balance = 100000;

let orders = [];


/* -------------------------
   Helpers
------------------------- */

function money(number) {

  return new Intl.NumberFormat("fa-IR")
    .format(number) + " تومان";

}


function $(id) {

  return document.getElementById(id);

}


function updateBalance() {

  $("balance").textContent =
    money(balance);

  $("profileBalance").textContent =
    money(balance);

}


/* -------------------------
   Telegram User
------------------------- */

function initUser() {

  const user =
    tg?.initDataUnsafe?.user;

  if (!user) return;


  $("hello").textContent =
    `سلام ${user.first_name || "دوست من"} 👋`;


  $("name").textContent =
    user.first_name || "-";


  $("username").textContent =
    user.username
      ? "@" + user.username
      : "بدون username";

}


/* -------------------------
   Navigation
------------------------- */

document
  .querySelectorAll(".nav")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".nav")
        .forEach(x =>
          x.classList.remove("active")
        );


      button.classList.add("active");


      document
        .querySelectorAll(".page")
        .forEach(page =>
          page.classList.remove("active")
        );


      $(button.dataset.page)
        .classList.add("active");


      if (
        button.dataset.page === "orders"
      ) {

        renderOrders();

      }

    };

  });


/* -------------------------
   Modal
------------------------- */

function openModal(html) {

  $("modalContent").innerHTML =
    html;

  $("modal")
    .classList
    .remove("hidden");

}


function closeModal() {

  $("modal")
    .classList
    .add("hidden");

}


/* -------------------------
   Top Up
------------------------- */

function showTopup() {

  openModal(`

    <h2>➕ افزایش موجودی</h2>

    <p>
      این قسمت در نسخه 0.1 آزمایشی است.
    </p>

    <button
      class="option"
      onclick="demoTopup(100000)"
    >
      افزایش ۱۰۰٬۰۰۰ تومان
    </button>

    <button
      class="option"
      onclick="demoTopup(500000)"
    >
      افزایش ۵۰۰٬۰۰۰ تومان
    </button>

  `);

}


function demoTopup(amount) {

  balance += amount;

  updateBalance();

  closeModal();

}


/* -------------------------
   Products
------------------------- */

const products = {

  stars: [

    ["50 Stars", 50000],

    ["100 Stars", 100000],

    ["250 Stars", 250000],

    ["500 Stars", 500000],

    ["1000 Stars", 1000000]

  ],


  gifts: [

    ["Telegram Gift", 100000]

  ],


  premium: [

    ["Premium 1 ماهه", 250000]

  ],


  games: [

    ["CP / UC / جم", 100000]

  ]

};


/* -------------------------
   Product Page
------------------------- */

function openProduct(type) {

  const titles = {

    stars: "⭐ Telegram Stars",

    gifts: "🎁 Telegram Gifts",

    premium: "👑 Telegram Premium",

    games: "🎮 جم / UC / CP"

  };


  const items =
    products[type];


  let html = `

    <h2>${titles[type]}</h2>

    <p>
      محصول موردنظر را انتخاب کنید:
    </p>

  `;


  items.forEach((item, index) => {

    html += `

      <button
        class="option"
        onclick="selectProduct('${type}', ${index})"
      >

        ${item[0]}

        —

        ${money(item[1])}

      </button>

    `;

  });


  openModal(html);

}


/* -------------------------
   Recipient
------------------------- */

function selectProduct(type, index) {

  const item =
    products[type][index];

  const title =
    item[0];

  const price =
    item[1];


  openModal(`

    <h2>📦 ${title}</h2>

    <p>
      این محصول برای چه کسی است؟
    </p>

    <button
      class="option"
      onclick="checkout(
        '${title}',
        ${price},
        false
      )"
    >
      👤 برای خودم
    </button>


    <button
      class="option"
      onclick="recipient(
        '${title}',
        ${price}
      )"
    >
      👥 برای شخص دیگر
    </button>

  `);

}


/* -------------------------
   Other Recipient
------------------------- */

function recipient(title, price) {

  openModal(`

    <h2>👥 گیرنده</h2>

    <label>
      آیدی تلگرام گیرنده
    </label>

    <input
      id="recipient"
      class="input"
      placeholder="@username"
    >


    <button
      class="primary"
      onclick="
        checkout(
          '${title}',
          ${price},
          true
        )
      "
    >

      ادامه

    </button>

  `);

}


/* -------------------------
   Checkout
------------------------- */

function checkout(
  title,
  price,
  other
) {

  const recipientUsername =
    other
      ? $("recipient")?.value
      : "";


  if (
    other &&
    !recipientUsername?.trim()
  ) {

    alert(
      "آیدی گیرنده را وارد کنید."
    );

    return;

  }


  openModal(`

    <h2>
      🧾 تأیید سفارش
    </h2>


    <div class="card">

      <p>
        محصول:
        <b>${title}</b>
      </p>


      <p>
        گیرنده:
        <b>
          ${
            recipientUsername ||
            "خودم"
          }
        </b>
      </p>


      <p>
        قیمت:
        <b>
          ${money(price)}
        </b>
      </p>


      <p>
        موجودی:
        <b>
          ${money(balance)}
        </b>
      </p>

    </div>


    <button
      class="primary"
      onclick="
        placeOrder(
          '${title}',
          ${price},
          '${(
            recipientUsername ||
            "خودم"
          ).replaceAll("'", "")}'
        )
      "
    >

      🛒 پرداخت و ثبت سفارش

    </button>

  `);

}


/* -------------------------
   Place Order
------------------------- */

function placeOrder(
  title,
  price,
  recipient
) {

  if (balance < price) {

    alert(
      "موجودی کیف پول کافی نیست."
    );

    return;

  }


  balance -= price;


  const orderId =
    "ORD-" +
    Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase();


  orders.unshift({

    id: orderId,

    title: title,

    price: price,

    recipient: recipient,

    status: "در انتظار تحویل"

  });


  updateBalance();


  openModal(`

    <h2>
      ✅ سفارش ثبت شد
    </h2>


    <p>
      شماره سفارش:
      <b>${orderId}</b>
    </p>


    <p>
      وضعیت:
      🟡 در انتظار تحویل
    </p>


    <button
      class="primary"
      onclick="closeModal()"
    >

      باشه

    </button>

  `);

}


/* -------------------------
   Orders
------------------------- */

function renderOrders() {

  if (!orders.length) {

    $("ordersList").innerHTML =
      "هنوز سفارشی ثبت نشده.";

    return;

  }


  $("ordersList").innerHTML =
    orders.map(order => `

      <div
        class="card"
        style="margin-bottom:10px"
      >

        <b>
          ${order.title}
        </b>

        <p>
          ${order.id}
        </p>

        <p>
          ${money(order.price)}
        </p>

        <p>
          گیرنده:
          ${order.recipient}
        </p>

        <p>
          🟡 ${order.status}
        </p>

      </div>

    `).join("");

}


/* -------------------------
   Start
------------------------- */

initUser();

updateBalance();
