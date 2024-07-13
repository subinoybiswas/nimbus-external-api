import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { normalizer } from "./helpers/normalizer"
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from "dotenv";
import { Readable } from 'stream';
import getFormattedName from './helpers/getFormattedName';
import { convertWithSharp } from './helpers/convertWithSharp';
import ratelimit from 'express-rate-limit';

dotenv.config();

const s3Client = new S3Client();
const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  origin: [process.env.PUBLIC_URL as string],
  methods: ["GET"]
}));
app.use(express.json());

const limiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

app.use(limiter)

const originalBucket = process.env.S3_ORIGINAL_IMAGE_BUCKET as string;
console.log("Original Bucket", originalBucket);
app.get('*', async (req, res) => {
  const originalURL = req.url;
  const sendObj = normalizer(originalURL);


  if (!originalBucket || !sendObj.pathname || sendObj.pathname === '/') {
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  const originalparams = {
    Bucket: originalBucket,
    Key: sendObj.pathname.substring(1) as string

  };
  // console.log("Params", params);
  // console.log("SendObj", sendObj);
  if (!sendObj.format && !sendObj.width && !sendObj.height && !sendObj.quality) {
    try {
      const GetOriginalCmd = new GetObjectCommand(originalparams);
      const out = await s3Client.send(GetOriginalCmd);
      console.log(out.ContentType);
      if (out.ContentType) {
        res.setHeader("Content-Type", out.ContentType);
        // res.setHeader('Content-Disposition', `attachment; filename="${originalparams.Key}"`);
      }
      res.status(200);
      const readableStream = Readable.from(out.Body as any);
      return readableStream.pipe(res);
    } catch (err) {
      if ((err as Error).name === "NoSuchKey") {
        console.error(err);
        return res.status(500).json({ error: "Image Not Found" });
      }
      const errorDetails = {
        message: (err as Error).message,
        name: (err as Error).name,
        stack: (err as Error).stack
      };
      console.error(errorDetails);
      return res.status(500).json({ error: "Error fetching the item" });
    }
  } else {
    //Check if formatted exists
    //Format Image Upload to S3

    const formattedBucket = process.env.S3_FORMATTED_IMAGE_BUCKET as string;
    const formattedName = getFormattedName(sendObj)

    console.log(formattedName)

    const formattedparams = {
      Bucket: formattedBucket,
      Key: formattedName
    };
    // console.log(sendObj)
    try {
      const GetTransformedCmd = new GetObjectCommand(formattedparams);
      const out = await s3Client.send(GetTransformedCmd);
      if (out.ContentType) {
        res.setHeader("Content-Type", out.ContentType);
        // res.setHeader('Content-Disposition', `attachment; filename="${formattedName}"`);
        //Set this to use download
      }
      res.status(200);
      const readableStream = Readable.from(out.Body as any);
      return readableStream.pipe(res);

    } catch (err) {
      try {

        if ((err as Error).name === "NoSuchKey") {

          const GetOriginalCmd = new GetObjectCommand(originalparams);
          const out = await s3Client.send(GetOriginalCmd);
          const { type, transformed } = await convertWithSharp(out, sendObj)
          const transformedBuffer = await transformed.toBuffer();
          const putParams = {
            Body: transformedBuffer,
            Bucket: formattedBucket,
            Key: formattedName,
            ContentType: type,
            Metadata: {
              'cache-control': "60",
            },
          }
          const PutImageCmd = new PutObjectCommand(putParams)
          await s3Client.send(PutImageCmd);
          if (type) {
            res.setHeader("Content-Type", type);
          } else {
            res.setHeader("Content-Type", "");
          }
          res.status(200);
          const readableStream = Readable.from([transformedBuffer]);
          return readableStream.pipe(res);

        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error Transforming Image" });
      }
      console.error((err as Error));
      return res.status(500).json(err);
    }
  }
});

export default app;
