let books = [];
let cart = JSON.parse(localStorage.getItem("booknest-cart") || "[]");

const bookContainer = document.getElementById("book-container");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");

document.getElementById("year").textContent = new Date().getFullYear();

// Load the book catalogue from books.json
fetch("books.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load books.json");
    return response.json();
  })
  .then(data => {
    books = data;
    renderBooks();
    renderCart();
  })
  .catch(() => {
    bookContainer.innerHTML = '<p class="muted">Could not load books. Please open this project with VS Code Live Server.</p>';
  });

function renderBooks() {
  const term = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  let filtered = books.filter(book => {
    const matchesText = book.name.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term);
    return matchesText && (category === "All" || book.category === category);
  });

  if (sortSelect.value === "low") filtered.sort((a,b) => a.price - b.price);
  if (sortSelect.value === "high") filtered.sort((a,b) => b.price - a.price);
  if (sortSelect.value === "name") filtered.sort((a,b) => a.name.localeCompare(b.name));

  document.getElementById("book-total").textContent = `${filtered.length} books`;
  document.getElementById("empty-state").classList.toggle("hidden", filtered.length !== 0);

  bookContainer.innerHTML = filtered.map(book => `
    <article class="book-card">
      <div class="cover-wrap">
        <img src="${escapeHTML(book.image)}" alt="${escapeHTML(book.name)} book cover"
          onerror="this.onerror=null;this.src='https://placehold.co/240x320/f1eee7/172554?text=Book+Cover'">
      </div>
      <span class="category-tag">${escapeHTML(book.category)}</span>
      <h3>${escapeHTML(book.name)}</h3>
      <p class="author">by ${escapeHTML(book.author)}</p>
      <div class="card-bottom">
        <span class="price">৳${Number(book.price).toLocaleString("en-BD")}</span>
        <button class="add-button" data-add="${book.id}">Add to cart +</button>
      </div>
    </article>
  `).join("");

  bookContainer.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

searchInput.addEventListener("input", renderBooks);
categorySelect.addEventListener("change", renderBooks);
sortSelect.addEventListener("change", renderBooks);

function saveCart() {
  localStorage.setItem("booknest-cart", JSON.stringify(cart));
}

function addToCart(id) {
  const book = books.find(item => item.id === id);
  if (!book) return;
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({id:book.id, name:book.name, price:book.price, quantity:1});
  saveCart();
  renderCart();
  showToast(`${book.name} added to your cart`);
}

function changeQuantity(id, amount) {
  const item = cart.find(book => book.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(book => book.id !== id);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(book => book.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum,item) => sum + item.quantity, 0);
  const total = cart.reduce((sum,item) => sum + item.price * item.quantity, 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = total.toLocaleString("en-BD");

  const cartItems = document.getElementById("cart-items");
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="muted">Your cart is empty. Add a book to get started.</p>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-line">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <small>৳${item.price.toLocaleString("en-BD")} each</small>
        <div class="quantity-controls">
          <button data-minus="${item.id}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-plus="${item.id}" aria-label="Increase quantity">+</button>
          <button class="remove-item" data-remove="${item.id}">Remove</button>
        </div>
      </div>
      <b>৳${(item.price * item.quantity).toLocaleString("en-BD")}</b>
    </div>
  `).join("");

  cartItems.querySelectorAll("[data-minus]").forEach(btn =>
    btn.addEventListener("click", () => changeQuantity(Number(btn.dataset.minus), -1)));
  cartItems.querySelectorAll("[data-plus]").forEach(btn =>
    btn.addEventListener("click", () => changeQuantity(Number(btn.dataset.plus), 1)));
  cartItems.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.remove))));
}

const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("overlay");
function openCart() {
  drawer.classList.add("open");
  overlay.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
}
document.getElementById("cart-open").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) {
    showToast("Your cart is empty");
    return;
  }
  const total = cart.reduce((sum,item) => sum + item.price * item.quantity, 0);
  alert(`Demo order placed!\\nTotal: ৳${total.toLocaleString("en-BD")}\\n\\nThis is a front-end demo. No real payment or order has been processed.`);
  cart = [];
  saveCart();
  renderCart();
  closeCart();
});

document.getElementById("contact-form").addEventListener("submit", event => {
  event.preventDefault();
  document.getElementById("contact-feedback").textContent =
    "Thanks! This demo form is working locally, but messages are not sent to a server.";
  event.target.reset();
});

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("show");
});
document.querySelectorAll("#nav a").forEach(link => link.addEventListener("click", () =>
  document.getElementById("nav").classList.remove("show")));

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
