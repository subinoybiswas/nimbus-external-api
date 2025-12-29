import Sharp from "sharp";
import { GetObjectCommandOutput } from "@aws-sdk/client-s3";

export async function getImageSize(out: GetObjectCommandOutput) {
  try {
    const image = out.Body?.transformToByteArray();
    const imageBuffer = await image;

    if (!imageBuffer) {
      throw new Error("Failed to transform image to buffer");
    }

    const metadata = await Sharp(imageBuffer, { failOn: "none" }).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    console.error("Error getting image size:", error);
    throw error;
  }
}
