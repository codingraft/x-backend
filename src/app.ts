import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/user.routes.js';
import eventRoutes from './routes/event.routes.js';
import cors from 'cors';
import morgan from 'morgan';

dotenv.config();
const app = express();

// CORS configuration - allow your frontend domains
const allowedOrigins = [
  "http://localhost:5173",
  "https://event-mangement-frontend.vercel.app",
  "https://event-mangement-backend-r5n2.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));
connectDB();


app.get('/', (_, res) => {
  res.send('Hello World!'); 
});

app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes); 
 
const PORT = process.env.PORT
 
app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT}`)
});         
