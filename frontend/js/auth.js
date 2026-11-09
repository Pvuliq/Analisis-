import { authRequest } from './api.js';

const loginView = document.querySelector('#loginView');
const appShell = document.querySelector('.app-shell');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const userName = document.querySelector('#loggedUser');
const studentRole = document.querySelector('#loggedStudentRole');
const userRole = document.querySelector('#loggedRole');
const logoutButton = document.querySelector('#logoutButton');

export function getCurrentUser() {
  const value = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    return null;
  }
}

export function roleToView(role) {
  return ['profesor_guia', 'profesor'].includes(role) ? 'guide' : 'student';
}

function showAuthenticated(user) {
  loginView.hidden = true;
  appShell.hidden = false;
  userName.textContent = user.name;
  studentRole.textContent = user.rolUniversitario ? `ROL: ${user.rolUniversitario}` : '';
  userRole.textContent = user.role === 'profesor_guia' ? 'Profesor guía' : 'Memorista';
  logoutButton.hidden = false;
  document.dispatchEvent(new CustomEvent('auth:ready', { detail: user }));
}

function showLogin() {
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
