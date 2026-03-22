import { startServer } from "./server/index";

void startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
