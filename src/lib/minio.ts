// lib/minio.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "th-bangkok-1",
  endpoint: process.env.MINIO_ENDPOINT, // Adjust if using Docker with a different setup
  credentials: {
    accessKeyId: process.env.MINIO_USER!,
    secretAccessKey: process.env.MINIO_PASSWORD!,
  },
  forcePathStyle: true, // Required for MinIO
});
