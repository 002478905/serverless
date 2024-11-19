import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handler } from "./index.js"; // Adjust path if needed

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Helper to resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the test event from `test.json`
const eventPath = path.resolve(__dirname, "test.json");
const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));

// Run the handler function with the test event
(async () => {
  try {
    const result = await handler(event);
    console.log("Handler result:", result);
  } catch (error) {
    console.error("Error executing handler:", error);
  }
})();
