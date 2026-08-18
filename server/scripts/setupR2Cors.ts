// One-time setup: allows browsers to PUT files directly to the R2 bucket via
// presigned URLs. Re-run after adding a new site origin.
//   npx tsx scripts/setupR2Cors.ts
import { PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { r2Client, r2Bucket, isR2Configured } from '../src/config/r2';

const ORIGINS = Array.from(
  new Set(
    [
      'http://localhost:5173',
      process.env.APP_URL || '',
      'https://kathrynandnicholas.com',
      'https://www.kathrynandnicholas.com',
    ].filter(Boolean),
  ),
);

async function main() {
  if (!isR2Configured()) {
    throw new Error('R2 env vars missing (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  }

  await r2Client.send(
    new PutBucketCorsCommand({
      Bucket: r2Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ORIGINS,
            AllowedMethods: ['GET', 'HEAD', 'PUT'],
            AllowedHeaders: ['content-type'],
            ExposeHeaders: ['etag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  const current = await r2Client.send(new GetBucketCorsCommand({ Bucket: r2Bucket }));
  console.log(`CORS rules set on bucket "${r2Bucket}":`);
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((err) => {
  console.error('Failed to set CORS rules:', err);
  process.exit(1);
});
