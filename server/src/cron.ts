import cron from "node-cron";
import { autoFetchIdeasOfTheDay } from "./controller/ideaController";

// Schedule daily fetch of ideas at 6 AM
export const initializeCronJobs = () => {
  console.log("⏰ Initializing cron jobs...");
  
  // Run on server startup
  autoFetchIdeasOfTheDay()
    .then(() => console.log("✅ Initial ideas fetch completed on startup"))
    .catch((err) => console.error("❌ Initial ideas fetch failed:", err));

  // Schedule daily at 6 AM
  cron.schedule("0 6 * * *", async () => {
    try {
      console.log("⏰ Running daily ideas fetch...");
      await autoFetchIdeasOfTheDay();
      console.log("✅ Daily ideas fetch completed");
    } catch (err) {
      console.error("❌ Daily ideas fetch failed:", err);
    }
  });
};