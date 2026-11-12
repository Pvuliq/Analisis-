import { authRequest } from './api.js';

const loginView = document.querySelector('#loginView');
const appShell = document.querySelector('.app-shell');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const userName = document.querySelector('#loggedUser');
const studentRole = document.querySelector('#loggedStudentRole');
const userRole = document.querySelector('#loggedRole');
const logoutButton = document.querySelector('#logoutButton');

function persistAuthenticatedUser(user) {
  const normalizedUser = { ...user, role: normalizeRole(user?.role ?? user?.rol) };
  const serialized = JSON.stringify(normalizedUser);
  sessionStorage.setItem('authUser', serialized);
  localStorage.setItem('authUser', serialized);
  return normalizedUser;
}

export function getCurrentUser() {
  const value = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    const normalizedUser = { ...parsed, role: normalizeRole(parsed?.role ?? parsed?.rol) };
    if (normalizedUser.role !== (parsed?.role ?? parsed?.rol)) {
      persistAuthenticatedUser(normalizedUser);
    }
    return normalizedUser;
  } catch {
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    return null;
  }
}

export function normalizeRole(role) {
  if (typeof role !== 'string') return 'memorista';
  const normalized = role.trim().toLowerCase();
  if (['profesor_guia', 'profesor', 'guia'].includes(normalized)) return 'profesor_guia';
  if (normalized === 'correferente') return 'correferente';
  return 'memorista';
}

export function roleToView(role) {
  const normalizedRole = normalizeRole(role);
  if (['profesor_guia', 'profesor'].includes(normalizedRole)) return 'guide';
  if (normalizedRole === 'correferente') return 'reviewer';
  return 'student';
}

function showAuthenticated(user) {
  loginView.hidden = true;
  appShell.hidden = false;
  const normalizedUser = persistAuthenticatedUser(user);
  const normalizedRole = normalizedUser.role;
  userName.textContent = normalizedUser.name;
  studentRole.textContent = normalizedUser.rolUniversitario ? `ROL: ${normalizedUser.rolUniversitario}` : '';
  if (normalizedRole === 'profesor_guia') {
    userRole.textContent = 'Profesor guía';
  } else if (normalizedRole === 'correferente') {
    userRole.textContent = 'Correferente';
  } else {
    userRole.textContent = 'Memorista';
  }
  logoutButton.hidden = false;
  document.dispatchEvent(new CustomEvent('auth:ready', { detail: normalizedUser }));
}

function showLogin() {
  sessionStorage.removeItem('authUser');
  localStorage.removeItem('authUser');
  loginView.hidden = false;
  appShell.hidden = true;
  logoutButton.hidden = true;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const formData = new FormData(loginForm);
  const submitButton = loginForm.querySelector('button');
  submitButton.disabled = true;

  try {
    const result = await authRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        nombreUsuario: formData.get('nombreUsuario'),
        contrasena: formData.get('contrasena')
      })
    });
    sessionStorage.setItem('authToken', result.token);
    sessionStorage.setItem('authUser', JSON.stringify(result.user));
    localStorage.setItem('authUser', JSON.stringify(result.user));
    loginForm.reset();
    showAuthenticated(result.user);
  } catch (error) {
    loginError.textContent = error.message === 'Failed to fetch'
      ? 'No se puede conectar con la API de autenticación. Verifica que api_validaciones esté activa.'
      : (error.message || 'No se pudo iniciar sesión.');
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  localStorage.removeItem('authUser');
  showLogin();
});

const currentUser = getCurrentUser();
if (currentUser && sessionStorage.getItem('authToken')) showAuthenticated(currentUser);
else showLogin();
