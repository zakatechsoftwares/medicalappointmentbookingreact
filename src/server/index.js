import { config } from "./config.js";
import connectToMongo from "./db.js";
import { createApp } from "./app.js";

try {
  await connectToMongo(config.mongoUri, config.dbName);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = createApp(config);
app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
