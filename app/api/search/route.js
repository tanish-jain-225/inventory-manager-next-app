import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import "dotenv/config"; // Load environment variables

/**
 * MongoDB connection configuration
 * IMPORTANT: Move these credentials to environment variables!
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
// Security risk: Move these to .env.local file
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

// Connection caching for improved performance
let clientPromise;

/**
 * Create and cache MongoDB client connection
 * @returns {Promise<MongoClient>} MongoDB client connection
 */
const getMongoClient = async () => {
  if (!MONGODB_URI) {
    throw new Error("Please add your MongoDB URI to environment variables");
  }

  if (process.env.NODE_ENV === "development") {
    // In development, reuse the client across hot reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    // In production, create new connection if not cached
    if (!clientPromise) {
      const client = new MongoClient(MONGODB_URI);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
};

/**
 * Search API endpoint that queries products by name using regex
 * @param {Request} request - The incoming HTTP request
 * @returns {NextResponse} JSON response with matching products or error
 */
export async function GET(request) {
  try {
    // Input validation
    const query = request.nextUrl.searchParams.get('query');
    
    if (!query || query.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: "Search query is required" 
      }, { status: 400 });
    }

    // Sanitize query to prevent injection (basic implementation)
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Connect to database
    const client = await getMongoClient();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Set a reasonable limit to prevent excessive results
    const limit = 20;
    
    // Query with pagination support
    const products = await collection.find({
      slug: { $regex: sanitizedQuery, $options: 'i' }
    })
    .limit(limit)
    .toArray();

    // Return successful response
    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length,
      limit
    });
    
  } catch (error) {
    console.error("Search API error:", error);
    
    // Return appropriate error response
    return NextResponse.json({ 
      success: false,
      error: "Failed to search products" 
    }, { 
      status: 500 
    });
  }
}