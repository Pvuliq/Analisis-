import { bindAdvanceEvents, renderGuideAdvances, renderStudentAdvances } from './avances.js';
import { bindReviewEvents, renderReviews } from './revisiones.js';
import { bindDefenseEvents, renderDefense, renderGuideReviewAndDefense } from './defensa.js';
import { get } from './api.js';

const roleSelect = document.querySelector('#roleSelect');
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
const activityTitle = document.querySelector('#activityTitle');
const activityDescription = document.querySelector('#activityDescription');
const nextLabel = document.querySelector('#nextLabel');
const nextTitle = document.querySelector('#nextTitle');
const nextDescription = document.querySelector('#nextDescription');
const primaryButton = document.querySelector('#primaryButton');

let currentSection = 'inicio';

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
    status: '3 revisiones pendientes',
    quickTitle: 'Gestiona tu tutoría',
    quickCount: '3 áreas disponibles',
    areaDescriptions: [
      ['Memoristas', 'Consulta estudiantes y etapas actuales'],
      ['Revisiones', 'Evalúa entregas y registra observaciones'],
      ['Defensas', 'Emite vistos buenos pendientes']
    ],
    activityLabel: 'Bandeja docente',
    activityMeta: 'Pendientes de atención',
    activityTitle: '3 entregas esperan revisión',
    activityDescription: 'Hay memoristas con avances listos para que registres tus observaciones.',
    nextLabel: 'Siguiente tarea',
    nextTitle: 'Revisar entregas pendientes',
    nextDescription: 'Abre tu bandeja de revisiones para evaluar los avances que recibiste esta semana.',
    primary: 'Ir a revisiones'
  }
};

const sectionMessages = {
  avances: 'Entrega y seguimiento de documentos.',
  revisiones: 'Observaciones y correcciones asociadas a cada avance.',
  defensa: 'Requisitos y autorización para el examen de título.'
};

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
    ? renderGuideQuickLinks(profile.areaDescriptions)
    : renderStudentDeliverySummary();
  if (role === 'student') loadStudentDeliveries();
  activityLabel.textContent = profile.activityLabel;
  activityMeta.textContent = profile.activityMeta;
  activityTitle.textContent = profile.activityTitle;
  activityDescription.textContent = profile.activityDescription;
  nextLabel.textContent = profile.nextLabel;
  nextTitle.textContent = profile.nextTitle;
  nextDescription.textContent = profile.nextDescription;
  primaryButton.textContent = profile.primary;
  primaryButton.dataset.section = role === 'guide' ? 'revisiones' : 'avances';
  roleSelect.setAttribute('aria-label', `Vista actual: ${role === 'guide' ? 'Profesor Guía' : 'Memorista'}`);
}

function setActiveNavigation(section) {
  navigationItems.forEach((item) => {
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
  const isGuide = roleSelect.value === 'guide';

  if (isGuide && section === 'defensa') {
    section = 'revisiones';
    currentSection = section;
  }

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
      title: 'Estado de mi defensa',
      description: 'Consulta los requisitos y el estado de autorización de tu defensa.',
      body: renderDefense(false)
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
        <span class="delivery-status ${delivery.estado === 'Revisado' ? 'status-done' : 'status-review'}">${delivery.estado}</span>
      </div>
    `).join('')}
  `;
}

async function loadStudentDeliveries() {
  try {
    const deliveries = await get('/api/avances?estudianteId=202173001');
    if (roleSelect.value === 'student' && currentSection === 'inicio') {
      quickContent.innerHTML = renderStudentDeliverySummary(deliveries);
    }
  } catch (error) {
    console.error('No se pudieron cargar las entregas:', error);
  }
}

function formatDeliveryDate(value) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderGuideQuickLinks(areaDescriptions) {
  return areaDescriptions.map(([title, description], index) => `
    <button class="area-link" type="button" data-section="${['avances', 'revisiones', 'defensa'][index]}">
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
  const profile = roleProfiles[roleSelect.value];
  workspaceTitle.textContent = profile.workspaceTitle;
  workspaceNote.textContent = profile.workspaceNote;
  setActiveNavigation('inicio');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-section]');
  if (!target) return;

  const section = target.dataset.section;
  if (section === 'inicio') showHome();
  else renderFeature(section);
});

roleSelect.addEventListener('change', (event) => {
  updateHomeRole(event.target.value);
  if (currentSection === 'inicio') showHome();
  else renderFeature(currentSection);
});

window.addEventListener('advance:created', loadStudentDeliveries);

updateHomeRole('student');
