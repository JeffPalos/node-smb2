// Utilitaire commun pour la configuration SMB partagée entre toutes les démos

export interface SMBConfig {
  host: string;
  domain: string;
  username: string;
  password: string;
  share: string;
  forceNtlmVersion?: 'v1' | 'v2';
}

/**
 * Charge la configuration SMB depuis les variables d'environnement
 * Utilisé par toutes les démos pour une configuration cohérente
 */
export function loadSMBConfig(): SMBConfig {
  const {
    HOST: host = "localhost",
    DOMAIN: domain = "WORKGROUP",
    USERNAME: username = "test",
    PASSWORD: password = "1234",
    SHARE: share = "test",
    FORCE_NTLM: forceNtlm
  } = process.env;

  // Conversion de FORCE_NTLM en forceNtlmVersion
  const forceNtlmVersion = forceNtlm === 'v1' ? 'v1' : 
                           forceNtlm === 'v2' ? 'v2' : 
                           undefined;

  return {
    host,
    domain,
    username,
    password,
    share,
    forceNtlmVersion
  };
}

/**
 * Affiche la configuration SMB actuelle (masque le mot de passe)
 */
export function displaySMBConfig(config: SMBConfig): void {
  console.log('🔧 Configuration SMB:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Domain: ${config.domain}`);
  console.log(`  Username: ${config.username}`);
  console.log(`  Password: ${config.password ? '***' : 'undefined'}`);
  console.log(`  Share: ${config.share}`);
  if (config.forceNtlmVersion) {
    console.log(`  Force NTLM: ${config.forceNtlmVersion}`);
  }
}

/**
 * Valide que la configuration SMB est complète
 */
export function validateSMBConfig(config: SMBConfig): boolean {
  if (!config.host || !config.username || !config.password || !config.share) {
    console.error('❌ Configuration SMB incomplète !');
    console.log('💡 Vérifiez les variables d\'environnement : HOST, USERNAME, PASSWORD, SHARE');
    return false;
  }
  return true;
}

export default { loadSMBConfig, displaySMBConfig, validateSMBConfig };