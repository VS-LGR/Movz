/**
 * Remove formatação do CPF (pontos, hífens e espaços)
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} - CPF apenas com números
 */
export const normalizeCPF = (cpf) => {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
};

/**
 * Formata CPF com pontos e hífen
 * @param {string} cpf - CPF apenas com números
 * @returns {string} - CPF formatado (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  const normalized = normalizeCPF(cpf);
  if (normalized.length !== 11) return cpf;
  
  return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Valida se o CPF tem 11 dígitos
 * @param {string} cpf - CPF normalizado
 * @returns {boolean} - true se válido
 */
export const isValidCPFLength = (cpf) => {
  const normalized = normalizeCPF(cpf);
  return normalized.length === 11;
};
