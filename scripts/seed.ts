import { initDatabase, getDbClient } from "../src/lib/db";
import { seedDatabase } from "../src/lib/db/seed-data";

async function main() {
  console.log("--> Testing Database Connection & Schema Init...");
  await initDatabase();
  console.log("--> Schema created successfully.");
  console.log("--> Running Seed...");
  await seedDatabase();
  console.log("--> Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
