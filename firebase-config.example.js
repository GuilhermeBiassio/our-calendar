/**
 * CONFIGURAÇÃO DO FIREBASE — TEMPLATE
 * =====================================
 * NÃO coloque credenciais reais aqui. Este arquivo é versionado no git.
 *
 * Para desenvolvimento local:
 *   Copie este arquivo como "firebase-config.js" e preencha com suas credenciais.
 *   O arquivo firebase-config.js está no .gitignore e nunca será commitado.
 *
 * Para produção (GitHub Pages):
 *   As credenciais são injetadas automaticamente pelo GitHub Actions via Secrets.
 *   Configure os secrets em: Settings > Secrets and variables > Actions
 *     - FIREBASE_API_KEY
 *     - FIREBASE_AUTH_DOMAIN
 *     - FIREBASE_PROJECT_ID
 *     - FIREBASE_STORAGE_BUCKET
 *     - FIREBASE_MESSAGING_SENDER_ID
 *     - FIREBASE_APP_ID
 *     - FIREBASE_MEASUREMENT_ID
 */

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};

const _isConfigured = !Object.values(firebaseConfig).some(v =>
  typeof v === 'string' && (v.startsWith('SUA_') || v.startsWith('SEU_'))
);

try {
  if (_isConfigured) {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.firebaseEnabled = true;
    console.log('%c Firebase conectado ✓', 'color: #e91e63; font-weight: bold;');
  } else {
    throw new Error('Firebase não configurado');
  }
} catch (e) {
  window.firebaseEnabled = false;
  console.warn('%c Firebase não configurado — usando localStorage como fallback.', 'color: #ff9800;');
  console.warn('Copie firebase-config.example.js como firebase-config.js e preencha as credenciais.');
}
