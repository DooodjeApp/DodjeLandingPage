const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ==================== FONCTIONS DE VALIDATION SÉCURISÉES ====================

// 1. Vérifier si un email existe déjà
exports.checkEmailExists = functions.https.onCall(async (data, context) => {
  try {
    const { email } = data;
    
    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Email invalide');
    }
    
    console.log(`🔍 Vérification email: ${email}`);
    
    // Vérifier dans preinscription (privé)
    const preinscriptionQuery = await admin.firestore()
      .collection('preinscription')
      .where('email', '==', email)
      .get();
    
    if (!preinscriptionQuery.empty) {
      return { exists: true, collection: 'preinscription' };
    }
    
    // Vérifier dans users (même si pas encore utilisé)
    const usersQuery = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();
    
    if (!usersQuery.empty) {
      return { exists: true, collection: 'users' };
    }
    
    return { exists: false };
    
  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Erreur de vérification email');
  }
});

// 2. Vérifier si un username existe déjà
exports.checkUsernameExists = functions.https.onCall(async (data, context) => {
  try {
    const { username } = data;
    
    if (!username || username.length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'Username invalide');
    }
    
    console.log(`🔍 Vérification username: ${username}`);
    
    // Vérifier dans preinscription (privé)
    const preinscriptionQuery = await admin.firestore()
      .collection('preinscription')
      .where('username', '==', username)
      .get();
    
    if (!preinscriptionQuery.empty) {
      return { exists: true, collection: 'preinscription' };
    }
    
    // Vérifier dans users
    const usersQuery = await admin.firestore()
      .collection('users')
      .where('username', '==', username)
      .get();
    
    if (!usersQuery.empty) {
      return { exists: true, collection: 'users' };
    }
    
    return { exists: false };
    
  } catch (error) {
    console.error('❌ Erreur vérification username:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Erreur de vérification username');
  }
});

// 3. Inscription sécurisée
exports.registerUser = functions.https.onCall(async (data, context) => {
  try {
    const { email, username, founderCode, registrationIP } = data;
    
    // Validations
    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Email invalide');
    }
    
    if (!username || username.length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'Username invalide');
    }
    
    console.log(`📝 Inscription: ${username} (${email})`);
    
    // Vérifier unicité email et username
    const [emailCheck, usernameCheck] = await Promise.all([
      admin.firestore().collection('preinscription').where('email', '==', email).get(),
      admin.firestore().collection('preinscription').where('username', '==', username).get()
    ]);
    
    if (!emailCheck.empty) {
      throw new functions.https.HttpsError('already-exists', 'Cet email est déjà utilisé');
    }
    
    if (!usernameCheck.empty) {
      throw new functions.https.HttpsError('already-exists', 'Ce nom d\'utilisateur est déjà pris');
    }
    
    // Générer le code fondateur unique
    const generatedFounderCode = await generateUniqueFounderCodeSecure(username);
    
    // Préparer les données
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    const privateData = {
      email: email,
      username: username,
      founderCodeUsed: founderCode || null,
      generatedFounderCode: generatedFounderCode,
      referralsCount: 0,
      registrationIP: registrationIP || null,
      timestamp: timestamp,
      status: 'pending',
      bestFlappyBirdScore: 0,
      lastGamePlayed: null
    };
    
    const publicData = {
      username: username,
      founderCodeUsed: founderCode || null,
      generatedFounderCode: generatedFounderCode,
      referralsCount: 0,
      timestamp: timestamp,
      status: 'pending',
      bestFlappyBirdScore: 0,
      lastGamePlayed: null
    };
    
    // Transaction pour créer dans les deux collections
    const batch = admin.firestore().batch();
    
    // 1. Créer dans preinscription (privé)
    const privateRef = admin.firestore().collection('preinscription').doc();
    batch.set(privateRef, privateData);
    
    // 2. Créer dans preinscription_public
    const publicRef = admin.firestore().collection('preinscription_public').doc(username);
    batch.set(publicRef, publicData);
    
    // Exécuter la transaction
    await batch.commit();
    
    console.log(`✅ Inscription réussie: ${username}`);
    
    return {
      success: true,
      user: {
        username: username,
        generatedFounderCode: generatedFounderCode,
        registrationDate: new Date().toISOString(),
        documentId: privateRef.id
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Erreur lors de l\'inscription');
  }
});

// 4. Connexion sécurisée
exports.loginUser = functions.https.onCall(async (data, context) => {
  try {
    const { email } = data;
    
    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Email invalide');
    }
    
    console.log(`🔐 Tentative de connexion: ${email}`);
    
    // Recherche sécurisée côté serveur
    const query = await admin.firestore()
      .collection('preinscription')
      .where('email', '==', email)
      .get();
    
    if (query.empty) {
      throw new functions.https.HttpsError('not-found', 'Aucun compte trouvé avec cette adresse email');
    }
    
    const userData = query.docs[0].data();
    
    return {
      success: true,
      user: {
        email: userData.email,
        username: userData.username,
        founderCode: userData.generatedFounderCode,
        registrationDate: userData.timestamp,
        documentId: query.docs[0].id,
        isRegistered: true,
        lastLogin: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Erreur de connexion');
  }
});

// ==================== FONCTIONS UTILITAIRES ====================

// Génération sécurisée de code fondateur unique
async function generateUniqueFounderCodeSecure(username) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const founderCode = generateFounderCodeLogic(username);
    
    // Vérifier dans preinscription_public (accessible sans règles spéciales)
    const exists = await admin.firestore()
      .collection('preinscription_public')
      .where('generatedFounderCode', '==', founderCode)
      .get();
    
    if (exists.empty) {
      return founderCode;
    }
    
    attempts++;
  }
  
  // Fallback avec timestamp
  const timestamp = Date.now().toString().slice(-3);
  return `${username}${timestamp}`;
}

// Logique de génération de code fondateur
function generateFounderCodeLogic(username) {
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanUsername}${randomSuffix}`;
}

// ==================== FONCTION DE SYNCHRONISATION AUTOMATIQUE ====================
// Se déclenche automatiquement à chaque modification dans preinscription_public
exports.syncToPrivateCollection = functions.firestore
  .document('preinscription_public/{username}')
  .onWrite(async (change, context) => {
    
    try {
      const username = context.params.username;
      console.log(`🔄 Synchronisation pour utilisateur ${username}`);
      
      // Récupérer les données du document modifié dans preinscription_public
      const afterData = change.after.exists ? change.after.data() : null;
      
      if (!afterData) {
        console.log('Document supprimé dans preinscription_public, pas de synchronisation');
        return;
      }
      
      // Trouver le document correspondant dans preinscription (privé)
      const privateQuery = await admin.firestore()
        .collection('preinscription')
        .where('username', '==', username)
        .get();
      
      if (privateQuery.empty) {
        console.warn(`❌ Aucun document privé trouvé pour ${username}`);
        return;
      }
      
      // Synchroniser les données (sans email et IP qui restent privés)
      const privateDoc = privateQuery.docs[0];
      const updateData = {
        referralsCount: afterData.referralsCount || 0,
        bestFlappyBirdScore: afterData.bestFlappyBirdScore || 0,
        lastGamePlayed: afterData.lastGamePlayed || null,
        status: afterData.status || 'active',
        lastReferralDate: afterData.lastReferralDate || null,
        
        // ✅ email et registrationIP restent intacts dans preinscription
        lastSyncFromPublic: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await admin.firestore()
        .collection('preinscription')
        .doc(privateDoc.id)
        .update(updateData);
        
      console.log(`✅ Synchronisation terminée pour ${username}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);
      throw error;
    }
  });

// ==================== FONCTION DE MIGRATION INITIALE ====================
// À appeler une seule fois pour migrer les utilisateurs existants
exports.migrateExistingUsers = functions.https.onCall(async (data, context) => {
  try {
    console.log('🚀 Début de la migration des utilisateurs existants...');
    
    // Récupérer toutes les données de preinscription
    const snapshot = await admin.firestore().collection('preinscription').get();
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'Aucune donnée à migrer dans preinscription'
      };
    }
    
    console.log(`📊 ${snapshot.size} utilisateurs trouvés pour migration`);
    
    const batch = admin.firestore().batch();
    let migrated = 0;
    
    // Traiter chaque utilisateur
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Créer dans preinscription_public (sans email/IP)
      const publicRef = admin.firestore()
        .collection('preinscription_public')
        .doc(data.username);
        
      const publicData = {
        username: data.username,
        generatedFounderCode: data.generatedFounderCode,
        referralsCount: data.referralsCount || 0,
        bestFlappyBirdScore: data.bestFlappyBirdScore || 0,
        timestamp: data.timestamp,
        status: data.status || 'active',
        lastGamePlayed: data.lastGamePlayed || null,
        founderCodeUsed: data.founderCodeUsed || null,
        lastReferralDate: data.lastReferralDate || null,
        
        // ✅ email et registrationIP EXCLUS
        migrationDate: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(publicRef, publicData);
      migrated++;
    });
    
    // Executer la migration
    await batch.commit();
    
    console.log(`✅ Migration terminée: ${migrated} utilisateurs migrés`);
    
    return {
      success: true,
      message: `Migration réussie: ${migrated} utilisateurs migrés vers preinscription_public`,
      migrated: migrated
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw new functions.https.HttpsError('internal', 'Erreur lors de la migration: ' + error.message);
  }
}); 