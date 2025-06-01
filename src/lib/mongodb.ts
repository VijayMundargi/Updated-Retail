
import { MongoClient, ServerApiVersion, Db, Collection, ObjectId } from 'mongodb';
import type { Product, Branch, Customer, User, Sale, StoreSettings } from './types';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI environment variable is not defined.');
  throw new Error('Please define the MONGODB_URI environment variable inside .env or similar');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    console.log("Using cached MongoDB connection.");
    return cachedDb;
  }

  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas!");
    const dbName = process.env.MONGODB_DB_NAME || 'storefront_mvp_db';
    console.log(`Using database: ${dbName}`);
    const db = client.db(dbName); 
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB Atlas", error);
    throw error;
  }
}

export async function getProductsCollection(): Promise<Collection<Omit<Product, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<Product, 'id'>>('products');
}

export async function getBranchesCollection(): Promise<Collection<Omit<Branch, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<Branch, 'id'>>('branches');
}

export async function getCustomersCollection(): Promise<Collection<Omit<Customer, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<Customer, 'id'>>('customers');
}

export async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<User, 'id'>>('users');
}

export async function getSalesCollection(): Promise<Collection<Omit<Sale, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<Sale, 'id'>>('sales');
}

export async function getStoreSettingsCollection(): Promise<Collection<Omit<StoreSettings, 'id'>>> {
  const db = await connectToDatabase();
  return db.collection<Omit<StoreSettings, 'id'>>('store_settings');
}

// Optional: A function to close the connection when the app shuts down (useful for scripts, less so for serverless)
export async function closeConnection() {
  if (client) {
    await client.close();
    cachedDb = null;
    console.log("MongoDB connection closed.");
  }
}
