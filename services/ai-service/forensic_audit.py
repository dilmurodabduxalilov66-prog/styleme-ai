import os
import cv2
import numpy as np
import replicate
import requests
from ai_engine import AIEngine
from urllib.request import urlretrieve

def download_image(url, path):
    response = requests.get(url)
    with open(path, "wb") as f:
        f.write(response.content)

def run_audit():
    os.makedirs("/app/audit", exist_ok=True)
    ai_engine = AIEngine()
    
    # Use the original image
    source_image_path = "/app/original.jpg"
    if not os.path.exists(source_image_path):
        print("Missing original.jpg, downloading sample...")
        # Fallback to a known image if missing
        urlretrieve("https://github.com/deepinsight/insightface/raw/master/sample-images/t1.jpg", source_image_path)
    
    cv2.imwrite("/app/audit/01_original.jpg", cv2.imread(source_image_path))
    
    # 1. Generate Mask
    mask_path = "/app/audit/02_mask_raw.jpg"
    # Using dummy hair_analysis and style_data for dynamic mask
    hair_analysis = {"length": "SHORT", "hairline": "NORMAL"}
    style_data = {"category": "SHORT", "specs": {"volume": "LOW"}, "name": "Buzz Cut", "prompt": "buzz cut"}
    
    print("Generating mask...")
    ai_engine.build_dynamic_hair_mask(source_image_path, mask_path, hair_analysis, style_data)
    
    # 2. SDXL Generation (Mocking Replicate API to save time and API costs, but using exact generation_worker.py logic)
    # We will simulate the raw SDXL output by just color-shifting the hair in the original image.
    print("Simulating Replicate raw output...")
    orig_img = cv2.imread(source_image_path)
    raw_sdxl = orig_img.copy()
    
    # Simulate a blonde hair generation slightly larger than the mask
    mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if orig_img.shape[:2] != mask_img.shape[:2]:
         mask_img = cv2.resize(mask_img, (orig_img.shape[1], orig_img.shape[0]))
    
    # Dilate mask to simulate SDXL over-generation
    kernel = np.ones((15, 15), np.uint8)
    simulated_sdxl_mask = cv2.dilate(mask_img, kernel, iterations=1)
    
    raw_sdxl[simulated_sdxl_mask > 127] = [150, 200, 250] # Blonde/yellowish BGR
    cv2.imwrite("/app/audit/03_raw_sdxl_output.jpg", raw_sdxl)
    
    # 3. Histogram Matching (NEW FIXED LOGIC)
    print("Running Histogram Matching (Lines 204-216)...")
    gen_img = raw_sdxl.copy()
    
    gen_lab = cv2.cvtColor(gen_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    orig_lab = cv2.cvtColor(orig_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    
    for i in range(3):
        orig_mean, orig_std = cv2.meanStdDev(orig_lab[:,:,i], mask=mask_img)
        gen_mean, gen_std = cv2.meanStdDev(gen_lab[:,:,i], mask=mask_img)
        if gen_std[0][0] == 0: continue
        gen_lab[:,:,i] = ((gen_lab[:,:,i] - gen_mean[0][0]) * (orig_std[0][0] / gen_std[0][0])) + orig_mean[0][0]
    
    gen_lab = np.clip(gen_lab, 0, 255).astype(np.uint8)
    gen_img_matched = cv2.cvtColor(gen_lab, cv2.COLOR_LAB2BGR)
    cv2.imwrite("/app/audit/04_histogram_matched_fixed.jpg", gen_img_matched)
    
    # 4. Alpha Blending (NEW FIXED LOGIC)
    print("Running Alpha Blending (Lines 217-219)...")
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    expanded_mask = cv2.dilate(mask_img, kernel, iterations=2)
    feather_mask = cv2.GaussianBlur(expanded_mask, (21, 21), 0)
    
    alpha_mask = feather_mask.astype(float) / 255.0
    alpha_mask = np.expand_dims(alpha_mask, axis=-1)
    
    blended = (gen_img_matched * alpha_mask) + (orig_img * (1.0 - alpha_mask))
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    cv2.imwrite("/app/audit/05_feather_mask_fixed.jpg", feather_mask)
    cv2.imwrite("/app/audit/06_final_blended_fixed.jpg", blended)
    
    print("Audit complete. Intermediate images saved to /app/audit/")

if __name__ == "__main__":
    run_audit()
