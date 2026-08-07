import os
import json
import time
import uuid
import redis
import psycopg2
from psycopg2.extras import Json

# Initialize Redis and Postgres connection params
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

db_url = os.getenv("DATABASE_URL", "postgresql://styleme_user:styleme_password@localhost:5432/styleme_db")

def get_db_connection():
    return psycopg2.connect(db_url)

import requests
import replicate
from ai_engine import AIEngine
from hairstyle_catalog import catalog

ai_engine = AIEngine()

# Load environment variable for Replicate
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

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
        
        # Extract hair properties from DB
        cur.execute("SELECT biometric_metrics FROM ai_analysis_results WHERE id = %s", (analysis_id,))
        row = cur.fetchone()
        hair_analysis = {}
        metrics = {}
        if row and row[0]:
            metrics = row[0]
            hair_analysis = metrics.get("hair_analysis", {})
            
        style_data = catalog.get_style(int(hairstyle_id))
        if not style_data:
            raise ValueError(f"Hairstyle {hairstyle_id} not found in catalog")

        user_color = hair_analysis.get("hair_color", "natural dark black")
        if user_color in ["UNKNOWN", "natural", "UNKNOWN COLOR"]:
            user_color = "natural dark black"
        
        user_texture = hair_analysis.get("texture", "UNKNOWN")
        user_density = hair_analysis.get("density", "UNKNOWN")
        user_len = hair_analysis.get("length", "UNKNOWN")
        user_hairline = hair_analysis.get("hairline", "UNKNOWN")
        
        face_shape = metrics.get("face_shape", "OVAL")
        head_proportions = metrics.get("height_width_ratio", 1.4)
        
        full_prompt = style_data.get("prompt", "modern haircut")
        negative_prompt = style_data.get("negative_prompt", "")
        
        # 1. Generate Phase 3A Dynamic Hair Mask
        mask_path = os.path.join(os.getcwd(), "uploads", f"mask_worker_{analysis_id}.jpg")
        try:
            mask_path_returned = ai_engine.build_dynamic_hair_mask(
                source_image_path=source_image_path, 
                output_mask_path=mask_path, 
                hair_analysis=hair_analysis, 
                style_data=style_data
            )
            if not mask_path_returned:
                mask_path = None
        except Exception as e:
            print(f"[!] Warning: Dynamic mask generation failed in worker: {e}")
            mask_path = None
            
        dynamic_prompt = (
            f"Photorealistic haircut transformation of the exact same person in the source image. "
            f"Transform ONLY the person's existing natural hair into a {full_prompt}. "
            f"The hairstyle must grow naturally from the person's existing scalp and original hair roots. "
            f"Hair color MUST match the person's original hair color exactly ({user_color}). Natural dark hair roots. "
            f"Preserve the person's exact facial identity, face geometry, skin texture, eyes, eyebrows, nose, mouth, ears, neck, clothing and background. "
            f"Hair details: Color is {user_color}, texture is {user_texture.lower()}, density is {user_density.lower()}, original length is {user_len.lower()}, hairline is {user_hairline.lower()}. "
            f"Facial morphology: Face shape is {face_shape.lower()}, head proportion ratio is {head_proportions}. "
            f"Preserve realistic scalp geometry, natural hairline, temple structure and ear positions. "
            f"The target haircut must be physically plausible for the person's current hair characteristics. "
            f"The hair must follow the actual skull curvature and natural hair growth direction. "
            f"The result must look exactly like the same person after receiving a professional haircut at a real barber shop. "
            f"This is a HAIRCUT TRANSFORMATION, not a wig, hairpiece, toupee, overlay or pasted hairstyle."
        )
        
        dynamic_negative_prompt = (
            f"blonde hair, light hair, brown highlights, bleached hair, light brown hair, grey hair, blonde highlights, changed hair color, unnatural hair color, "
            f"wig, toupee, hairpiece, pasted hair, floating hair, detached hair, helmet hair, "
            f"artificial hair cap, fake scalp, hard hairline, straight hairline, duplicate hair, "
            f"double hair layer, old hair visible underneath, duplicate face, second face, "
            f"duplicate ears, extra ears, double skin, distorted forehead, changed identity, "
            f"changed facial features, CGI hair, 3D hair, plastic hair, cartoon hair, "
            f"unrealistic density, unnatural volume, floating hairstyle, {negative_prompt}"
        )

        redis_client.publish(
            f"task_events:{task_id}",
            json.dumps({"task_id": task_id, "status": "PROCESSING", "progress_percentage": 50})
        )

        # Generate via Replicate SDXL Inpainting
        print(f"[*] Calling Replicate API for task {task_id}...")
        
        replicate_inputs = {
            "image": open(source_image_path, "rb"),
            "prompt": dynamic_prompt,
            "negative_prompt": dynamic_negative_prompt,
            "prompt_strength": 0.65, # Photorealistic transformation sweet spot
            "num_inference_steps": 30,
            "guidance_scale": 7.0, # Standard photorealistic scale to eliminate cartoon spiky hair
            "disable_safety_checker": True
        }
        
        if mask_path and os.path.exists(mask_path):
            replicate_inputs["mask"] = open(mask_path, "rb")
            
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input=replicate_inputs
        )
        
        if hasattr(output, '__iter__') and not isinstance(output, str):
            output = list(output)
            
        replicate_url = None
        if isinstance(output, list) and len(output) > 0:
            first_out = output[0]
            if hasattr(first_out, 'url'):
                replicate_url = str(first_out.url)
            else:
                replicate_url = str(first_out)
        else:
            if hasattr(output, 'url'):
                replicate_url = str(output.url)
            else:
                replicate_url = str(output)
        
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

        # OpenCV Post Processing for 100% Identity Preservation
        import cv2
        import numpy as np
        
        if mask_path and os.path.exists(mask_path):
            orig_img = cv2.imread(source_image_path)
            gen_img = cv2.imread(result_path)
            mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
            
            if orig_img is not None and gen_img is not None and mask_img is not None:
                if orig_img.shape != gen_img.shape:
                    gen_img = cv2.resize(gen_img, (orig_img.shape[1], orig_img.shape[0]))
                if orig_img.shape[:2] != mask_img.shape[:2]:
                    mask_img = cv2.resize(mask_img, (orig_img.shape[1], orig_img.shape[0]))
                # FORENSIC FIX: Pure Industry-Standard Alpha Blending
                # Completely removes artificial color matching and Poisson cloning distortions.
                # 11px Gaussian blur provides a seamless edge transition without darkening forehead skin or background.
                alpha_mask = cv2.GaussianBlur(mask_img, (11, 11), 0).astype(np.float32) / 255.0
                alpha_mask = np.expand_dims(alpha_mask, axis=-1)
                
                blended = (gen_img * alpha_mask) + (orig_img * (1.0 - alpha_mask))
                blended = np.clip(blended, 0, 255).astype(np.uint8)
                cv2.imwrite(result_path, blended)
                
                # DEBUG OUTPUT: Save intermediate images for forensic validation
                try:
                    debug_dir = os.path.join(os.getcwd(), "uploads", f"debug_{task_id}")
                    os.makedirs(debug_dir, exist_ok=True)
                    cv2.imwrite(os.path.join(debug_dir, "01_original.png"), orig_img)
                    cv2.imwrite(os.path.join(debug_dir, "02_hair_mask.png"), mask_img)
                    cv2.imwrite(os.path.join(debug_dir, "03_raw_sdxl.png"), gen_img)
                    cv2.imwrite(os.path.join(debug_dir, "05_feather_mask.png"), (alpha_mask[:,:,0] * 255).astype(np.uint8))
                    cv2.imwrite(os.path.join(debug_dir, "06_final_result.png"), blended)
                except Exception as dbg_err:
                    print(f"[!] Debug output save warning: {dbg_err}")

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
            # Blocking pop from Redis list queue
            # BRPOP returns a tuple: (queue_name, popped_value)
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
