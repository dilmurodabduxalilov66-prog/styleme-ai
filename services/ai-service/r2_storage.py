import os
import boto3
from botocore.config import Config

class R2Storage:
    def __init__(self):
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.endpoint_url = os.getenv("R2_ENDPOINT_URL")

        if self.bucket_name and self.access_key and self.secret_key and self.endpoint_url:
            try:
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(signature_version='s3v4'),
                    region_name='auto'
                )
            except Exception as e:
                print(f"[WARN] Failed to initialize R2Storage client: {e}")
                self.s3_client = None
        else:
            print("[WARN] R2 credentials missing. R2Storage is disabled.")
            self.s3_client = None

    def upload_file(self, file_path, object_name):
        """Uploads a file to R2 and returns a presigned URL valid for 7 days."""
        if not self.s3_client:
            return None
        
        try:
            # Upload the file
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            
            # Generate a presigned URL
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=604800 # 7 days
            )
            return presigned_url
        except Exception as e:
            print(f"[!] R2 Upload Error: {e}")
            return None

r2_storage = R2Storage()
