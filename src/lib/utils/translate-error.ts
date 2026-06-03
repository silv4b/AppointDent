const patterns: [RegExp, string][] = [
  [/Invalid login credentials/i, "Email ou senha incorretos"],
  [/Email not confirmed/i, "Email não confirmado"],
  [/User already registered/i, "Usuário já cadastrado com este email"],
  [/duplicate key value/i, "Registro duplicado"],
  [/violates foreign key constraint/i, "Registro vinculado a outros dados"],
  [/violates row.level.security/i, "Permissão negada"],
  [/new row violates/i, "Violação de restrição do banco de dados"],
  [/JWT expired/i, "Sessão expirada"],
  [/refresh_token_not_found/i, "Sessão expirada. Faça login novamente."],
  [/Password should be at least \d+ characters/i, "Senha deve ter no mínimo 6 caracteres"],
  [/Password should contain at least one uppercase/i, "Senha deve conter pelo menos uma letra maiúscula"],
  [/Password should contain at least one digit/i, "Senha deve conter pelo menos um número"],
  [/relation.*does not exist/i, "Erro interno: tabela não encontrada"],
  [/Could not find a record/i, "Registro não encontrado"],
  [/type "([^"]+)" does not exist/i, "Erro interno: tipo não encontrado"],
  [/invalid input syntax/i, "Valor inválido informado"],
  [/null value in column/i, "Campo obrigatório não preenchido"],
  [/violates check constraint/i, "Valor inválido para o campo"],
  [/Database error saving/i, "Erro ao salvar no banco de dados"],
]

export function translateMessage(msg: string): string {
  if (!msg) return msg

  for (const [regex, translation] of patterns) {
    if (regex.test(msg)) return translation
  }

  return msg
}

export function translateError(error: { message?: string; code?: string }): string {
  if (error?.code === "refresh_token_not_found") return "Sessão expirada. Faça login novamente."
  return translateMessage(error?.message ?? "")
}
