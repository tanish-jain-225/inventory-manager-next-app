import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const user = 'tanish-jain-225'
const pass = "tanishjain02022005"
const stockStr = 'stock'
const collections = "inventory"

const uri = `mongodb+srv://${user}:${pass}@cluster0.578qvco.mongodb.net/`;
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


export async function POST(request) {
    try {
        const { action, slug, initialQuantity } = await request.json();
        const client = await clientPromise;
        const database = client.db(`${stockStr}`);
        const collection = database.collection(`${collections}`);
        const filter = { slug: slug }
        let newQuantity = action == "plus" ? (parseInt(initialQuantity) + 1) : (parseInt(initialQuantity) - 1)
        const updateDoc = { $set: { quantity: newQuantity } }
        if ((newQuantity > 0)) {
            await collection.updateOne(filter, updateDoc, options)
        }
        else {
            await collection.deleteOne(filter, updateDoc, options)
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An error occurred while adding the product." }, { status: 500 });
    }

}
