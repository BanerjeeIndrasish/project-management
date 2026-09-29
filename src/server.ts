import * as dotenv from 'dotenv';
import { app } from './app';
dotenv.config();

const PORT = process.env.DB_PORT;
const BASE_URL = process.env.BASE_URL;

app.listen(PORT, () => {
  console.log(`DevFlow backend running on ${BASE_URL}:${PORT ?? 5000}`);
})