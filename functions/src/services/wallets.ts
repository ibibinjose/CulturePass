import { db } from '../admin';

export interface FirestoreWallet {
  userId: string;
  balanceCents: number;
  currency: string;
  points: number;
  transactions: FirestoreWalletTransaction[];
  updatedAt: string;
}

export interface FirestoreWalletTransaction {
  id: string;
  type: 'charge' | 'refund' | 'debit' | 'cashback';
  amountCents: number;
  description: string;
  createdAt: string;
}

const walletsCol = () => db.collection('wallets');

export const walletsService = {
  async get(userId: string): Promise<FirestoreWallet | null> {
    const snap = await walletsCol().doc(userId).get();
    if (!snap.exists) return null;
    const data = snap.data() as Partial<FirestoreWallet>;
    return {
      userId,
      balanceCents: Number(data.balanceCents ?? 0),
      currency: String(data.currency ?? 'AUD'),
      points: Number(data.points ?? 0),
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    };
  },

  async getOrCreate(userId: string): Promise<FirestoreWallet> {
    const ref = walletsCol().doc(userId);
    const snap = await ref.get();
    if (snap.exists) {
      return (await this.get(userId)) as FirestoreWallet;
    }
    const wallet: FirestoreWallet = {
      userId,
      balanceCents: 0,
      currency: 'AUD',
      points: 0,
      transactions: [],
      updatedAt: new Date().toISOString(),
    };
    await ref.set(wallet);
    return wallet;
  },

  async topup(userId: string, amountCents: number, description = 'Wallet top up'): Promise<FirestoreWallet> {
    const now = new Date().toISOString();
    await db.runTransaction(async (transaction) => {
      const ref = walletsCol().doc(userId);
      const snap = await transaction.get(ref);
      const current = snap.exists
        ? (snap.data() as FirestoreWallet)
        : {
            userId,
            balanceCents: 0,
            currency: 'AUD',
            points: 0,
            transactions: [],
            updatedAt: now,
          };

      const tx: FirestoreWalletTransaction = {
        id: db.collection('_tmp').doc().id,
        type: 'charge',
        amountCents,
        description,
        createdAt: now,
      };

      transaction.set(ref, {
        ...current,
        balanceCents: (current.balanceCents ?? 0) + amountCents,
        transactions: [tx, ...(current.transactions ?? [])].slice(0, 200),
        updatedAt: now,
      });
    });
    return (await this.get(userId)) as FirestoreWallet;
  },

  async deductBalance(userId: string, amountCents: number, description = 'Wallet payment'): Promise<FirestoreWallet> {
    const now = new Date().toISOString();
    await db.runTransaction(async (transaction) => {
      const ref = walletsCol().doc(userId);
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new Error('WALLET_NOT_FOUND');

      const current = snap.data() as FirestoreWallet;
      const currentBalance = current.balanceCents ?? 0;
      if (currentBalance < amountCents) throw new Error('INSUFFICIENT_BALANCE');

      const tx: FirestoreWalletTransaction = {
        id: db.collection('_tmp').doc().id,
        type: 'debit',
        amountCents,
        description,
        createdAt: now,
      };

      transaction.update(ref, {
        balanceCents: currentBalance - amountCents,
        transactions: [tx, ...(current.transactions ?? [])].slice(0, 200),
        updatedAt: now,
      });
    });
    return (await this.get(userId)) as FirestoreWallet;
  },

  async addTransaction(
    userId: string,
    transactionData: Omit<FirestoreWalletTransaction, 'id' | 'createdAt'> & { createdAt?: string }
  ): Promise<FirestoreWallet> {
    const now = transactionData.createdAt ?? new Date().toISOString();
    const tx: FirestoreWalletTransaction = {
      id: db.collection('_tmp').doc().id,
      createdAt: now,
      ...transactionData,
    };
    await db.runTransaction(async (transaction) => {
      const ref = walletsCol().doc(userId);
      const snap = await transaction.get(ref);
      const current = snap.exists
        ? (snap.data() as FirestoreWallet)
        : {
            userId,
            balanceCents: 0,
            currency: 'AUD',
            points: 0,
            transactions: [],
            updatedAt: now,
          };

      const balanceDelta = tx.type === 'refund' || tx.type === 'cashback' ? tx.amountCents : 0;
      transaction.set(ref, {
        ...current,
        balanceCents: (current.balanceCents ?? 0) + balanceDelta,
        transactions: [tx, ...(current.transactions ?? [])].slice(0, 200),
        updatedAt: now,
      });
    });
    return (await this.get(userId)) as FirestoreWallet;
  },

  async addPoints(userId: string, points: number): Promise<FirestoreWallet> {
    if (!Number.isFinite(points) || points <= 0) {
      return this.getOrCreate(userId);
    }
    const now = new Date().toISOString();
    await db.runTransaction(async (transaction) => {
      const ref = walletsCol().doc(userId);
      const snap = await transaction.get(ref);
      const current = snap.exists
        ? (snap.data() as FirestoreWallet)
        : {
            userId,
            balanceCents: 0,
            currency: 'AUD',
            points: 0,
            transactions: [],
            updatedAt: now,
          };
      transaction.set(ref, {
        ...current,
        points: (current.points ?? 0) + Math.floor(points),
        updatedAt: now,
      });
    });
    return (await this.get(userId)) as FirestoreWallet;
  },
};
