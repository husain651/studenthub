import { initDatabase } from "../src/lib/db/index.js";
import { seedDatabase } from "../src/lib/db/seed-data.js";

async function run() {
  try {
    console.log("Initializing database schema...");
    await initDatabase();
    console.log("Seeding data...");
    await seedDatabase();
    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

run();
