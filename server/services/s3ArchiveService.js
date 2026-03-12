import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { gzipSync } from 'zlib'

let cachedClient = null
let cachedConfig = null

function getRequiredEnv(name) {
  const value = String(process.env[name] || '').trim()
  return value
}

function getS3Config() {
  if (cachedConfig) return cachedConfig

  cachedConfig = {
    region: getRequiredEnv('AWS_REGION'),
    bucket: getRequiredEnv('S3_BUCKET_NAME'),
    accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
  }

  return cachedConfig
}

function getS3Client() {
  if (cachedClient) return cachedClient

  const config = getS3Config()
  if (!config.region || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    return null
  }

  cachedClient = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return cachedClient
}

export function isS3ArchiveConfigured() {
  const config = getS3Config()
  return Boolean(config.region && config.bucket && config.accessKeyId && config.secretAccessKey)
}

export function buildTenantArchiveKey({ restaurantId, timestamp = new Date() }) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 10)

  return `restaurants/${restaurantId}/orders/year=${year}/month=${month}/day=${day}/hour=${hour}/batch-${year}${month}${day}-${hour}${minute}-${random}.json.gz`
}

export async function uploadArchiveJsonGzip({ key, payload }) {
  const client = getS3Client()
  const config = getS3Config()
  if (!client) {
    const error = new Error('S3 archive is not configured. Missing AWS/S3 environment variables.')
    error.code = 'S3_NOT_CONFIGURED'
    throw error
  }

  const body = gzipSync(Buffer.from(JSON.stringify(payload)))
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: 'application/json',
    ContentEncoding: 'gzip',
  })

  await client.send(command)

  return {
    bucket: config.bucket,
    key,
    sizeBytes: body.length,
  }
}
