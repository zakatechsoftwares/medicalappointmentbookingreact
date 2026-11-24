import mongoose from "mongoose";

const MAX_RETRIES = 3;

export default async function connectToMongo(uri, dbName, attempt = 1) {
  try {
    await mongoose.connect(uri, { dbName });
    console.info("Connected to MongoDB");
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
    if (attempt >= MAX_RETRIES) {
      throw new Error("Unable to connect to MongoDB");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    return connectToMongo(uri, dbName, attempt + 1);
  }
}
