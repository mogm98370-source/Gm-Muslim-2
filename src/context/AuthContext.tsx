import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  gmPoints: number;
  totalEarnedPoints: number;
  role: 'user' | 'admin';
  subscription?: 'weekly' | 'monthly' | 'yearly' | null;
  subscriptionExpiry?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isAdmin: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const isAdmin = currentUser.email === 'larblaablaybla@gmail.com';
        
        if (!userSnap.exists()) {
          const newUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            gmPoints: 0,
            totalEarnedPoints: 0,
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
        } else {
          const data = userSnap.data() as UserData;
          if (isAdmin && data.role !== 'admin') {
            await setDoc(userRef, { role: 'admin' }, { merge: true });
          }
          // ensure fields exist
          if (data.totalEarnedPoints === undefined) {
             await setDoc(userRef, { totalEarnedPoints: data.gmPoints || 0 }, { merge: true });
          }
        }
        
        unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
           if (doc.exists()) {
             setUserData(doc.data() as UserData);
           }
        });
      } else {
        setUserData(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      isAdmin: userData?.role === 'admin',
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
