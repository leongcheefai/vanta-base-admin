import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { serverEnv } from '@vanta-base-admin/env'
import type { PresignAvatarDto } from './dto/presign-avatar.dto'

let _s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: serverEnv.S3_REGION,
      credentials: {
        accessKeyId: serverEnv.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY ?? '',
      },
      ...(serverEnv.S3_ENDPOINT ? { endpoint: serverEnv.S3_ENDPOINT, forcePathStyle: false } : {}),
    })
  }
  return _s3Client
}

function getExtension(contentType: PresignAvatarDto['contentType']): string {
  const map: Record<PresignAvatarDto['contentType'], string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }
  return map[contentType]
}

@Injectable()
export class UploadsService {
  async presignAvatar(
    userId: string,
    input: PresignAvatarDto,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (
      !serverEnv.S3_BUCKET ||
      !serverEnv.S3_ACCESS_KEY_ID ||
      !serverEnv.S3_SECRET_ACCESS_KEY ||
      !serverEnv.S3_PUBLIC_URL
    ) {
      throw new ServiceUnavailableException('Storage unavailable')
    }

    const ext = getExtension(input.contentType)
    const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`
    const client = getS3Client()
    const command = new PutObjectCommand({
      Bucket: serverEnv.S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 })
    const publicUrl = `${serverEnv.S3_PUBLIC_URL}/${key}`
    return { uploadUrl, publicUrl, key }
  }
}
