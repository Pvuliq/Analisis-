import { bindAdvanceEvents, renderGuideAdvances, renderStudentAdvances } from './avances.js';
import { bindReviewEvents, renderReviews } from './revisiones.js';
import { bindDefenseEvents, renderDefense, renderGuideReviewAndDefense } from './defensa.js';
import { get } from './api.js';
import { getCurrentUser, roleToView } from './auth.js';

const navigationItems = document.querySelectorAll('.nav-item');
const homeLayout = document.querySelector('.home-layout');
const featureView = document.querySelector('#featureView');
const workspace = document.querySelector('.workspace');
const workspaceTitle = document.querySelector('#workspaceTitle');
const workspaceNote = document.querySelector('#workspaceNote');
const welcomeTitle = document.querySelector('#welcomeTitle');
const welcomeDescription = document.querySelector('#welcomeDescription');
const statusBadge = document.querySelector('#statusBadge');
const quickTitle = document.querySelector('#quickTitle');
const quickCount = document.querySelector('#quickCount');
const quickContent = document.querySelector('#quickContent');
const activityLabel = document.querySelector('#activityLabel');
const activityMeta = document.querySelector('#activityMeta');
const activityContent = document.querySelector('#activityContent');

let currentSection = 'inicio';
let activeRole = 'student';

const roleProfiles = {
  student: {
    workspaceTitle: 'Mi memoria',
    workspaceNote: 'Centraliza tus avances, revisiones y próximos hitos en un solo lugar.',
    welcomeTitle: 'Tu próximo avance empieza aquí.',
    welcomeDescription: 'Revisa el estado de tu memoria y continúa con la tarea que tienes pendiente.',
    status: 'En desarrollo',
    quickTitle: 'Entregas recientes',
    quickCount: 'Sin entregas',
    areaDescriptions: [
      ['Mis avances', 'Entrega y seguimiento de documentos'],
      ['Revisiones', 'Observaciones y correcciones del profesor'],
      ['Defensa', 'Estado y próximos pasos del proceso final']
    ],
    activityLabel: 'Actividad reciente',
    activityMeta: 'Últimos movimientos',
    activityTitle: 'Aún no hay actividad',
    activityDescription: 'Tus entregas y revisiones aparecerán aquí.',
  },
  guide: {
    workspaceTitle: 'Panel de seguimiento',
    workspaceNote: 'Supervisa el avance de tus memoristas y atiende las revisiones pendientes.',
    welcomeTitle: 'Revisa el progreso de tus memoristas.',
    welcomeDescription: 'Consulta las entregas, registra observaciones y acompaña cada etapa de sus memorias.',
    status: 'Consultando...', 
    quickTitle: 'Gestiona tu tutoría',
    quickCount: '3 áreas disponibles',
    areaDescriptions: [
      ['Memoristas', 'Consulta estudiantes y etapas actuales'],
      ['Revisiones', 'Evalúa entregas y registra observaciones'],
      ['Defensas', 'Emite vistos buenos pendientes']
    ],
    activityLabel: 'Bandeja docente',
    activityMeta: 'Pendientes de atención',
    activityTitle: 'Consultando entregas...', 
    activityDescription: 'Hay memoristas con avances listos para que registres tus observaciones.',
  }
};

const sectionMessages = {
  avances: 'Entrega y seguimiento de documentos.',
  revisiones: 'Observaciones y correcciones asociadas a cada avance.',
  defensa: 'Requisitos y autorización para el examen de título.'
};

async function loadGuidePendingCount() {
  try {
    if (activeRole !== 'guide') return;

    const pending = await get('/api/revisiones/pendientes');
    if (!Array.isArray(pending)) {
      throw new Error('El servidor devolvió una lista de entregas inválida.');
    }

    const count = pending.length;
    if (statusBadge) {
      statusBadge.textContent = count === 0
        ? 'Sin revisiones pendientes'
        : count === 1 ? '1 revisión pendiente' : `${count} revisiones pendientes`;
    }

    if (activityContent && currentSection === 'inicio') {
      activityContent.innerHTML = renderGuideNotifications(pending);
    }
  } catch (error) {
    console.error('Error al cargar la cantidad de pendientes:', error);
    if (statusBadge) statusBadge.textContent = 'Error de conexión';
    if (activityContent && currentSection === 'inicio') {
      activityContent.innerHTML = `
        <span class="empty-mark">!</span>
        <strong>No se pudieron cargar las entregas</strong>
        <p>Intenta nuevamente más tarde. ${escapeHtml(error.message)}</p>
      `;
    }
  }
}

function updateHomeRole(role) {
  const profile = roleProfiles[role];

  workspaceTitle.textContent = profile.workspaceTitle;
  workspaceNote.textContent = profile.workspaceNote;
  welcomeTitle.textContent = profile.welcomeTitle;
  welcomeDescription.textContent = profile.welcomeDescription;
  statusBadge.textContent = profile.status;
  quickTitle.textContent = profile.quickTitle;
  quickCount.textContent = profile.quickCount;
  quickContent.innerHTML = role === 'guide'
    ? renderGuideQuickLinks()
    : renderStudentDeliverySummary();
  if (role === 'student') {
    loadStudentDeliveries();
    loadStudentActivity();
  } else {
    loadGuideActivity();
  }
  activityLabel.textContent = profile.activityLabel;
  activityMeta.textContent = profile.activityMeta;
  activityContent.innerHTML = `
    <span class="empty-mark">+</span>
    <strong>${escapeHtml(profile.activityTitle)}</strong>
    <p>${escapeHtml(profile.activityDescription)}</p>
  `;
}

function setActiveNavigation(section) {
  navigationItems.forEach((item) => {
    item.hidden = activeRole === 'guide' && item.dataset.section === 'avances';
    item.classList.toggle('is-active', item.dataset.section === section);
  });
}

function featureHeader(identifier, title, description, role) {
  return `
    <header class="scenario-header">
      <div>
        <p class="section-label">${identifier}</p>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
      <span class="role-badge">${role}</span>
    </header>
  `;
}

function bindFeatureEvents() {
  bindAdvanceEvents(featureView);
  bindReviewEvents(featureView);
  bindDefenseEvents(featureView);
}

function renderFeature(section) {
  currentSection = section;
  const isGuide = activeRole === 'guide';

  const features = {
    avances: {
      title: isGuide ? 'Avances de memoristas' : 'Mis avances',
      description: isGuide ? 'Revisa las memorias asignadas y abre una entrega específica.' : 'Carga una nueva versión y consulta el historial de tus entregas.',
      body: isGuide ? renderGuideAdvances() : renderStudentAdvances()
    },
    revisiones: {
      title: isGuide ? 'Revisiones y defensa' : 'Mis revisiones',
      description: isGuide ? 'Evalúa el avance y verifica los requisitos de defensa de la misma memoria.' : 'Consulta las observaciones asociadas a tus documentos.',
      body: isGuide ? renderGuideReviewAndDefense() : renderReviews(false)
    },
    defensa: {
      title: isGuide ? 'Defensa y revisiones' : 'Estado de mi defensa',
      description: isGuide
        ? 'Revisa entregas y consulta los requisitos de defensa de cada memorista.'
        : 'Consulta los requisitos y el estado de autorización de tu defensa.',
      body: isGuide ? renderGuideReviewAndDefense() : renderDefense(false)
    }
  };
  const feature = features[section];
  featureView.innerHTML = `${featureHeader(
    section === 'avances' ? 'F-01 · Gestión de avances' : section === 'revisiones' ? 'F-01 · Gestión de avances' : 'F-03 · Autorización de defensa',
    feature.title,
    feature.description,
    isGuide ? 'Profesor Guía' : 'Memorista'
  )}<div class="scenario-content">${feature.body}</div>`;
  featureView.hidden = false;
  homeLayout.hidden = true;
  workspace.classList.add('feature-active');
  workspaceTitle.textContent = feature.title;
  workspaceNote.textContent = sectionMessages[section];
  setActiveNavigation(section);
  bindFeatureEvents();
}

function renderStudentDeliverySummary(deliveries = []) {
  if (deliveries.length === 0) {
    quickCount.textContent = 'Sin entregas';
    return `
      <div class="delivery-empty">
        <span class="empty-mark">+</span>
        <strong>No hay avances todavía</strong>
        <p>Cuando subas tu primer PDF aparecerá aquí con su estado de revisión.</p>
      </div>
    `;
  }

  quickCount.textContent = `${deliveries.length} ${deliveries.length === 1 ? 'entrega' : 'entregas'}`;
  return `
    ${deliveries.map((delivery) => `
      <div class="delivery-row">
        <span class="delivery-type">PDF</span>
        <span class="delivery-info"><strong>${delivery.nombreArchivo}</strong><small>${formatDeliveryDate(delivery.fechaEntrega)} · ${formatBytes(delivery.tamanoBytes)}</small></span>
        <span class="delivery-status ${String(delivery.estado).toLowerCase() === 'revisado' ? 'status-done' : 'status-review'}">${String(delivery.estado).toUpperCase()}</span>      </div>
    `).join('')}
  `;
}

async function loadStudentDeliveries() {
  try {
    const user = getCurrentUser();
    const estudianteId = user?.estudianteId || user?.rut;
    if (!estudianteId) return;
    const deliveries = await get(`/api/avances?estudianteId=${encodeURIComponent(estudianteId)}`);
    if (activeRole === 'student' && currentSection === 'inicio') {
      quickContent.innerHTML = renderStudentDeliverySummary(deliveries);
    }
  } catch (error) {
    console.error('No se pudieron cargar las entregas:', error);
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function formatActivityDate(value) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function renderStudentActivity(activity = []) {
  if (activity.length === 0) {
    activityMeta.textContent = 'Últimos movimientos';
    return `
      <span class="empty-mark">+</span>
      <strong>Aún no hay actividad</strong>
      <p>Tus entregas y revisiones aparecerán aquí.</p>
    `;
  }

  activityMeta.textContent = `${activity.length} ${activity.length === 1 ? 'movimiento' : 'movimientos'}`;
  return `
    <div class="activity-list">
      ${activity.map((item) => {
        const isReview = item.tipo === 'revision';
        const title = isReview ? 'Recibiste una observación' : 'Subiste un avance';
        const description = isReview
          ? `${item.nombreArchivo}: ${item.observaciones || 'El profesor revisó tu entrega.'}`
          : `Registraste ${item.nombreArchivo} para revisión.`;
        return `
          <article class="activity-item">
            <span class="activity-icon">${isReview ? '!' : '↑'}</span>
            <div>
              <strong>${title}</strong>
              <p>${escapeHtml(description)}</p>
              <small>${escapeHtml(formatActivityDate(item.fecha))}</small>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderGuideNotifications(pending = []) {
  if (pending.length === 0) {
    activityMeta.textContent = 'Pendientes de atención';
    return `
      <span class="empty-mark">+</span>
      <strong>Sin entregas pendientes</strong>
      <p>Cuando un memorista registre un avance, aparecerá aquí.</p>
    `;
  }

  activityMeta.textContent = `${pending.length} ${pending.length === 1 ? 'pendiente' : 'pendientes'}`;
  return `
    <div class="activity-list">
      ${pending.map((advance) => `
        <article class="activity-item">
          <span class="activity-icon">↑</span>
          <div>
            <strong>Nuevo avance de memorista</strong>
            <p>${escapeHtml(advance.estudianteIdentificacion || advance.estudianteId)} · ${escapeHtml(advance.nombreArchivo)}</p>
            <small>${escapeHtml(formatActivityDate(advance.fechaEntrega))}</small>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

async function loadStudentActivity() {
  try {
    const user = getCurrentUser();
    const estudianteId = user?.estudianteId || user?.rut;
    if (!estudianteId || activeRole !== 'student') return;

    const activity = await get(`/api/actividad?estudianteId=${encodeURIComponent(estudianteId)}`);
    if (activeRole === 'student' && currentSection === 'inicio') {
      activityContent.innerHTML = renderStudentActivity(activity);
    }
  } catch (error) {
    console.error('No se pudo cargar la actividad del estudiante:', error);
  }
}

function renderGuideActivity(activity = []) {
  if (activity.length === 0) {
    activityMeta.textContent = 'Últimos movimientos';
    return `
      <span class="empty-mark">+</span>
      <strong>Aún no hay actividad</strong>
      <p>Las entregas de tus memoristas aparecerán aquí.</p>
    `;
  }

  activityMeta.textContent = `${activity.length} ${activity.length === 1 ? 'entrega' : 'entregas'}`;
  return `
    <div class="activity-list">
      ${activity.map((item) => `
        <article class="activity-item">
          <span class="activity-icon">↑</span>
          <div>
            <strong>Nuevo avance recibido</strong>
            <p>${escapeHtml(`El estudiante ${item.estudianteId} entregó ${item.nombreArchivo}.`)}</p>
            <small>${escapeHtml(formatActivityDate(item.fecha))}</small>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

async function loadGuideActivity() {
  try {
    const user = getCurrentUser();
    const profesorGuiaId = user?.rolUniversitario;
    if (!profesorGuiaId || activeRole !== 'guide') return;

    const activity = await get(`/api/actividad/profesor?profesorGuiaId=${encodeURIComponent(profesorGuiaId)}`);
    if (activeRole === 'guide' && currentSection === 'inicio') {
      document.querySelector('#activityContent').innerHTML = renderGuideActivity(activity);
    }
  } catch (error) {
    console.error('No se pudo cargar la actividad del profesor:', error);
  }
}

function formatDeliveryDate(value) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderGuideQuickLinks() {
  const links = [
    ['Revisiones', 'Evalúa las entregas pendientes de tus memoristas', 'revisiones'],
    ['Defensas', 'Consulta y autoriza defensas preparadas', 'defensa']
  ];
  return links.map(([title, description, section], index) => `
    <button class="area-link" type="button" data-section="${section}">
      <span class="area-number">0${index + 1}</span>
      <span><strong>${title}</strong><small>${description}</small></span>
      <span class="area-arrow">→</span>
    </button>
  `).join('');
}

function showHome() {
  currentSection = 'inicio';
  featureView.hidden = true;
  homeLayout.hidden = false;
  workspace.classList.remove('feature-active');
  const profile = roleProfiles[activeRole];
  workspaceTitle.textContent = profile.workspaceTitle;
  workspaceNote.textContent = profile.workspaceNote;
  setActiveNavigation('inicio');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-section]');
  if (!target) return;

  const section = target.dataset.section;
  if (activeRole === 'guide' && section === 'avances') return;
  if (section === 'inicio') showHome();
  else renderFeature(section);
});

window.addEventListener('advance:created', () => {
  loadStudentDeliveries();
  loadStudentActivity();
});

const currentUser = getCurrentUser();
if (currentUser) {
  activeRole = roleToView(currentUser.role);
  updateHomeRole(activeRole);
  loadGuidePendingCount();
}

document.addEventListener('auth:ready', (event) => {
  activeRole = roleToView(event.detail.role);
  updateHomeRole(activeRole);
  showHome();
  loadGuidePendingCount(); 
});
