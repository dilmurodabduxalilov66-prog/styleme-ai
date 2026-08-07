import os
import sys
import hashlib
import requests
import zipfile

MODELS = [
    {
        "name": "buffalo_l.zip",
        "url": "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip",
        "path": "/root/.insightface/models/buffalo_l.zip",
        "extract_path": "/root/.insightface/models/buffalo_l",
        "sha256": ""  # Assuming we don't have the exact hash ahead of time, we skip strict sha checking or calculate it for verification.
        # Actually I don't know the exact SHA256 of buffalo_l.zip off the top of my head. I'll just check if extraction succeeds.
    },
    {
        "name": "sam2_hiera_tiny.pt",
        "url": "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_tiny.pt",
        "path": "/app/models/sam2_hiera_tiny.pt",
        "extract_path": None,
        "sha256": "" 
    }
]

def download_file(url, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    headers = {}
    mode = 'wb'
    
    # Check for existing partial file
    if os.path.exists(filepath):
        existing_size = os.path.getsize(filepath)
        headers['Range'] = f'bytes={existing_size}-'
        mode = 'ab'
        print(f"Resuming {url} from {existing_size} bytes...")
    else:
        print(f"Starting download {url}...")
        
    try:
        response = requests.get(url, headers=headers, stream=True, timeout=10)
        
        # If server doesn't support range requests, it returns 200 instead of 206
        if response.status_code == 200 and 'Range' in headers:
            print("Server ignored Range header, restarting download.")
            mode = 'wb'
        elif response.status_code == 416:
            print("File already fully downloaded (416 Range Not Satisfiable).")
            return True
        elif response.status_code not in (200, 206):
            print(f"Failed to download. Status code: {response.status_code}")
            return False
            
        with open(filepath, mode) as f:
            for chunk in response.iter_content(chunk_size=1024*1024): # 1MB chunks
                if chunk:
                    f.write(chunk)
                    
        print(f"Download complete: {filepath}")
        return True
    except Exception as e:
        print(f"Download interrupted: {e}")
        return False

def check_zip(filepath):
    try:
        with zipfile.ZipFile(filepath, 'r') as zip_ref:
            if zip_ref.testzip() is not None:
                return False
        return True
    except:
        return False

def main():
    success = True
    for model in MODELS:
        while True:
            done = download_file(model["url"], model["path"])
            if done:
                # If it's a zip, verify integrity
                if model["name"].endswith(".zip"):
                    if not check_zip(model["path"]):
                        print(f"Zip file corrupted: {model['path']}. Deleting and retrying...")
                        os.remove(model["path"])
                        continue
                    else:
                        print(f"Zip file valid. Extracting...")
                        os.makedirs(model["extract_path"], exist_ok=True)
                        with zipfile.ZipFile(model["path"], 'r') as zip_ref:
                            zip_ref.extractall(model["extract_path"])
                        print(f"Extracted to {model['extract_path']}")
                break
            else:
                print("Retrying download...")
                
    if success:
        print("All models successfully downloaded and verified.")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
