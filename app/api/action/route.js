import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import "dotenv/config"; // Load environment variables

/**
 * MongoDB connection configuration
 * SECURITY CRITICAL: These credentials must be moved to environment variables
 */
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

// Connection options
const options = {};

// Connection caching
let client;
let clientPromise;

/**
 * Initialize and cache MongoDB client connection
 */
if (!MONGODB_URI) {
  throw new Error("MongoDB URI is required. Please add it to your environment variables.");
}

// Different connection handling for development vs production
if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve connection during hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new connection
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

/**
 * POST handler - Updates product quantity or removes product if quantity becomes zero
 * @param {Request} request - Incoming HTTP request with action data
 * @returns {NextResponse} JSON response with operation result
 */
export async function POST(request) {
  try {
    // Parse request body
    const { action, slug, initialQuantity } = await request.json();
    
    // Input validation
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: "Product slug is required" 
      }, { 
        status: 400 
      });
    }
    
    if (!action || (action !== 'plus' && action !== 'minus')) {
      return NextResponse.json({ 
        success: false, 
        error: "Valid action (plus/minus) is required" 
      }, { 
        status: 400 
      });
    }
    
    if (initialQuantity === undefined || isNaN(Number(initialQuantity))) {
      return NextResponse.json({ 
        success: false, 
        error: "Valid initial quantity is required" 
      }, { 
        status: 400 
      });
    }
    
    // Connect to database
    const client = await clientPromise;
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);
    
    // Calculate new quantity
    const filter = { slug: slug };
    const newQuantity = action === "plus" ? 
      (parseInt(initialQuantity) + 1) : 
      (parseInt(initialQuantity) - 1);
    
    // Update or delete based on new quantity
    if (newQuantity > 0) {
      // Update the product quantity
      const updateDoc = { $set: { quantity: newQuantity } };
      await collection.updateOne(filter, updateDoc);
    } else {
      // Remove the product if quantity is zero or negative
      await collection.deleteOne(filter);
    }

    return NextResponse.json({ 
      success: true,
      action,
      slug,
      newQuantity
    });
  } catch (error) {
    console.error("Action API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update product quantity" 
    }, { 
      status: 500 
    });
  }
}