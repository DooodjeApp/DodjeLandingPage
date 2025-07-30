const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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