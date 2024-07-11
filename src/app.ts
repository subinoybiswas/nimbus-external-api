import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { normalizer } from "./helpers/normalizer"
import aws from 'aws-sdk';
import dotenv from "dotenv";

dotenv.config();
aws.config.update({ region: process.env.AWS_REGION });

const s3 = new aws.S3();

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

const originalBucket = process.env.S3_ORIGINAL_IMAGE_BUCKET as string;
console.log("Original Bucket", originalBucket);
app.get('*', async (req, res) => {
  const originalURL = req.url;
  const sendObj = normalizer(originalURL);


  if (!originalBucket || !sendObj.pathname || sendObj.pathname === '/') {
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  const params = {
    Bucket: originalBucket,
    Key: sendObj.pathname.substring(1) as string
  };
  console.log("Params", params);
  console.log("SendObj", sendObj);
  if (!sendObj.format && !sendObj.width && !sendObj.height && !sendObj.quality) {
    try {
      s3.getObject(params, (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "File doesn't Exist" });
        } else {
          console.log('File downloaded successfully');
          return res.send(data.Body).status(200);
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server Error" });
    }
  } else {
    return res.status(200).json(sendObj);
  }
});

export default app;
