import path from "path";
import { readFileSync } from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const collectionFile = "./temp/collection.json";
const enrichmentsFile = "./temp/openAIEnrichments.json";
const bucketName = "tylergaw-assets";
const objectPrefix = "wax-tracks/data";
const s3Client = new S3Client({});

async function upload(filePath) {
  const key = path.basename(filePath);
  const body = readFileSync(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `${objectPrefix}/${key}`,
      Body: body,
    }),
  );
}

try {
  console.log(`Uploading collection file to ${bucketName}...`);
  await upload(collectionFile);
  console.log("Collection upload complete");
  console.log(`Uploading enrichments file to ${bucketName}...`);
  await upload(enrichmentsFile);
  console.log("Upload complete");
  process.exit(0);
} catch (err) {
  console.log(err);
  process.exit(1);
}
