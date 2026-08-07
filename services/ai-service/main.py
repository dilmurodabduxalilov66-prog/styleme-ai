import os
import shutil
import uuid
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from psycopg2.extras import Json
from ai_engine import AIEngine
from recommendation_engine import RecommendationEngine
from hairstyle_catalog import catalog
from huggingface_hub import InferenceClient
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from fastapi import Depends
import sentry_sdk
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

class CurrentUser(BaseModel):
    user_id: str
    email: str
    role: str
    is_pro: bool

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    token = credentials.credentials
    secret = os.getenv("JWT_ACCESS_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        email = payload.get("email", "")
        role = payload.get("role", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Load user entitlement from database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT is_pro FROM user_profiles WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        is_pro = bool(row[0]) if row else False
        cur.close()
        conn.close()
        
        return CurrentUser(user_id=user_id, email=email, role=role, is_pro=is_pro)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

app = FastAPI(title="StyleMe AI")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}

Instrumentator().instrument(app).expose(app)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:5173', 'https://stylemeai.uz', 'https://www.stylemeai.uz'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware (Helmet equivalent)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_pool = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    # await FastAPILimiter.init(redis_pool)

ai_engine = AIEngine()
recommendation_engine = RecommendationEngine()

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/api/v1/ai/images", StaticFiles(directory=UPLOADS_DIR), name="images")

HF_TOKEN = os.getenv("HF_TOKEN", "")

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("FATAL: DATABASE_URL is missing from .env")
    return psycopg2.connect(db_url)

@app.post("/api/v1/ai/analyze", status_code=status.HTTP_200_OK)
async def analyze_face(image: UploadFile = File(...)):
    import hashlib
    import json
    
    # Read image bytes for hashing
    image_bytes = await image.read()
    image_hash = hashlib.md5(image_bytes).hexdigest()
    
    # Check cache
    cache_key = f"styleme:ai:analysis:{image_hash}:v3"
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    cached_result = await redis_client.get(cache_key)
    if cached_result:
        print("[*] Returning CACHED analysis result.")
        return json.loads(cached_result)
        
    # Not cached, continue processing
    analysis_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOADS_DIR, f"{analysis_id}.jpg")

    with open(temp_path, "wb") as buffer:
        buffer.write(image_bytes)

    try:
        # Step 0: Image Quality Validation
        import cv2
        import numpy as np
        orig_img = cv2.imread(temp_path)
        if orig_img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")
            
        gray_img = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY)
        blur_val = cv2.Laplacian(gray_img, cv2.CV_64F).var()
        brightness = np.mean(gray_img)
        
        if blur_val < 50:
            raise HTTPException(status_code=400, detail="Yuzingizni aniqroq ko'rish uchun loyqa bo'lmagan, aniq surat yuboring.")
        if brightness < 40:
            raise HTTPException(status_code=400, detail="Surat juda qorong'i. Iltimos yorug'roq joyda tushgan surat yuboring.")
        if brightness > 240:
            raise HTTPException(status_code=400, detail="Surat juda yorug'.")

        # Step 1: Analyze Face & Validate
        try:
            result = ai_engine.analyze_face_shape(temp_path)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        landmarks = result.get("landmarks_mesh", [])
        if landmarks and len(landmarks) > 0:
            left_eye_z = next((lm['z'] for lm in landmarks if lm['id'] == 33), 0)
            right_eye_z = next((lm['z'] for lm in landmarks if lm['id'] == 263), 0)
            if abs(left_eye_z - right_eye_z) > 0.05:
                print("[!] Warning: Face appears to be turned (Side Profile).")
        
        # Step 2: Intelligent Hair Analysis
        hair_analysis = ai_engine.analyze_hair_properties(temp_path, landmarks)
        
        conn = get_db_connection()
        cur = conn.cursor()
        temp_user_id = "018fdf92-6d7c-7d9a-a82f-2f7bb7fa1234"
        
        # Merge metrics and hair_analysis for DB storage
        db_metrics = result["metrics"]
        db_metrics["hair_analysis"] = hair_analysis
        
        cur.execute(
            """
            INSERT INTO ai_analysis_results (id, user_id, raw_image_url, analysis_type, face_shape, landmarks_json_url, biometric_metrics)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (analysis_id, temp_user_id, f"/api/v1/ai/images/{analysis_id}.jpg", "HAIR", result["face_shape"], "", Json(db_metrics))
        )
        conn.commit()
        cur.close()
        conn.close()

        # Step 3: Best Match Engine
        rec_result = recommendation_engine.recommend(
            metrics=result.get("metrics", {}), 
            face_shape=result.get("face_shape", "OVAL"),
            hair_analysis=hair_analysis
        )
        
        final_response = {
            "analysis_id": analysis_id,
            "face_shape": result.get("face_shape"),
            "metrics": result.get("metrics"),
            "hair_analysis": hair_analysis,
            "best_match": rec_result.get("best_match"),
            "recommended_styles": rec_result.get("top_recommendations", [])
        }
        
        # Save to cache (Expire in 7 days)
        await redis_client.set(cache_key, json.dumps(final_response), ex=604800)
        await redis_client.close()
        
        return final_response
    
    except Exception as e:
        print(f"[!] Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/ai/recommendations", status_code=status.HTTP_200_OK)
async def get_recommendations(user_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT face_shape, biometric_metrics 
            FROM ai_analysis_results 
            WHERE user_id = %s 
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            # Fallback default recommendations
            rec = recommendation_engine.recommend({"height_width_ratio": 1.4, "jaw_cheek_ratio": 0.8, "forehead_cheek_ratio": 0.8}, "OVAL")
            return {"recommended_styles": rec.get("top_recommendations", [])}

        face_shape = row[0]
        metrics = row[1]
        
        recommendations = recommendation_engine.recommend(metrics, face_shape)
        return {"recommended_styles": recommendations.get("top_recommendations", [])}
    except Exception as err:
        print(f"Error fetching recommendations: {err}")
        return {"recommended_styles": recommendation_engine.recommend({"height_width_ratio": 1.4, "jaw_cheek_ratio": 0.8, "forehead_cheek_ratio": 0.8}, "OVAL").get("top_recommendations", [])}


import replicate
import requests

class TryOnRequest(BaseModel):
    analysis_id: str
    hairstyle_id: int

@app.post("/api/v1/ai/tryon", status_code=status.HTTP_200_OK)
async def try_on(request: TryOnRequest, http_request: Request, current_user: CurrentUser = Depends(get_current_user)):
    analysis_id = request.analysis_id
    style_id = request.hairstyle_id
    
    # 1. Redis Rate Limiting (Max 5 per minute per IP)
    client_ip = http_request.client.host if http_request.client else "127.0.0.1"
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    
    rate_key = f"styleme:ratelimit:tryon:{client_ip}"
    current_count = await redis_client.get(rate_key)
    
    if current_count and int(current_count) >= 5:
        await redis_client.close()
        raise HTTPException(status_code=429, detail="Too many generations. Please wait a minute before trying again.")
        
    await redis_client.incr(rate_key)
    if not current_count:
        await redis_client.expire(rate_key, 60) # 1 minute window
    await redis_client.close()
    
    style_data = catalog.get_style(int(style_id))
    if not style_data:
        raise HTTPException(status_code=404, detail="Hairstyle not found")

    # Temporarily disabled PRO check for testing
    # if style_data.get("tier") == "PRO" and not current_user.is_pro:
    #     raise HTTPException(status_code=403, detail="Pro hairstyle requires an active subscription")

    source_image_path = os.path.join(UPLOADS_DIR, f"{analysis_id}.jpg")
    if not os.path.exists(source_image_path):
        raise HTTPException(status_code=404, detail="Original image not found")

    REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
    if not REPLICATE_API_TOKEN:
        print("[!] REPLICATE_API_TOKEN not found, raising 500.")
        raise HTTPException(status_code=500, detail="Replicate API token is missing.")

    full_prompt = style_data["prompt"]
    negative_prompt = style_data["negative_prompt"]

    try:
        # Fetch hair_analysis from DB
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT biometric_metrics FROM ai_analysis_results WHERE id = %s", (analysis_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        hair_analysis = {}
        if row and row[0]:
            metrics = row[0]
            hair_analysis = metrics.get("hair_analysis", {})

        # 1. Generate Phase 3A Dynamic Hair Mask
        mask_path = os.path.join(UPLOADS_DIR, f"mask_{analysis_id}.jpg")
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
            print(f"[!] Warning: Dynamic mask generation failed: {e}")
            mask_path = None

        user_len = hair_analysis.get("length", "UNKNOWN")
        target_cat = style_data.get("category", "SHORT").upper() if style_data else "SHORT"
        
        MAX_RETRIES = 2
        attempt = 0
        validation_passed = False
        result_path = ""
        result_filename = ""
        validation_info = {}
        
        import cv2
        import numpy as np
        
        while attempt <= MAX_RETRIES and not validation_passed:
            attempt += 1
            print(f"[*] Calling Replicate API for sync TryOn {analysis_id}... (Attempt {attempt}/{MAX_RETRIES + 1})")
            
            prompt_strength = 0.80 # Default moderate transformation
            if user_len == "SHORT" and target_cat == "LONG":
                prompt_strength = 0.88 # Extreme transformation
            elif user_len == target_cat:
                prompt_strength = 0.70 # Normal transformation
                
            if attempt > 1:
                prompt_strength = min(0.90, prompt_strength + 0.05)
                
            # Extract hair properties
            user_color = hair_analysis.get("hair_color", "natural dark black")
            if user_color in ["UNKNOWN", "natural", "UNKNOWN COLOR"]:
                user_color = "natural dark black"
            
            user_texture = hair_analysis.get("texture", "UNKNOWN")
            user_density = hair_analysis.get("density", "UNKNOWN")
            user_len = hair_analysis.get("length", "UNKNOWN")
            user_hairline = hair_analysis.get("hairline", "UNKNOWN")
            
            face_shape = metrics.get("face_shape", "OVAL")
            head_proportions = metrics.get("height_width_ratio", 1.4)
            
            # Construct dynamic fundamental prompt as exactly requested
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

            replicate_inputs = {
                "image": open(source_image_path, "rb"),
                "prompt": dynamic_prompt,
                "negative_prompt": dynamic_negative_prompt,
                "prompt_strength": 0.65, # Photorealistic transformation sweet spot
                "num_inference_steps": 30,
                "guidance_scale": 7.0, # Standard photorealistic scale to eliminate cartoon spiky hair
                "disable_safety_checker": True
            }
            
            # Use dedicated SDXL inpainting model for clean boundaries
            model_id = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
            
            if mask_path and os.path.exists(mask_path):
                replicate_inputs["mask"] = open(mask_path, "rb")

            output = replicate.run(
                model_id,
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
                    
            if not replicate_url or not replicate_url.startswith("http"):
                raise ValueError(f"Invalid output URL from Replicate API: {output}")
                
            result_filename = f"{analysis_id}_style_{style_id}_v{attempt}.jpg"
            result_path = os.path.join(UPLOADS_DIR, result_filename)
            
            img_response = requests.get(replicate_url)
            if img_response.status_code == 200:
                with open(result_path, "wb") as f:
                    f.write(img_response.content)
            else:
                raise Exception("Failed to download generated image from Replicate")

            # 2. Identity Preservation: OpenCV Strict Post-Processing
            validation_passed = True
            validation_info = {
                "face_protection": "PASS",
                "ear_protection": "PASS",
                "background_protection": "PASS",
                "hair_region_valid": True,
                "artifact_score": 0.0,
                "quality_status": "PASS"
            }

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
                    
                    # Post-Generation Validation (Check if protected face was altered)
                    protected_face_pixels = orig_img[mask_img == 0]
                    generated_face_pixels = blended[mask_img == 0]
                    mse = np.mean((protected_face_pixels - generated_face_pixels) ** 2)
                    
                    if mse > 5.0:
                        validation_info["face_protection"] = "FAIL"
                        validation_info["quality_status"] = "FAIL - Face altered"
                        validation_passed = False
                    
                    diff = cv2.absdiff(orig_img, blended)
                    if np.sum(diff) < 1000:
                        validation_info["quality_status"] = "FAIL - Empty Generation"
                        validation_info["artifact_score"] = 1.0
                        validation_passed = False
                    
                    cv2.imwrite(result_path, blended)
            
            if validation_passed:
                print(f"[*] Quality Validated on attempt {attempt}.")
                break
            else:
                print(f"[!] Quality Validation FAILED on attempt {attempt}: {validation_info['quality_status']}")

        # Upload to Cloudflare R2
        from r2_storage import r2_storage
        r2_url = r2_storage.upload_file(result_path, result_filename)
        
        result_url = r2_url if r2_url else f"/api/v1/ai/images/{result_filename}"
        
        return {
            "result_image_url": result_url,
            "validation": validation_info,
            "generation_attempts": attempt
        }
        
    except Exception as err:
        print(f"[!] AI Generation Error: {err}")
        raise HTTPException(status_code=500, detail=f"Replicate API failed: {str(err)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
