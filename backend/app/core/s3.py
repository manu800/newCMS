import boto3

from app.core.config import settings

_client = None

# Served through the beta.hooknews.com CloudFront distribution, which has a
# /cms-uploads/* cache behavior routed at the S3 bucket (the bucket itself
# blocks all direct public access — objects are only reachable via this CDN
# path). Keys are stored under this same prefix.
S3_KEY_PREFIX = "cms-uploads/"
ASSET_CDN_DOMAIN = "beta.hooknews.com"


def get_s3_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
    return _client


def upload_to_s3(contents: bytes, key: str, content_type: str) -> str:
    full_key = f"{S3_KEY_PREFIX}{key}"
    get_s3_client().put_object(
        Bucket=settings.s3_bucket_name,
        Key=full_key,
        Body=contents,
        ContentType=content_type,
    )
    return f"https://{ASSET_CDN_DOMAIN}/{full_key}"


def delete_from_s3(key: str) -> None:
    get_s3_client().delete_object(Bucket=settings.s3_bucket_name, Key=f"{S3_KEY_PREFIX}{key}")
