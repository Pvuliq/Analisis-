export function renderGuideReviewAndDefense() {
  return `
    <div class="combined-review-layout">
      <section class="interaction-panel review-panel">
        <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
        <div class="review-document"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · versión específica</small></div><span class="review-status" id="reviewTag">Pendiente</span></div>
        <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
        <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
        <div class="decision-actions">
          <button class="action-button review-decision" data-decision="Avance suficiente" type="button">Avance suficiente</button>
          <button class="secondary-button review-decision" data-decision="Necesita correcciones" type="button">Necesita correcciones</button>
        </div>
        <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
      </section>
      <section class="interaction-panel compact-approval-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Defensa</span></div>
        <h4>Checklist de la memoria</h4>
        <p>Verifica los avances antes de emitir el visto bueno formal.</p>
        <ul class="requirement-list">
          <li class="requirement-ok"><label><input type="checkbox" checked> Versión final registrada</label></li>
          <li class="requirement-ok"><label><input type="checkbox" checked> Observaciones resueltas</label></li>
          <li class="requirement-pending"><label><input type="checkbox" id="approvalRequirement"> Visto bueno formal</label></li>
        </ul>
        <button class="action-button" id="approvalAction" type="button">Emitir visto bueno</button>
        <p class="decision-feedback" id="approvalFeedback">Completa el checklist para habilitar la defensa.</p>
      </section>
    </div>
  `;
}

export function renderDefense(isGuide) {
  if (isGuide) {
    return `
      <div class="scenario-grid">
        <section class="interaction-panel approval-panel">
          <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Memoria de Paula Castillo</span></div>
          <h4>Checklist para autorizar defensa</h4>
          <p>Verifica los avances de esta memoria antes de emitir el visto bueno formal.</p>
          <ul class="requirement-list">
            <li class="requirement-ok"><label><input type="checkbox" checked> Versión final del documento registrada</label></li>
            <li class="requirement-ok"><label><input type="checkbox" checked> Observaciones de la revisión resueltas</label></li>
            <li class="requirement-pending"><label><input type="checkbox" id="approvalRequirement"> Visto bueno formal pendiente</label></li>
          </ul>
          <button class="action-button" id="approvalAction" type="button">Emitir visto bueno</button>
          <p class="decision-feedback" id="approvalFeedback">Completa el checklist para habilitar la defensa.</p>
        </section>
        <aside class="evidence-panel">
          <p class="section-label">Estado de la memoria</p>
          <strong id="approvalState">En revisión final</strong>
          <p>El checklist permanece dentro de la memoria específica, junto al estado de sus avances.</p>
          <span class="decision-tag">F-03 · HU-07</span>
        </aside>
      </div>
    `;
  }

  return `
    <div class="scenario-grid">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>Mi defensa</span></div>
        <h4>Estado de autorización</h4>
        <p>Tu memoria aún está en desarrollo. El visto bueno aparecerá cuando el Profesor Guía complete la revisión final.</p>
        <div class="empty-review">Pendiente de autorización</div>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Próximo paso</p>
        <strong>Esperar revisión final</strong>
        <p>La coordinación de defensa se habilitará cuando se cumplan los requisitos.</p>
      </aside>
    </div>
  `;
}

export function bindDefenseEvents(root = document) {
  const approvalAction = root.querySelector('#approvalAction');
  approvalAction?.addEventListener('click', () => {
    const requirement = root.querySelector('#approvalRequirement');
    const state = root.querySelector('#approvalState');
    const feedback = root.querySelector('#approvalFeedback');

    if (!requirement.checked) {
      feedback.textContent = 'Marca el visto bueno formal para completar el checklist.';
      return;
    }

    approvalAction.textContent = 'Visto bueno emitido';
    approvalAction.classList.add('is-complete');
    if (state) state.textContent = 'Apto para defensa';
    feedback.textContent = 'La Jefatura de Carrera y la Secretaría serán notificadas.';
  });
}