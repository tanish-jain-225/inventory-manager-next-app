import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const user = 'tanish-jain-225'
const pass = "tanishjain02022005"
const stockStr = 'stock'
const collections = "inventory"

const uri = `mongodb+srv://${user}:${pass}@cluster0.578qvco.mongodb.net/${stockStr}`;
const options = {};

let client;
let clientPromise;

if (!uri) {
    throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so the client can be reused
    // across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export async function GET(request) {
    try {
        const query = request.nextUrl.searchParams.get('query'); // Get the query parameter from the request URL
        const client = await clientPromise;
        const database = client.db(stockStr);
        const collection = database.collection(collections);

        // Constructing the pipeline to search by 'slug' field using regex
        const pipeline = [
            {
                $match: {
                    slug: { $regex: query, $options: 'i' } 
                    // Case-insensitive regex match on 'slug'
                }
            }
        ];

        const products = await collection.aggregate(pipeline).toArray();

        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An error occurred while fetching the collection." }, { status: 500 });
    }
}
