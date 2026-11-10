// Mock database for development without PostgreSQL
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// In-memory storage
const storage = {
  users: [],
  socialAccounts: [],
  posts: [],
  campaigns: [],
  notifications: []
};

// Initialize with sample data
async function initMockDb() {
  logger.info('Initializing mock database');
  
  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  storage.users = [
    {
      id: '1',
      email: 'demo@publift.io',
      password: hashedPassword,
      full_name: 'Demo User',
      plan: 'free',
      credits: 100,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  logger.info('Mock database initialized with demo user');
  logger.info('Login with: demo@publift.io / password123');
}

// Mock query function
async function query(text, params = []) {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Simple query parsing for common operations
  const lowerText = text.toLowerCase();
  
  // Handle SELECT queries
  if (lowerText.includes('select') && lowerText.includes('from users')) {
    if (lowerText.includes('where email')) {
      const email = params[0];
      const user = storage.users.find(u => u.email === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (lowerText.includes('where id')) {
      const id = params[0];
      const user = storage.users.find(u => u.id === id);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    return { rows: storage.users, rowCount: storage.users.length };
  }
  
  // Handle INSERT INTO users
  if (lowerText.includes('insert into users')) {
    const newUser = {
      id: String(storage.users.length + 1),
      email: params[1],
      password: params[2],
      full_name: params[0],
      plan: 'free',
      credits: 100,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    storage.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  
  // Handle social accounts
  if (lowerText.includes('from social_accounts')) {
    const userId = params[0];
    const accounts = storage.socialAccounts.filter(a => a.user_id === userId);
    return { rows: accounts, rowCount: accounts.length };
  }
  
  // Handle notifications
  if (lowerText.includes('from notifications')) {
    return { rows: storage.notifications, rowCount: storage.notifications.length };
  }
  
  // Default empty response
  return { rows: [], rowCount: 0 };
}

// Mock transaction function
async function transaction(callback) {
  const mockClient = { query };
  return await callback(mockClient);
}

// Mock connection
async function connectDatabase() {
  await initMockDb();
  return { query, transaction };
}

module.exports = { connectDatabase, query, transaction, storage };
