import dotenv from "dotenv";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

dbConnect()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to run the server :: ", err);
  });
