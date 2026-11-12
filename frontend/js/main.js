import { bindAdvanceEvents, renderGuideAdvances, renderStudentAdvances } from './avances.js';
import { bindReviewEvents, renderReviews } from './revisiones.js';
import { bindDefenseEvents, renderDefense, renderGuideReview } from './defensa.js';
import { bindCorreferenteEvents, renderCorreferenteView } from './correferente.js';
import { get } from './api.js';
import { getCurrentUser, roleToView } from './auth.js';
const activityPanel = document.querySelector('.activity-panel');
const homeLayout = document.querySelector('.home-layout');
const navigationItems = document.querySelectorAll('.nav-item');
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
const nextLabel = document.querySelector('#nextLabel');
const nextTitle = document.querySelector('#nextTitle');
const nextDescription = document.querySelector('#nextDescription');
const primaryButton = document.querySelector('#primaryButton');

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
    nextLabel: 'Próximo hito',
    nextTitle: 'Registrar una nueva entrega',
    nextDescription: 'Cuando tengas una nueva versión de tu documento, podrás cargarla para iniciar la revisión.',
    primary: 'Subir nuevo avance'
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
    nextLabel: 'Siguiente tarea',
    nextTitle: 'Revisar entregas pendientes',
    nextDescription: 'Abre tu bandeja de revisiones para evaluar los avances que recibiste esta semana.',
    primary: 'Ir a revisiones'
  },
  reviewer: {
    workspaceTitle: 'Evaluación de informe final',
    workspaceNote: 'Evalúa el documento final y emite tu calificación de correferente.',
    welcomeTitle: 'Evaluaciones pendientes.',
    welcomeDescription: 'Revisa las memorias autorizadas para calificar el informe final de titulación.',
    status: 'Correferente',
    quickTitle: 'Gestión de correferencia',
    quickCount: '1 tarea activa',
    areaDescriptions: [
      ['Defensas', 'Califica informes escritos de estudiantes aptos']
    ],
    activityLabel: 'Bandeja correferente',
    activityMeta: 'Revisiones finales',
    activityTitle: 'Memorias listas para evaluar',
    activityDescription: 'Consulta los informes finales de los estudiantes aptos para defensa.',
    nextLabel: 'Siguiente tarea',
    nextTitle: 'Evaluar informe final',
    nextDescription: 'Ingresa a la sección de evaluación para calificar los informes asignados.',
    primary: 'Evaluar informe'
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

  } catch (error) {
    console.error('Error al cargar la cantidad de pendientes:', error);
    if (statusBadge) statusBadge.textContent = 'Error de conexión';
  }
}

function updateHomeRole(role) {
  const profile = roleProfiles[role];
  if (!profile) return;

  workspaceTitle.textContent = profile.workspaceTitle;
  workspaceNote.textContent = profile.workspaceNote;
  welcomeTitle.textContent = profile.welcomeTitle;
  welcomeDescription.textContent = profile.welcomeDescription;
  statusBadge.textContent = profile.status;
  quickTitle.textContent = profile.quickTitle;
  quickCount.textContent = profile.quickCount;

  if (activityPanel) {
    activityPanel.style.display = (role === 'reviewer') ? 'none' : '';
  }
  if (homeLayout) {
    homeLayout.style.gridTemplateColumns = (role === 'reviewer') ? '1fr' : '';
  }

  if (role === 'guide') {
    quickContent.innerHTML = renderGuideQuickLinks();
    loadGuideActivity();
  } else if (role === 'reviewer') {
    quickContent.innerHTML = `
      <p style="color: var(--muted); margin: 8px 0 16px 0; font-size: 14px;">
        Revisa las entregas finales disponibles y califica el informe escrito.
      </p>
    `;
  } else {
    quickContent.innerHTML = renderStudentDeliverySummary();
    loadStudentDeliveries();
    loadStudentActivity();
  }

  activityLabel.textContent = profile.activityLabel;
  activityMeta.textContent = profile.activityMeta;
  activityContent.innerHTML = `
    <span class="empty-mark">+</span>
    <strong>${escapeHtml(profile.activityTitle)}</strong>
    <p>${escapeHtml(profile.activityDescription)}</p>
  `;
  if (nextLabel) nextLabel.textContent = profile.nextLabel;
  if (nextTitle) nextTitle.textContent = profile.nextTitle;
  if (nextDescription) nextDescription.textContent = profile.nextDescription;
  if (primaryButton) primaryButton.textContent = profile.primary;

  if (primaryButton) {
    primaryButton.dataset.section = role === 'guide'
      ? 'revisiones'
      : role === 'reviewer' ? 'defensa' : 'avances';
  }
  setActiveNavigation(currentSection);
}

function setActiveNavigation(section) {
  currentSection = section;
  navigationItems.forEach((item) => {
    const s = item.dataset.section;
    if (activeRole === 'reviewer') {
      item.hidden = (s === 'avances' || s === 'revisiones');
    } else if (activeRole === 'guide') {
      item.hidden = (s === 'avances');
    } else {
      item.hidden = false;
    }
    item.classList.toggle('is-active', s === section);
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
  if (activeRole === 'reviewer') {
    bindCorreferenteEvents(featureView);
    return;
  }
  bindAdvanceEvents(featureView);
  bindReviewEvents(featureView);
  bindDefenseEvents(featureView);
}

function renderFeature(section) {
  currentSection = section;
  const isGuide = activeRole === 'guide';
  const isReviewer = activeRole === 'reviewer';

  const features = {
    avances: {
      title: isGuide ? 'Avances de memoristas' : 'Mis avances',
      description: isGuide ? 'Revisa las memorias asignadas y abre una entrega específica.' : 'Carga una nueva versión y consulta el historial de tus entregas.',
      body: isGuide ? renderGuideAdvances() : renderStudentAdvances()
    },
    revisiones: {
      title: isGuide ? 'Revisiones de avances' : 'Mis revisiones',
      description: isGuide ? 'Revisa las entregas pendientes de los memoristas asignados.' : 'Consulta las observaciones asociadas a tus documentos.',
      body: isGuide ? renderGuideReview() : renderReviews(false)
    },
    defensa: {
      title: isGuide
        ? 'Autorización de defensa'
        : isReviewer
          ? 'Evaluación de informe final'
          : 'Estado de mi defensa',
      description: isGuide
        ? 'Comprueba los requisitos y emite el visto bueno para la versión final revisada.'
        : isReviewer
          ? 'Evalúa el documento final y emite la calificación para estudiantes aptos.'
          : 'Consulta los requisitos y el estado de autorización de tu defensa.',
      body: isGuide
        ? renderDefense(true)
        : isReviewer
          ? renderCorreferenteView()
          : renderDefense(false)
    }
  };

  const feature = features[section];
  const roleBadgeText = isGuide ? 'Profesor Guía' : isReviewer ? 'Correferente' : 'Memorista';
  const scenarioLabel = section === 'avances'
    ? 'F-01 · Gestión de avances'
    : section === 'revisiones'
      ? 'F-01 · Gestión de avances'
      : isReviewer
        ? 'HU-08 · Evaluación de informe final'
        : 'F-03 · Autorización de defensa';

  featureView.innerHTML = `${featureHeader(
    scenarioLabel,
    feature.title,
    feature.description,
    roleBadgeText
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
        <span class="delivery-status ${String(delivery.estado).toLowerCase() === 'revisado' ? 'status-done' : 'status-review'}">${String(delivery.estado).toUpperCase()}</span>
      </div>
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

async function loadStudentActivity() {
  try {
    const user = getCurrentUser();
    const estudianteId = user?.estudianteId || user?.rut;
    if (!estudianteId || activeRole !== 'student') return;

    const activity = await get(`/api/actividad?estudianteId=${encodeURIComponent(estudianteId)}`);
    if (activeRole === 'student' && currentSection === 'inicio') {
      if (activityContent) activityContent.innerHTML = renderStudentActivity(activity);
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
  if (profile) {
    workspaceTitle.textContent = profile.workspaceTitle;
    workspaceNote.textContent = profile.workspaceNote;
  }
  setActiveNavigation('inicio');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-section]');
  if (!target) return;

  const section = target.dataset.section;
  if (activeRole === 'guide' && section === 'avances') return;
  if (activeRole === 'reviewer' && (section === 'avances' || section === 'revisiones')) return;
  if (section === 'inicio') showHome();
  else renderFeature(section);
});

window.addEventListener('advance:created', () => {
  loadStudentDeliveries();
  loadStudentActivity();
});

const currentUser = getCurrentUser();
if (currentUser) {
  activeRole = roleToView(currentUser.role ?? currentUser.rol);
  updateHomeRole(activeRole);
  setActiveNavigation('inicio');
  loadGuidePendingCount();
}

document.addEventListener('auth:ready', (event) => {
  activeRole = roleToView(event.detail.role ?? event.detail.rol);
  updateHomeRole(activeRole);
  showHome();
  loadGuidePendingCount();
});
