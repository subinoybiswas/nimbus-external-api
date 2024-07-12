import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { normalizer } from "./helpers/normalizer"
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from "dotenv";
import Sharp from 'sharp';

dotenv.config();
const s3Client = new S3Client();

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
  // console.log("Params", params);
  // console.log("SendObj", sendObj);
  if (!sendObj.format && !sendObj.width && !sendObj.height && !sendObj.quality) {
    try {
      const GetOriginalCmd = new GetObjectCommand(params);
      const out = await s3Client.send(GetOriginalCmd);
      return res.send(out.Body).status(200);
    } catch (err) {
      if (err && (err as { name: string }).name === "NoSuchKey") {
        return res.status(404).json({ error: "Image Not Found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Error Downloading Image" });
    }
  } else {
    //Check if formatted exists
    //Format Image Upload to S3

    const formattedBucket = process.env.S3_FORMATTED_IMAGE_BUCKET as string;
    let formattedName = sendObj.pathname.substring(1).split('.')[0];
    if (sendObj.format) {
      formattedName += `.${sendObj.format}`;
    } else {
      formattedName += `${sendObj.pathname.substring(1).split('.')[1]}`;
    }
    if (sendObj.width) {
      formattedName += `_${sendObj.width}w`;
    }
    if (sendObj.height) {
      formattedName += `_${sendObj.height}h`;
    }
    if (sendObj.quality) {
      formattedName += `_${sendObj.quality}q`;
    }

    console.log(formattedName)

    const params = {
      Bucket: formattedBucket,
      Key: formattedName
    };
    // console.log(sendObj)
    try {
      const GetTransformedCmd = new GetObjectCommand(params);
      const out = await s3Client.send(GetTransformedCmd);
      return res.send(out.Body).status(200);
    } catch (err) {
      if (err && (err as { name: string }).name === "NoSuchKey") {
        return res.status(404).json({ error: "Transformed Image Not Found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Error Fetching" });
    }
  }
});

export default app;
