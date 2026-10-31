const roleSelect = document.querySelector('#roleSelect');
const navigationItems = document.querySelectorAll('.nav-item');
const areaLinks = document.querySelectorAll('[data-section]');
const homeLayout = document.querySelector('.home-layout');
const featureView = document.querySelector('#featureView');
const workspace = document.querySelector('.workspace');
const workspaceTitle = document.querySelector('#workspaceTitle');
const workspaceNote = document.querySelector('#workspaceNote');
const welcomeTitle = document.querySelector('#welcomeTitle');
const welcomeDescription = document.querySelector('#welcomeDescription');
const statusBadge = document.querySelector('#statusBadge');
const progressLabel = document.querySelector('#progressLabel');
const progressTitle = document.querySelector('#progressTitle');
const progressValue = document.querySelector('#progressValue');
const progressFill = document.querySelector('#progressFill');
const progressStart = document.querySelector('#progressStart');
const progressMiddle = document.querySelector('#progressMiddle');
const progressEnd = document.querySelector('#progressEnd');
const quickTitle = document.querySelector('#quickTitle');
const areaOneTitle = document.querySelector('#areaOneTitle');
const areaOneDescription = document.querySelector('#areaOneDescription');
const areaTwoTitle = document.querySelector('#areaTwoTitle');
const areaTwoDescription = document.querySelector('#areaTwoDescription');
const areaThreeTitle = document.querySelector('#areaThreeTitle');
const areaThreeDescription = document.querySelector('#areaThreeDescription');
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
    progressLabel: 'Estado actual',
    progressTitle: 'Documento en desarrollo',
    progressValue: ['02', '/04'],
    progressWidth: '50%',
    progressLabels: ['Inicio', 'Revisión', 'Defensa'],
    quickTitle: 'Continúa tu trabajo',
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
    primary: 'Ir a mis avances'
  },
  guide: {
    workspaceTitle: 'Panel de seguimiento',
    workspaceNote: 'Supervisa el avance de tus memoristas y atiende las revisiones pendientes.',
    welcomeTitle: 'Revisa el progreso de tus memoristas.',
    welcomeDescription: 'Consulta las entregas, registra observaciones y acompaña cada etapa de sus memorias.',
    status: '3 revisiones pendientes',
    progressLabel: 'Carga de revisión',
    progressTitle: 'Memoristas asignados',
    progressValue: ['03', '/06'],
    progressWidth: '50%',
    progressLabels: ['Asignados', 'En revisión', 'Aprobados'],
    quickTitle: 'Gestiona tu tutoría',
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
  progressLabel.textContent = profile.progressLabel;
  progressTitle.textContent = profile.progressTitle;
  progressValue.innerHTML = `${profile.progressValue[0]}<span>${profile.progressValue[1]}</span>`;
  progressFill.style.width = profile.progressWidth;
  [progressStart, progressMiddle, progressEnd].forEach((label, index) => {
    label.textContent = profile.progressLabels[index];
  });
  quickTitle.textContent = profile.quickTitle;
  [areaOneTitle, areaTwoTitle, areaThreeTitle].forEach((title, index) => {
    title.textContent = profile.areaDescriptions[index][0];
  });
  [areaOneDescription, areaTwoDescription, areaThreeDescription].forEach((description, index) => {
    description.textContent = profile.areaDescriptions[index][1];
  });
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

function renderStudentAdvances() {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel upload-panel">
        <div class="panel-topline"><span class="story-symbol">01</span><span>HU-01 · Entrega de documento</span></div>
        <h4>Subir avance de memoria</h4>
        <p>Adjunta una nueva versión para registrarla como entrega oficial del proceso.</p>
        <label class="file-picker" for="advanceFile">Seleccionar archivo PDF</label>
        <input id="advanceFile" class="visually-hidden" type="file" accept="application/pdf">
        <div class="file-well"><span class="file-icon">PDF</span><div><strong id="selectedFile">Avance_memoria_v03.pdf</strong><small>2.4 MB · listo para enviar</small></div><span class="file-state">OK</span></div>
        <button class="action-button" id="uploadAction" type="button">Registrar entrega</button>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Al confirmar</p>
        <ul class="evidence-list">
          <li><span>01</span>Se registra fecha y hora exacta.</li>
          <li><span>02</span>El estado cambia a “Esperando revisión”.</li>
          <li><span>03</span>Se notifica al Profesor Guía.</li>
        </ul>
      </aside>
    </div>
  `;
}

function renderGuideAdvances() {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">01</span><span>Memoria de Paula Castillo</span></div>
        <h4>Avances recibidos</h4>
        <p>Consulta las versiones entregadas por la memorista antes de registrar una revisión.</p>
        <div class="file-well"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · Esperando revisión</small></div><span class="review-status">Pendiente</span></div>
        <button class="action-button" data-section="revisiones" type="button">Abrir revisión</button>
      </section>
      <aside class="evidence-panel"><p class="section-label">Seguimiento</p><strong>1 avance pendiente</strong><p>La memoria específica queda lista para revisar sus observaciones y progreso.</p></aside>
    </div>
  `;
}

function renderReviews() {
  if (roleSelect.value === 'guide') {
    return `
      <div class="scenario-grid">
        <section class="interaction-panel review-panel">
          <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
          <div class="review-document"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · versión específica</small></div><span class="review-status">Revisado</span></div>
          <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
          <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
          <div class="decision-actions"><button class="action-button review-decision" type="button">Avance suficiente</button><button class="secondary-button review-decision" type="button">Necesita correcciones</button></div>
          <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
        </section>
        <aside class="evidence-panel"><p class="section-label">Estado de la revisión</p><strong id="reviewState">Revisado</strong><p>Las observaciones quedan vinculadas a esta versión y se notifica al estudiante.</p><span class="decision-tag">F-01 · HU-02</span></aside>
      </div>
    `;
  }

  return `
    <div class="scenario-grid">
      <section class="interaction-panel"><div class="panel-topline"><span class="story-symbol">02</span><span>Mis revisiones</span></div><h4>Observaciones del Profesor Guía</h4><p>Aquí aparecerán las correcciones asociadas a tus entregas cuando sean revisadas.</p><div class="empty-review">No hay observaciones nuevas para mostrar.</div></section>
      <aside class="evidence-panel"><p class="section-label">Estado</p><strong>En espera de revisión</strong><p>Recibirás una notificación cuando el profesor registre sus comentarios.</p></aside>
    </div>
  `;
}

function renderGuideReviewAndDefense() {
  return `
    <div class="combined-review-layout">
      <section class="interaction-panel review-panel">
        <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
        <div class="review-document"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · versión específica</small></div><span class="review-status">Revisado</span></div>
        <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
        <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
        <div class="decision-actions"><button class="action-button review-decision" type="button">Avance suficiente</button><button class="secondary-button review-decision" type="button">Necesita correcciones</button></div>
        <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
      </section>
      <section class="interaction-panel compact-approval-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Defensa</span></div>
        <h4>Checklist de la memoria</h4>
        <p>Verifica los avances antes de emitir el visto bueno formal.</p>
        <ul class="requirement-list"><li class="requirement-ok"><label><input type="checkbox" checked> Versión final registrada</label></li><li class="requirement-ok"><label><input type="checkbox" checked> Observaciones resueltas</label></li><li class="requirement-pending"><label><input type="checkbox" id="approvalRequirement"> Visto bueno formal</label></li></ul>
        <button class="action-button" id="approvalAction" type="button">Emitir visto bueno</button>
        <p class="decision-feedback" id="approvalFeedback">Completa el checklist para habilitar la defensa.</p>
      </section>
    </div>
  `;
}

function renderDefense() {
  if (roleSelect.value === 'guide') {
    return `
      <div class="scenario-grid">
        <section class="interaction-panel approval-panel"><div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Memoria de Paula Castillo</span></div><h4>Checklist para autorizar defensa</h4><p>Verifica los avances de esta memoria antes de emitir el visto bueno formal.</p><ul class="requirement-list"><li class="requirement-ok"><label><input type="checkbox" checked> Versión final del documento registrada</label></li><li class="requirement-ok"><label><input type="checkbox" checked> Observaciones de la revisión resueltas</label></li><li class="requirement-pending"><label><input type="checkbox" id="approvalRequirement"> Visto bueno formal pendiente</label></li></ul><button class="action-button" id="approvalAction" type="button">Emitir visto bueno</button><p class="decision-feedback" id="approvalFeedback">Completa el checklist para habilitar la defensa.</p></section>
        <aside class="evidence-panel"><p class="section-label">Estado de la memoria</p><strong id="approvalState">En revisión final</strong><p>El checklist permanece dentro de la memoria específica, junto al estado de sus avances.</p><span class="decision-tag">F-03 · HU-07</span></aside>
      </div>
    `;
  }

  return `
    <div class="scenario-grid"><section class="interaction-panel"><div class="panel-topline"><span class="story-symbol">03</span><span>Mi defensa</span></div><h4>Estado de autorización</h4><p>Tu memoria aún está en desarrollo. El visto bueno aparecerá cuando el Profesor Guía complete la revisión final.</p><div class="empty-review">Pendiente de autorización</div></section><aside class="evidence-panel"><p class="section-label">Próximo paso</p><strong>Esperar revisión final</strong><p>La coordinación de defensa se habilitará cuando se cumplan los requisitos.</p></aside></div>
  `;
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
      body: isGuide ? renderGuideReviewAndDefense() : renderReviews()
    },
    defensa: {
      title: isGuide ? 'Autorización de defensa' : 'Estado de mi defensa',
      description: isGuide ? 'Verifica los avances de una memoria y emite su visto bueno.' : 'Consulta los requisitos y el estado de autorización de tu defensa.',
      body: renderDefense()
    }
  };
  const feature = features[section];
  featureView.innerHTML = `${featureHeader(section === 'avances' ? 'F-01 · Gestión de avances' : section === 'revisiones' ? 'F-01 · Gestión de avances' : 'F-03 · Autorización de defensa', feature.title, feature.description, isGuide ? 'Profesor Guía' : 'Memorista')}<div class="scenario-content">${feature.body}</div>`;
  featureView.hidden = false;
  homeLayout.hidden = true;
  workspace.classList.add('feature-active');
  workspaceTitle.textContent = feature.title;
  workspaceNote.textContent = sectionMessages[section];
  setActiveNavigation(section);
  attachFeatureInteractions();
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

function attachFeatureInteractions() {
  const fileInput = document.querySelector('#advanceFile');
  const selectedFile = document.querySelector('#selectedFile');
  const uploadAction = document.querySelector('#uploadAction');
  const approvalAction = document.querySelector('#approvalAction');

  fileInput?.addEventListener('change', () => {
    if (fileInput.files[0]) selectedFile.textContent = fileInput.files[0].name;
  });
  uploadAction?.addEventListener('click', () => {
    uploadAction.textContent = 'Avance subido con éxito';
    uploadAction.classList.add('is-complete');
  });
  document.querySelectorAll('.review-decision').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('#reviewState').textContent = 'Revisado';
      document.querySelector('#reviewFeedback').textContent = button.textContent === 'Avance suficiente' ? 'La versión cumple con el estándar esperado.' : 'Se notificará al memorista que debe realizar correcciones.';
      document.querySelectorAll('.review-decision').forEach((item) => item.classList.remove('is-selected'));
      button.classList.add('is-selected');
    });
  });
  approvalAction?.addEventListener('click', () => {
    const requirement = document.querySelector('#approvalRequirement');
    const state = document.querySelector('#approvalState');
    const feedback = document.querySelector('#approvalFeedback');
    if (!requirement.checked) {
      feedback.textContent = 'Marca el visto bueno formal para completar el checklist.';
      return;
    }
    approvalAction.textContent = 'Visto bueno emitido';
    approvalAction.classList.add('is-complete');
    state.textContent = 'Apto para defensa';
    feedback.textContent = 'La Jefatura de Carrera y la Secretaría serán notificadas.';
  });
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

function updateHomeRole(role) {
  const profile = roleProfiles[role];
  workspaceTitle.textContent = profile.workspaceTitle;
  workspaceNote.textContent = profile.workspaceNote;
  welcomeTitle.textContent = profile.welcomeTitle;
  welcomeDescription.textContent = profile.welcomeDescription;
  statusBadge.textContent = profile.status;
  progressLabel.textContent = profile.progressLabel;
  progressTitle.textContent = profile.progressTitle;
  progressValue.innerHTML = `${profile.progressValue[0]}<span>${profile.progressValue[1]}</span>`;
  progressFill.style.width = profile.progressWidth;
  [progressStart, progressMiddle, progressEnd].forEach((label, index) => { label.textContent = profile.progressLabels[index]; });
  quickTitle.textContent = profile.quickTitle;
  [areaOneTitle, areaTwoTitle, areaThreeTitle].forEach((title, index) => { title.textContent = profile.areaDescriptions[index][0]; });
  [areaOneDescription, areaTwoDescription, areaThreeDescription].forEach((description, index) => { description.textContent = profile.areaDescriptions[index][1]; });
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
  navigationItems.forEach((item) => item.classList.toggle('is-active', item.dataset.section === section));
}

updateHomeRole('student');

//Avance HU-02 : Registrar observaciones y correcciones sobre el avance

//Avance HU-07 : Emitir visto bueno para autorizar la defensa de la memoria