import type { User } from '../../domain/entities';
import type { CreateUserInput, UserRepo } from '../../ports/user-repo';
import { getFirestore } from './firestore-client';

const USERS_COLLECTION = 'users';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function toUser(data: FirebaseFirestore.DocumentData, id: string): User {
  const createdAt = data.createdAt?.toDate?.() ?? new Date(data.createdAt);
  return {
    userId: data.userId,
    name: data.name,
    passwordHash: data.passwordHash,
    email: data.email,
    phone: data.phone,
    createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
  };
}

export class FirestoreUserRepo implements UserRepo {
  private get col() {
    return getFirestore().collection(USERS_COLLECTION);
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const docId = normalizeName(data.name);
    const ref = this.col.doc(docId);

    const existing = await ref.get();
    if (existing.exists) {
      const err = new Error('USERNAME_TAKEN') as Error & { code: string };
      err.code = 'USERNAME_TAKEN';
      throw err;
    }

    const userId = crypto.randomUUID();
    const createdAt = new Date();
    const doc = {
      userId,
      name: data.name.trim(),
      passwordHash: data.passwordHash,
      email: data.email ?? null,
      phone: data.phone ?? null,
      createdAt,
    };
    await ref.set(doc);
    return toUser(doc, docId);
  }

  async findByName(name: string): Promise<User | null> {
    const docId = normalizeName(name);
    const snap = await this.col.doc(docId).get();
    if (!snap.exists) return null;
    return toUser(snap.data()!, snap.id);
  }

  async findById(userId: string): Promise<User | null> {
    const snap = await this.col.where('userId', '==', userId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return toUser(doc.data(), doc.id);
  }

  async listUsers(limit: number): Promise<User[]> {
    const snap = await this.col.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => toUser(d.data(), d.id));
  }
}
