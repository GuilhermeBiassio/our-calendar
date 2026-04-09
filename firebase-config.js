/**
 * CONFIGURAÇÃO DO FIREBASE
 * ========================
 * 1. Acesse https://console.firebase.google.com/
 * 2. Crie um novo projeto
 * 3. Em "Firestore Database", crie um banco no modo de teste
 * 4. Em "Configurações do projeto" > "Seus aplicativos", adicione um app Web
 * 5. Copie o firebaseConfig gerado e cole abaixo
 *
 * Regras sugeridas para o Firestore (modo teste / casal):
 *   allow read, write: if true;
 */

const firebaseConfig = {
    apiKey: "AIzaSyBOFv6Rxwh9M_l3XUc8FZ7W-Uyv3iZm1T0",
    authDomain: "our-calendar-2e3b8.firebaseapp.com",
    projectId: "our-calendar-2e3b8",
    storageBucket: "our-calendar-2e3b8.firebasestorage.app",
    messagingSenderId: "852753743741",
    appId: "1:852753743741:web:6f592e2e760e4d58fe5614",
    measurementId: "G-X2LDH5E2JG"
  };

// Detecta se a config ainda é placeholder
const _isConfigured = !Object.values(firebaseConfig).some(v =>
  typeof v === 'string' && v.startsWith('SUA_') || v.startsWith('SEU_')
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
  console.warn('Edite firebase-config.js com as credenciais do seu projeto.');
}
