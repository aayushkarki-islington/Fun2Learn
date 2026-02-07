"""
Utility functions for AWS S3 operations.
"""

import os
import uuid
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.connection.boto3_connection import get_s3_client
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Allowed file extensions for lesson attachments
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'svg',
    'mp4', 'mp3', 'wav', 'avi', 'mov',
    'zip', 'txt', 'csv'
}

# Maximum file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file for extension and size.

    Args:
        file: The uploaded file

    Raises:
        HTTPException: If file validation fails
    """
    # Check file extension
    if file.filename:
        file_extension = file.filename.rsplit('.', 1)[-1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '.{file_extension}' is not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a name"
        )

def upload_file_to_s3(
    file: UploadFile,
    bucket_name: str,
    folder: str = "lesson_attachments"
) -> Tuple[str, str]:
    """
    Upload a file to S3 and return the S3 URL and key.

    Args:
        file: The uploaded file
        bucket_name: S3 bucket name
        folder: Folder path in S3 bucket

    Returns:
        Tuple of (s3_url, s3_key)

    Raises:
        HTTPException: If upload fails
    """
    try:
        # Validate file
        validate_file(file)

        # Generate unique file name to prevent collisions
        file_extension = file.filename.rsplit('.', 1)[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"{folder}/{unique_filename}"

        # Get S3 client
        s3_client = get_s3_client()

        # Read file content
        file_content = file.file.read()

        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )

        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type or 'application/octet-stream'
        )

        # Generate S3 URL
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"

        logger.info(f"File uploaded successfully to S3: {s3_url}")

        return s3_url, s3_key

    except HTTPException:
        raise
    except ClientError as e:
        logger.exception(f"AWS S3 error while uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage"
        )
    except Exception as e:
        logger.exception(f"Unexpected error while uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )
    finally:
        # Reset file pointer
        file.file.seek(0)

def delete_file_from_s3(s3_key: str, bucket_name: str) -> None:
    """
    Delete a file from S3.

    Args:
        s3_key: S3 object key
        bucket_name: S3 bucket name

    Raises:
        HTTPException: If deletion fails
    """
    try:
        s3_client = get_s3_client()
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
        logger.info(f"File deleted successfully from S3: {s3_key}")

    except ClientError as e:
        logger.exception(f"AWS S3 error while deleting file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file from storage"
        )
    except Exception as e:
        logger.exception(f"Unexpected error while deleting file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )
