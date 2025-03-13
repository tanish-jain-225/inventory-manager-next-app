import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

/**
 * MongoDB connection configuration
 * SECURITY CRITICAL: These credentials should be moved to environment variables immediately
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
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
    // In development, use a global variable to maintain connection across hot reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    // In production, avoid using global variables
    if (!clientPromise) {
      const client = new MongoClient(MONGODB_URI);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
};

/**
 * GET handler - Retrieves all products from the inventory
 * @param {Request} request - The incoming HTTP request
 * @returns {NextResponse} JSON response with all products or error
 */
export async function GET(request) {
  try {
    // Connect to database
    const client = await getMongoClient();
    const database = client.db(DB_NAME);
    const inventory = database.collection(COLLECTION_NAME);
    
    // Fetch all products
    const products = await inventory.find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length
    });
  } catch (error) {
    console.error("Product API GET error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to retrieve products" 
    }, { 
      status: 500 
    });
  }
}

/**
 * POST handler - Adds a new product to the inventory
 * @param {Request} request - The incoming HTTP request with product data
 * @returns {NextResponse} JSON response with operation result
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.slug || body.slug.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: "Product name (slug) is required" 
      }, { 
        status: 400 
      });
    }
    
    if (!body.quantity || isNaN(Number(body.quantity)) || Number(body.quantity) <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Quantity must be a positive number" 
      }, { 
        status: 400 
      });
    }
    
    if (!body.price || isNaN(Number(body.price)) || Number(body.price) <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Price must be a positive number" 
      }, { 
        status: 400 
      });
    }
    
    // Connect to database
    const client = await getMongoClient();
    const database = client.db(DB_NAME);
    const inventory = database.collection(COLLECTION_NAME);
    
    // Check if product already exists
    const existingProduct = await inventory.findOne({ slug: body.slug });
    if (existingProduct) {
      return NextResponse.json({ 
        success: false, 
        error: "A product with this name already exists" 
      }, { 
        status: 409 // Conflict
      });
    }
    
    // Insert new product
    const result = await inventory.insertOne({
      slug: body.slug,
      quantity: Number(body.quantity),
      price: Number(body.price)
    });
    
    return NextResponse.json({ 
      success: true, 
      result,
      product: {
        slug: body.slug,
        quantity: Number(body.quantity),
        price: Number(body.price)
      }
    }, { 
      status: 201 // Created
    });
    
  } catch (error) {
    console.error("Product API POST error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to add product" 
    }, { 
      status: 500 
    });
  }
}