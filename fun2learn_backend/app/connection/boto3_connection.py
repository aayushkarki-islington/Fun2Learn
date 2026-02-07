# Get all boto3 services' connection here. Used for getting S3 clients
# The utils for these aws services will be handles in boto3_utils.py

from dotenv import load_dotenv
import boto3
import os

load_dotenv()

def get_s3_client():
    """
    Create and return an S3 client using credentials from environment variables.
    """
    return boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('AWS_SECRET_KEY'),
        aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )



