// Test utilitaire pour vérifier le chargement des variables .env
console.log('🔧 Test du chargement des variables d\'environnement:');
console.log('HOST:', process.env.HOST);
console.log('DOMAIN:', process.env.DOMAIN);
console.log('USERNAME:', process.env.USERNAME);
console.log('SHARE:', process.env.SHARE);
console.log('PASSWORD:', process.env.PASSWORD ? '***' : 'undefined');

if (process.env.HOST && process.env.USERNAME && process.env.SHARE) {
  console.log('✅ Variables .env chargées correctement !');
} else {
  console.log('❌ Problème avec le chargement des variables .env');
}