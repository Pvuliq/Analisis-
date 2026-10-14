const roleSelect = document.querySelector('#roleSelect');
const welcomeTitle = document.querySelector('#welcomeTitle');
const welcomeText = document.querySelector('#welcomeText');
const nextStepTitle = document.querySelector('#nextStepTitle');
const nextStepText = document.querySelector('#nextStepText');
const primaryAction = document.querySelector('#primaryAction');

const roleCopy = {
  student: {
    title: 'Tu proximo avance empieza aqui.',
    welcome: 'Revisa tus entregas y prepara la siguiente version de tu documento.',
    nextTitle: 'Registrar una nueva entrega',
    nextText: 'La primera funcionalidad conectara este panel con la carga de avances del memorista.',
    action: 'Preparar entrega'
  },
  guide: {
    title: 'Revisa el progreso de tus memoristas.',
    welcome: 'Consulta entregas, registra observaciones y acompana cada etapa del proceso.',
    nextTitle: 'Revisar entregas pendientes',
    nextText: 'La siguiente funcionalidad conectara este panel con la revision de documentos.',
    action: 'Ver entregas'
  }
};

function updateRoleView(role) {
  const copy = roleCopy[role];
  welcomeTitle.textContent = copy.title;
  welcomeText.textContent = copy.welcome;
  nextStepTitle.textContent = copy.nextTitle;
  nextStepText.textContent = copy.nextText;
  primaryAction.textContent = copy.action;
}

roleSelect.addEventListener('change', (event) => {
  updateRoleView(event.target.value);
});

primaryAction.addEventListener('click', () => {
  primaryAction.textContent = 'Proximamente';
});
