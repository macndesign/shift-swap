import { NotFoundError } from "core-kernel";

/**
 * Códigos de erro do shift-swap (estáveis, para o consumidor tratar sem depender do texto da
 * mensagem). As mensagens continuam em português e podem mudar.
 *
 * Além destes, aparecem os códigos genéricos do core-kernel: `VALIDATION_FAILED` (código de um
 * `ValidationError` com várias issues) e `UNEXPECTED` (falha de infraestrutura).
 */
const CODIGOS_ERRO = {
  // Validação (ValidationError — o código fica em `issues[].code`)
  ID_INVALIDO: "ID_INVALIDO",
  NOME_VAZIO: "NOME_VAZIO",
  NOME_CURTO: "NOME_CURTO",
  EMAIL_VAZIO: "EMAIL_VAZIO",
  EMAIL_INVALIDO: "EMAIL_INVALIDO",
  DATA_INVALIDA: "DATA_INVALIDA",
  HORA_INICIO_INVALIDA: "HORA_INICIO_INVALIDA",
  HORA_FIM_INVALIDA: "HORA_FIM_INVALIDA",
  HORARIO_INVALIDO: "HORARIO_INVALIDO",
  DESTINATARIO_IGUAL_SOLICITANTE: "DESTINATARIO_IGUAL_SOLICITANTE",
  MOTIVO_OBRIGATORIO: "MOTIVO_OBRIGATORIO",
  REFERENCIA_INVALIDA: "REFERENCIA_INVALIDA",
  STATUS_INVALIDO: "STATUS_INVALIDO",
  DADOS_INCOERENTES: "DADOS_INCOERENTES",
  // Não encontrado (NotFoundError)
  FUNCIONARIO_NAO_ENCONTRADO: "FUNCIONARIO_NAO_ENCONTRADO",
  SUPERVISOR_NAO_ENCONTRADO: "SUPERVISOR_NAO_ENCONTRADO",
  TURNO_NAO_ENCONTRADO: "TURNO_NAO_ENCONTRADO",
  SOLICITACAO_NAO_ENCONTRADA: "SOLICITACAO_NAO_ENCONTRADA",
  // Conflito com o estado atual (ConflictError)
  TRANSICAO_INVALIDA: "TRANSICAO_INVALIDA",
  TURNO_JA_PERTENCE_AO_FUNCIONARIO: "TURNO_JA_PERTENCE_AO_FUNCIONARIO",
  TURNO_NAO_PERTENCE_AO_SOLICITANTE: "TURNO_NAO_PERTENCE_AO_SOLICITANTE",
  SOLICITACAO_EM_ABERTO_EXISTENTE: "SOLICITACAO_EM_ABERTO_EXISTENTE",
  CONFLITO_DE_HORARIO: "CONFLITO_DE_HORARIO",
  // Sem permissão (ForbiddenError)
  SOMENTE_DONO_DO_TURNO: "SOMENTE_DONO_DO_TURNO",
  SOMENTE_DESTINATARIO: "SOMENTE_DESTINATARIO",
  SOMENTE_SOLICITANTE: "SOMENTE_SOLICITANTE",
  SUPERVISOR_E_PARTE: "SUPERVISOR_E_PARTE",
} as const;

type CodigoErro = (typeof CODIGOS_ERRO)[keyof typeof CODIGOS_ERRO];

const naoEncontrado = {
  funcionario: () =>
    new NotFoundError("Funcionário não encontrado", {
      code: CODIGOS_ERRO.FUNCIONARIO_NAO_ENCONTRADO,
    }),
  supervisor: () =>
    new NotFoundError("Supervisor não encontrado", {
      code: CODIGOS_ERRO.SUPERVISOR_NAO_ENCONTRADO,
    }),
  turno: () =>
    new NotFoundError("Turno não encontrado", { code: CODIGOS_ERRO.TURNO_NAO_ENCONTRADO }),
  solicitacao: () =>
    new NotFoundError("Solicitação não encontrada", {
      code: CODIGOS_ERRO.SOLICITACAO_NAO_ENCONTRADA,
    }),
};

export { CODIGOS_ERRO, type CodigoErro, naoEncontrado };
