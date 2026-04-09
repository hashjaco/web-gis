import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile, writeFile, mkdir, unlink, stat } from "node:fs/promises";
import { join, extname } from "node:path";

interface StorageResult {
  key: string;
  url: string;
}

const UPLOAD_DIR = join(process.cwd(), "uploads");

const BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

function getS3Client(): S3Client | null {
  if (!BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT, forcePathStyle: true }),
  });
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<StorageResult> {
  const s3 = getS3Client();

  if (s3 && BUCKET) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      }),
    );

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: filename }),
      { expiresIn: SIGNED_URL_EXPIRY },
    );

    return { key: filename, url };
  }

  // Local fallback for development
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return { key: filename, url: `/api/uploads/${filename}` };
}

export async function getFileUrl(key: string): Promise<string | null> {
  const s3 = getS3Client();

  if (s3 && BUCKET) {
    try {
      return await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: SIGNED_URL_EXPIRY },
      );
    } catch {
      return null;
    }
  }

  // Local fallback
  const filePath = join(UPLOAD_DIR, key);
  try {
    await stat(filePath);
    return `/api/uploads/${key}`;
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const s3 = getS3Client();

  if (s3 && BUCKET) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return;
  }

  // Local fallback
  try {
    await unlink(join(UPLOAD_DIR, key));
  } catch {
    // File may not exist
  }
}

export async function getFileBuffer(key: string): Promise<Buffer | null> {
  const s3 = getS3Client();

  if (s3 && BUCKET) {
    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      );
      if (!response.Body) return null;
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  // Local fallback
  try {
    return await readFile(join(UPLOAD_DIR, key));
  } catch {
    return null;
  }
}
