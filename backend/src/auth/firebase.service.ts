import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(), 
        });
      } catch (error: any) {
        console.warn('Firebase admin initialization failed (expected if no credentials provided yet).', error.message);
      }
    }
  }

  async verifyIdToken(idToken: string) {
    try {
      if (!admin.apps.length) {
        throw new Error('Firebase is not initialized. Please set up Firebase Admin credentials.');
      }
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error: any) {
      throw new UnauthorizedException('Invalid Firebase ID Token: ' + error.message);
    }
  }
}
