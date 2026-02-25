/**
 * Configurações centrais do bot.
 * Ajuste IDs de cargos se quiser “travar” por IDs (recomendado).
 */
module.exports = {
  brand: {
    name: "STO Motors | Pernambuco RP",
    colors: {
      // Visual: Azul, Branco, Preto e “Cromado” (prata/cinza claro)
      blue: 0x0B3D91,
      chrome: 0xC0C0C0,
      black: 0x0B0B0B,
      white: 0xFFFFFF
    }
  },

  // Hierarquia (do mais alto para o mais baixo)
  hierarchy: [
    { key: "CHEFE",     label: "Chefe",     tag: "[Chefe]" },
    { key: "GERENTE",   label: "Gerente",   tag: "[Gerente]" },
    { key: "SUPERVISOR",label: "Supervisor",tag: "[Supervisor]" },
    { key: "MECANICO",  label: "Mecânico",  tag: "[Mecânico]" },
    { key: "APRENDIZ",  label: "Aprendiz",  tag: "[Aprendiz]" },
    { key: "CLIENTE",   label: "Cliente",   tag: "[Cliente]" },
    { key: "VISITANTE", label: "Visitante", tag: "[Visitante]" }
  ],

  /**
   * Se você tiver IDs reais dos cargos, preencha aqui.
   * Ex: roleIds: { CHEFE: "123", GERENTE: "456", ... }
   * Se ficar vazio, o bot tenta achar por NOME do cargo.
   */
  roleIds: {
  CHEFE: "1475626553504432171",
  GERENTE: "1475626605580783739",
  SUPERVISOR: "1475626674535272679",
  MECANICO: "1475626767388512407",
  APRENDIZ: "1475626817430884394",
  CLIENTE: "1475627167244222575",
  VISITANTE: "1475627860784840764"
},

  // Prefixo interno para logs no console
  logPrefix: "[STO]"
};