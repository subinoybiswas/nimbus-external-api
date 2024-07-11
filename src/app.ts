import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { normalizer } from "./helpers/normalizer"

require('dotenv').config();

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('*', (req, res) => {
  const originalURL = req.url;
  const sendObj = normalizer(originalURL)
  res.json(sendObj).status(200)
});




export default app;
