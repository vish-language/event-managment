import dotenv from 'dotenv'
dotenv.config();
import express from 'express'
import cookieParser from 'cookie-parser';

import connectDb from './config/dbConnect.js';
import authRoutes from './routes/auth.routes.js';
import passport from "./config/passportConfig.js";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth' , authRoutes)


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDb();

    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};
startServer();