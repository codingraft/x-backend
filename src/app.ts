import express from 'express';
import { connectDB } from './utils/lib.js';
import authRoutes from './routes/auth.route.js';
import usersRoutes from './routes/users.route.js';
import postsRoutes from './routes/posts.route.js';
import notificationsRoutes from './routes/notifications.route.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import morgan from 'morgan';
dotenv.config();
 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173", // <-- frontend origin
  credentials: true, // <-- MUST be true to allow cookies
}));
app.use(express.json({ limit: '1000kb' }));
app.use(morgan('dev'));

const PORT = process.env.PORT || 6000;

   

app.get('/', (_, res) => {
    res.send('Hello World!');
});
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/posts', postsRoutes)
app.use('/api/v1/notifications', notificationsRoutes)

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});