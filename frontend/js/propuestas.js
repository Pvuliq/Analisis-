import { authGet, get, post } from './api.js';
import { getCurrentUser } from './auth.js';

const limits = {
  tituloProvisional: 100,
  origenMemoria: 500,
  descripcionProblema: 1000,
  alcanceObjetivos: 1000,
  correoInstitucional: 100,
  telefonoContacto: 20
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[character]));

export async function getStudentProposal() {
  const user = getCurrentUser();
  const estudianteId = user?.estudianteId || user?.rut;
  if (!estudianteId) throw new Error('No se encontró el identificador del estudiante.');

  const result = await get(`/api/propuestas/${encodeURIComponent(estudianteId)}`);
  return result.existe ? result : null;
}

export async function getProfessorGuides() {
  const professors = await authGet('/api/auth/profesores-guia');
  if (!Array.isArray(professors)) {
    throw new Error('El servidor devolvió una lista inválida de profesores guía.');
  }
  return professors;
}

export function renderProposalForm(professors = []) {
  const user = getCurrentUser();
  const estudianteId = user?.estudianteId || user?.rut || '';
  const profesorGuiaId = user?.profesorGuiaId || '';
  const professorOptions = professors.length
    ? professors.map((professor) => `
        <option value="${escapeHtml(professor.profesorGuiaId)}" ${professor.profesorGuiaId === profesorGuiaId ? 'selected' : ''}>
          ${escapeHtml(professor.nombre)}
        </option>
      `).join('')
    : '<option value="">No hay profesores guía disponibles</option>';

  return `
    <div class="scenario-grid proposal-layout">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">09</span><span>HU-09 · Propuesta inicial</span></div>
        <h4>Registrar propuesta de tema de memoria</h4>
        <p>Completa los antecedentes de tu proyecto para iniciar formalmente el proceso de memoria.</p>
        <form id="proposalForm" class="proposal-form" novalidate>
          <div class="proposal-field-row">
            <div class="proposal-field">
              <label class="field-label" for="proposalTitle">Título provisional</label>
              <input id="proposalTitle" name="tituloProvisional" type="text" maxlength="${limits.tituloProvisional}" required>
              <small class="character-count" data-count-for="proposalTitle">0/${limits.tituloProvisional}</small>
            </div>
            <div class="proposal-field">
              <label class="field-label" for="proposalGuide">Profesor guía</label>
              <select id="proposalGuide" name="profesorGuiaId" required>
                <option value="">Selecciona un profesor guía</option>
                ${professorOptions}
              </select>
            </div>
          </div>

          <div class="proposal-field-row">
            <div class="proposal-field">
              <label class="field-label" for="proposalEmail">Correo institucional</label>
              <input id="proposalEmail" name="correoInstitucional" type="email" maxlength="${limits.correoInstitucional}" placeholder="nombre@usm.cl" required>
            </div>
            <div class="proposal-field">
              <label class="field-label" for="proposalPhone">Número celular</label>
              <input id="proposalPhone" name="telefonoContacto" type="tel" maxlength="${limits.telefonoContacto}" placeholder="+56 9 1234 5678" required>
            </div>
          </div>

          <div class="proposal-field">
            <label class="field-label" for="proposalOrigin">Origen de la memoria</label>
            <div class="origin-options" id="proposalOrigin">
              <label class="origin-option">
                <input type="radio" name="origenMemoria" value="Proyecto propio del estudiante" required>
                <span>Proyecto propio del estudiante</span>
              </label>
              <label class="origin-option">
                <input type="radio" name="origenMemoria" value="Proyecto desarrollado para una empresa">
                <span>Proyecto desarrollado para una empresa</span>
              </label>
              <label class="origin-option">
                <input type="radio" name="origenMemoria" value="Proyecto propuesto por un profesor">
                <span>Proyecto propuesto por un profesor</span>
              </label>
              <label class="origin-option">
                <input type="radio" name="origenMemoria" value="Proyecto presentado en Feria de Software">
                <span>Proyecto presentado en Feria de Software</span>
              </label>
            </div>
          </div>

          <div class="proposal-field-row">
            <div class="proposal-field">
              <label class="field-label" for="proposalProblem">Descripción del problema</label>
              <textarea id="proposalProblem" name="descripcionProblema" maxlength="${limits.descripcionProblema}" required></textarea>
              <small class="character-count" data-count-for="proposalProblem">0/${limits.descripcionProblema}</small>
            </div>
            <div class="proposal-field">
              <label class="field-label" for="proposalScope">Alcance y objetivos</label>
              <textarea id="proposalScope" name="alcanceObjetivos" maxlength="${limits.alcanceObjetivos}" required></textarea>
              <small class="character-count" data-count-for="proposalScope">0/${limits.alcanceObjetivos}</small>
            </div>
          </div>

          <input type="hidden" name="estudianteId" value="${escapeHtml(estudianteId)}">
          <label class="ethical-commitment">
            <input id="ethicalCommitment" name="compromisoEtico" type="checkbox" value="true" required>
            <span>Declaro y acepto el compromiso ético formal asociado a mi proceso de memoria.</span>
          </label>
          <p id="proposalFeedback" class="decision-feedback" role="alert"></p>
          <button class="action-button" id="proposalSubmit" type="submit">Registrar propuesta</button>
        </form>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Al registrar</p>
        <ul class="evidence-list">
          <li><span>01</span>La propuesta queda guardada en la base de datos.</li>
          <li><span>02</span>El estado inicial será “Pendiente de validación”.</li>
          <li><span>03</span>Luego podrás continuar con el seguimiento de tu memoria.</li>
        </ul>
      </aside>
    </div>
  `;
}

export function bindProposalEvents(root, onCreated) {
  const form = root.querySelector('#proposalForm');
  const submitButton = root.querySelector('#proposalSubmit');
  const feedback = root.querySelector('#proposalFeedback');
  if (!form || !submitButton || !feedback) return;

  root.querySelectorAll('[data-count-for]').forEach((counter) => {
    const field = root.querySelector(`#${counter.dataset.countFor}`);
    field?.addEventListener('input', () => {
      counter.textContent = `${field.value.length}/${field.maxLength}`;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = '';
    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Registrando...';
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const proposal = await post('/api/propuestas', data);
      onCreated(proposal);
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo registrar la propuesta.';
      submitButton.disabled = false;
      submitButton.textContent = 'Registrar propuesta';
    }
  });
}

export function renderProposalStatus(proposal) {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel proposal-status">
        <div class="panel-topline"><span class="story-symbol">09</span><span>HU-09 · Seguimiento de propuesta</span></div>
        <h4>Propuesta registrada</h4>
        <p>Tu propuesta fue guardada correctamente y está disponible para validación.</p>
        <dl class="proposal-details">
          <div><dt>Título provisional</dt><dd>${escapeHtml(proposal.tituloProvisional)}</dd></div>
          <div><dt>Profesor guía</dt><dd>${escapeHtml(proposal.profesorGuiaId)}</dd></div>
          <div><dt>Origen de la memoria</dt><dd>${escapeHtml(proposal.origenMemoria)}</dd></div>
          <div><dt>Descripción del problema</dt><dd>${escapeHtml(proposal.descripcionProblema)}</dd></div>
          <div><dt>Alcance y objetivos</dt><dd>${escapeHtml(proposal.alcanceObjetivos)}</dd></div>
        </dl>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Estado actual</p>
        <strong>${escapeHtml(proposal.estado)}</strong>
        <p>La validación corresponde a una historia de usuario posterior.</p>
      </aside>
    </div>
  `;
}
