import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import "dotenv/config"; // Load environment variables

/**
 * MongoDB connection configuration
 * SECURITY CRITICAL: These credentials must be moved to environment variables
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tanish-jain-225:tanishjain02022005@cluster0.578qvco.mongodb.net/';
const DB_NAME = process.env.DB_NAME || 'stock';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'inventory';

// Connection options
const options = {};

// Connection caching
let client;
let clientPromise;

/**
 * Initialize and cache MongoDB client connection
 */
if (!MONGODB_URI) {
  console.warn("MongoDB URI not found in environment variables. Using fallback.");
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
 * GET handler - Retrieves all products from inventory
 * @param {Request} request - Incoming HTTP request
 * @returns {NextResponse} JSON response with inventory data or error
 */
export async function GET(request) {
  try {
    // Connect to database
    const client = await clientPromise;
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Fetch all inventory items
    const inventory = await collection.find({}).toArray();

    // Return successful response
    return NextResponse.json({ 
      success: true, 
      inventory,
      count: inventory.length 
    });
  } catch (error) {
    // Log error and return appropriate response
    console.error("MongoDB GET error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch inventory data" 
    }, { 
      status: 500 
    });
  }
}

/**
 * POST handler - Adds a new product to inventory
 * @param {Request} request - Incoming HTTP request with product data
 * @returns {NextResponse} JSON response with operation result
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: "Product name (slug) is required" 
      }, { 
        status: 400 
      });
    }
    
    // Connect to database
    const client = await clientPromise;
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Check for duplicate product
    const existingProduct = await collection.findOne({ slug: body.slug });
    if (existingProduct) {
      return NextResponse.json({ 
        success: false, 
        error: "A product with this name already exists" 
      }, { 
        status: 409 
      });
    }

    // Format the product data
    const product = {
      slug: body.slug,
      quantity: Number(body.quantity) || 0,
      price: Number(body.price) || 0
    };

    // Insert the product
    const result = await collection.insertOne(product);

    // Return successful response
    return NextResponse.json({ 
      success: true, 
      result,
      product
    }, { 
      status: 201 
    });
  } catch (error) {
    // Log error and return appropriate response
    console.error("MongoDB POST error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to add product" 
    }, { 
      status: 500 
    });
  }
}