import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface UsageStatus {
  canProceed: boolean;
  reason?: string;
  count: number;
}

export const checkUsage = async (): Promise<UsageStatus> => {
  const user = auth.currentUser;
  
  if (!user) {
    const demoUsed = typeof window !== 'undefined' && localStorage.getItem('kill_switch_demo_used');
    if (demoUsed) {
      return { canProceed: false, reason: 'Sign up to continue (Demo Used)', count: 1 };
    }
    return { canProceed: true, count: 0 };
  }

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      usageCount: 0,
      email: user.email,
      createdAt: serverTimestamp()
    });
    return { canProceed: true, count: 0 };
  }

  const data = userSnap.data();
  if (data.usageCount >= 5) {
    return { canProceed: false, reason: 'Usage cap reached (5/5)', count: data.usageCount };
  }

  return { canProceed: true, count: data.usageCount };
};

export const logDecision = async (userId: string | 'demo', decisionData: any) => {
  try {
    await addDoc(collection(db, 'decisions'), {
      ...decisionData,
      userId,
      createdAt: serverTimestamp()
    });

    if (userId !== 'demo') {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        usageCount: increment(1),
        lastRequestAt: serverTimestamp()
      });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kill_switch_demo_used', 'true');
      }
    }
  } catch (error) {
    console.error('Error logging decision:', error);
  }
};

export const logAppEvent = async (event: string, metadata: any = {}) => {
  try {
    await addDoc(collection(db, 'logs'), {
      userId: auth.currentUser?.uid || 'guest',
      event,
      metadata,
      timestamp: serverTimestamp(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });
  } catch (error) {
    console.warn('Logging failed', error);
  }
};
