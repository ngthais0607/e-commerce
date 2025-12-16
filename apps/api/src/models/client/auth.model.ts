import { query, queryOne, insert, execute } from '../../config/database.js';

export interface ClientData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

export interface Client {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}

export const authClientModel = {
  async findByEmail(email: string): Promise<Client | null> {
    const client = await queryOne<{
      id: number;
      email: string;
      password: string;
      name: string;
      phone: string | null;
      role: string;
      isActive: boolean;
      createdAt: Date;
    }>(
      `SELECT id, email, password, name, phone, role, isActive, createdAt 
       FROM clients 
       WHERE email = ? AND isActive = 1`,
      [email]
    );

    if (!client) return null;

    return {
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      role: client.role,
      createdAt: client.createdAt,
    };
  },

  async findByEmailWithPassword(email: string) {
    return queryOne<{
      id: number;
      email: string;
      password: string;
      name: string;
      phone: string | null;
      role: string;
      isActive: boolean;
    }>(
      `SELECT id, email, password, name, phone, role, isActive 
       FROM clients 
       WHERE email = ? AND isActive = 1`,
      [email]
    );
  },

  async createClient(data: ClientData) {
    const clientId = await insert(
      `INSERT INTO clients (email, password, name, phone, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        data.email,
        data.password,
        data.name,
        data.phone || null,
        data.role || 'CUSTOMER',
      ]
    );

    const client = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
    }>(
      `SELECT id, email, name, role 
       FROM clients 
       WHERE id = ?`,
      [clientId]
    );

    return client;
  },

  async findById(id: number): Promise<Client | null> {
    const client = await queryOne<{
      id: number;
      email: string;
      name: string;
      phone: string | null;
      role: string;
      createdAt: Date;
    }>(
      `SELECT id, email, name, phone, role, createdAt 
       FROM clients 
       WHERE id = ? AND isActive = 1`,
      [id]
    );

    if (!client) return null;

    return {
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      role: client.role,
      createdAt: client.createdAt,
    };
  },

  async updatePassword(clientId: number, hashedPassword: string): Promise<boolean> {
    const affectedRows = await execute(
      `UPDATE clients 
       SET password = ?, updatedAt = NOW() 
       WHERE id = ? AND isActive = 1`,
      [hashedPassword, clientId]
    );
    return affectedRows > 0;
  },

  async createResetToken(clientId: number, token: string, expiresAt: Date): Promise<number> {
    // Delete any existing tokens for this client
    await execute(
      `DELETE FROM password_reset_tokens WHERE clientId = ?`,
      [clientId]
    );

    // Create new token
    const tokenId = await insert(
      `INSERT INTO password_reset_tokens (clientId, token, expiresAt, used, createdAt)
       VALUES (?, ?, ?, 0, NOW())`,
      [clientId, token, expiresAt]
    );

    return tokenId;
  },

  async findResetToken(token: string): Promise<{
    id: number;
    clientId: number;
    expiresAt: Date;
    used: boolean;
  } | null> {
    return queryOne<{
      id: number;
      clientId: number;
      expiresAt: Date;
      used: boolean;
    }>(
      `SELECT id, clientId, expiresAt, used 
       FROM password_reset_tokens 
       WHERE token = ? AND used = 0 AND expiresAt > NOW()`,
      [token]
    );
  },

  async markResetTokenAsUsed(tokenId: number): Promise<boolean> {
    const affectedRows = await execute(
      `UPDATE password_reset_tokens 
       SET used = 1 
       WHERE id = ?`,
      [tokenId]
    );
    return affectedRows > 0;
  },

  async deleteExpiredTokens(): Promise<number> {
    const affectedRows = await execute(
      `DELETE FROM password_reset_tokens 
       WHERE expiresAt < NOW() OR used = 1`,
      []
    );
    return affectedRows;
  },
};

