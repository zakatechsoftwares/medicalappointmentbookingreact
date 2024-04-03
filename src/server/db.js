//const mongoose = require('mongoose');
import mongoose from "mongoose";
const mongoURI =
  "mongodb+srv://zakatechsoftware:0UXADJxWxsEMSGgc@cluster0.up6m5c8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; //0UXADJxWxsEMSGgc //"mongodb://root:<your-password>@127.0.0.1:27017";

const connectToMongo = async (retryCount) => {
  const MAX_RETRIES = 3;
  const count = retryCount ?? 0;
  try {
    await mongoose.connect(mongoURI, { dbName: "stayhealthybeta1" });
    console.info("Connected to Mongo Successfully");

    return;
  } catch (error) {
    console.error(error);

    const nextRetryCount = count + 1;

    if (nextRetryCount >= MAX_RETRIES) {
      throw new Error("Unable to connect to Mongo!");
    }

    console.info(`Retrying, retry count: ${nextRetryCount}`);

    return await connectToMongo(nextRetryCount);
  }
};

//module.exports = connectToMongo;
export default connectToMongo;
