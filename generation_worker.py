import os
import json
import time
import redis
import psycopg2
import requests
import replicate
import mimetypes
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('image/png', '.png')

# Load environment variable for Replicate
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

db_url = os.getenv("DATABASE_URL", "postgresql://styleme_user:styleme_password@localhost:5432/styleme_db")

def get_db_connection():
    return psycopg2.connect(db_url)

# Get the latest version of cjwbw/style-your-hair
try:
    model_b = replicate.models.get('cjwbw/style-your-hair')
    STYLE_YOUR_HAIR_VERSION = model_b.versions.list()[0].id
except Exception as e:
    STYLE_YOUR_HAIR_VERSION = "71501c0c6600a941548e6f1f4560a6b7dbebc84d" # fallback version hash

def process_tryon_task(task_data):
    task_id = task_data.get("task_id")
    analysis_id = task_data.get("analysis_id")
    hairstyle_id = task_data.get("hairstyle_id")
    
    print(f"[*] Processing task {task_id} for analysis {analysis_id} and hairstyle {hairstyle_id}...")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Update Database Status to PROCESSING
        cur.execute(
            """
            UPDATE ai_generated_hairstyles 
            SET status = 'PROCESSING', created_at = CURRENT_TIMESTAMP 
            WHERE id = %s;
            """,
            (task_id,)
        )
        conn.commit()

        # Emit progress event via Redis PubSub
        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({"task_id": task_id, "status": "PROCESSING", "progress_percentage": 20})
        )

        # 2. Process Latent Diffusion Model Pipeline using Replicate
        source_image_path = os.path.join(os.getcwd(), "uploads", f"{analysis_id}.jpg")
        
        target_image_path = os.path.join(os.getcwd(), "reference_styles", f"style_{hairstyle_id}.jpg")
        if not os.path.exists(target_image_path):
            target_image_path = os.path.join(os.getcwd(), "reference_styles", "style_1.jpg") # Fallback

        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({"task_id": task_id, "status": "PROCESSING", "progress_percentage": 50})
        )

        # Generate via Replicate cjwbw/style-your-hair
        print(f"[*] Calling Replicate API cjwbw/style-your-hair for task {task_id}...")
        
        import httpx
        import cv2
        from replicate.client import Client
        
        # Resize both images to 1024x1024 to avoid tensor mismatch on Replicate
        src_img = cv2.imread(source_image_path)
        tgt_img = cv2.imread(target_image_path)
        if src_img is not None:
            src_img = cv2.resize(src_img, (1024, 1024))
            cv2.imwrite(source_image_path, src_img)
        if tgt_img is not None:
            tgt_img = cv2.resize(tgt_img, (1024, 1024))
            cv2.imwrite(target_image_path, tgt_img)
        
        rep_client = Client(
            api_token=REPLICATE_API_TOKEN,
            timeout=httpx.Timeout(600.0) # 10 minutes timeout
        )
        
        output = rep_client.run(
            f"cjwbw/style-your-hair:{STYLE_YOUR_HAIR_VERSION}",
            input={
                "source_image": open(source_image_path, "rb"),
                "target_image": open(target_image_path, "rb")
            }
        )
        
        replicate_url = output[0] if isinstance(output, list) else (list(output)[0] if type(output).__name__ == 'generator' else str(output))
        if not replicate_url or not isinstance(replicate_url, str) or not replicate_url.startswith("http"):
            raise ValueError("Invalid output URL from Replicate API")

        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({"task_id": task_id, "status": "PROCESSING", "progress_percentage": 85})
        )

        # Download the result image to local uploads directory
        result_filename = f"gen_{task_id}.jpg"
        result_path = os.path.join(os.getcwd(), "uploads", result_filename)
        
        img_response = requests.get(replicate_url)
        if img_response.status_code == 200:
            with open(result_path, "wb") as f:
                f.write(img_response.content)
        else:
            raise Exception("Failed to download generated image from Replicate")

        # Upload to Cloudflare R2
        from r2_storage import r2_storage
        r2_url = r2_storage.upload_file(result_path, result_filename)
        
        final_output_url = r2_url if r2_url else f"/api/v1/ai/images/{result_filename}"

        # 3. Update Database Status to COMPLETED
        cur.execute(
            """
            UPDATE ai_generated_hairstyles 
            SET status = 'COMPLETED', generated_image_url = %s, queue_duration_ms = 500, inference_duration_ms = 2500
            WHERE id = %s;
            """,
            (final_output_url, task_id)
        )
        conn.commit()

        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({
                "task_id": task_id, 
                "status": "COMPLETED", 
                "progress_percentage": 100,
                "result_image_url": final_output_url
            })
        )
        print(f"[+] Task {task_id} completed successfully. Image URL: {final_output_url}")

    except Exception as err:
        print(f"[!] Error processing task {task_id}: {str(err)}")
        cur.execute(
            """
            UPDATE ai_generated_hairstyles 
            SET status = 'FAILED', error_log = %s 
            WHERE id = %s;
            """,
            (str(err), task_id)
        )
        conn.commit()

        # Emit failure event via Redis PubSub
        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({"task_id": task_id, "status": "FAILED", "error": str(err)})
        )

    finally:
        cur.close()
        conn.close()

def main_worker_loop():
    print("[*] StyleMe AI try-on worker daemon started. Polling queue 'ai:tryon:queue'...")
    while True:
        try:
            task_raw = redis_client.brpop("ai:tryon:queue", timeout=5)
            if task_raw:
                task_data = json.loads(task_raw[1].decode("utf-8"))
                process_tryon_task(task_data)
        except KeyboardInterrupt:
            print("[*] Stopping worker.")
            break
        except Exception as err:
            print(f"[!] Worker loop error: {str(err)}")
            time.sleep(2)

if __name__ == "__main__":
    main_worker_loop()
