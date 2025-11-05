const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabButtons = document.querySelectorAll('.tab-btn');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
    loginError.textContent = '';
    registerError.textContent = '';
  });
});

// Get users from localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const users = getUsers();
  const user = users.find(u => u.id === email && u.pass === pass);

  if (user) {
    localStorage.setItem('loggedInUser', email);
    window.location.href = 'file.html';
  } else {
    loginError.textContent = 'Invalid email or password.';
  }
});

// Register
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  const confirmPass = document.getElementById('regConfirmPass').value;
  const users = getUsers();

  if (pass !== confirmPass) {
    registerError.textContent = 'Passwords do not match.';
    return;
  }

  if (users.some(u => u.id === email)) {
    registerError.textContent = 'Email already registered.';
    return;
  }

  users.push({ id: email, pass: pass });
  saveUsers(users);
  localStorage.setItem('loggedInUser', email);
  window.location.href = 'file.html';
});