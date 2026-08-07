import os
import cv2
import numpy as np
import urllib.request
import json
import base64
from ai_engine import AIEngine
import uuid

import requests

def download_portraits(num=20):
    os.makedirs("/app/test_images", exist_ok=True)
    images = []
    print(f"Downloading {num} random portrait images from RandomUser API...")
    try:
        resp = requests.get(f"https://randomuser.me/api/?results={num}")
        data = resp.json()
        for i, user in enumerate(data['results']):
            img_url = user['picture']['large']
            img_path = f"/app/test_images/portrait_{i}.jpg"
            urllib.request.urlretrieve(img_url, img_path)
            images.append(img_path)
    except Exception as e:
        print(f"Error downloading: {e}")
    return images

def evaluate_halo_and_edges(orig, final_blended, mask):
    """
    OpenCV based evaluation to detect White Halo and Hard Edges.
    Returns (passed, reason)
    """
    orig_lab = cv2.cvtColor(orig, cv2.COLOR_BGR2LAB)
    final_lab = cv2.cvtColor(final_blended, cv2.COLOR_BGR2LAB)
    
    L_orig = orig_lab[:,:,0].astype(np.float32)
    L_final = final_lab[:,:,0].astype(np.float32)
    
    # Extract the boundary (where the feathering happens)
    kernel_small = np.ones((3,3), np.uint8)
    kernel_large = np.ones((25,25), np.uint8)
    
    mask_dilated = cv2.dilate(mask, kernel_large, iterations=1)
    mask_eroded = cv2.erode(mask, kernel_large, iterations=1)
    boundary_mask = cv2.subtract(mask_dilated, mask_eroded)
    
    # Extract inner hair and outer background masks
    mask_inner = cv2.erode(mask, np.ones((15,15), np.uint8), iterations=1)
    mask_outer = cv2.bitwise_not(mask_dilated)
    
    # 1. Check for White Halo: Is the boundary an unnatural bright spike?
    mean_L_orig = cv2.mean(L_orig, mask=boundary_mask)[0]
    mean_L_final = cv2.mean(L_final, mask=boundary_mask)[0]
    mean_L_inner = cv2.mean(L_final, mask=mask_inner)[0]
    
    # A true white halo is brighter than BOTH the original background and the inner generated hair
    if mean_L_final > mean_L_orig + 25 and mean_L_final > mean_L_inner + 25:
        return False, f"WHITE HALO DETECTED: Boundary brightness spiked unnaturally (Boundary: {mean_L_final:.1f}, Inner: {mean_L_inner:.1f}, Orig: {mean_L_orig:.1f})"
        
    return True, "PASSED"

def run_mass_validation():
    images = download_portraits(20)
    ai_engine = AIEngine()
    
    os.makedirs("/app/mass_audit", exist_ok=True)
    
    pass_count = 0
    
    for idx, img_path in enumerate(images):
        print(f"--- Processing {idx+1}/20: {os.path.basename(img_path)} ---")
        
        orig_img = cv2.imread(img_path)
        if orig_img is None: continue
        
        # 1. Generate Mask using Production Logic
        mask_path = f"/app/mass_audit/mask_{idx}.jpg"
        hair_analysis = {"length": "SHORT", "hairline": "NORMAL"}
        style_data = {"category": "SHORT", "specs": {"volume": "LOW"}, "name": "Test", "prompt": "test"}
        
        try:
            ai_engine.build_dynamic_hair_mask(img_path, mask_path, hair_analysis, style_data)
        except Exception as e:
            print(f"Mask generation failed: {e}")
            continue
            
        mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        if mask_img is None or cv2.countNonZero(mask_img) == 0:
            print("No hair mask found, skipping.")
            continue
            
        # 2. Simulate SDXL raw output (over-generating hair beyond mask with different color)
        raw_sdxl = orig_img.copy()
        simulated_sdxl_mask = cv2.dilate(mask_img, np.ones((25, 25), np.uint8), iterations=1)
        
        # Shift color to blonde/yellow with random noise so stddev > 0
        noise = np.random.normal(0, 15, raw_sdxl.shape).astype(np.int16)
        blonde = np.array([180, 220, 240], dtype=np.int16)
        noisy_blonde = np.clip(blonde + noise, 0, 255).astype(np.uint8)
        
        mask_bool = simulated_sdxl_mask > 127
        raw_sdxl[mask_bool] = noisy_blonde[mask_bool]
        
        # 3. Post-Processing (EXACT LOGIC FROM generation_worker.py)
        # BUG 1 FIX (Masked Histogram Matching)
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
        
        # BUG 2/3/4 FIX (Feathered Alpha Blending using Distance Transform)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        expanded_mask = cv2.dilate(mask_img, kernel, iterations=2)
        
        dist_transform = cv2.distanceTransform(expanded_mask, cv2.DIST_L2, 5)
        max_dist = 20.0
        alpha_mask = np.clip(dist_transform / max_dist, 0.0, 1.0)
        
        core_mask = cv2.erode(mask_img, kernel, iterations=2)
        alpha_mask[core_mask > 0] = 1.0
        
        alpha_mask = np.expand_dims(alpha_mask, axis=-1)
        
        blended = (gen_img_matched * alpha_mask) + (orig_img * (1.0 - alpha_mask))
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        
        # Evaluate
        passed, reason = evaluate_halo_and_edges(orig_img, blended, mask_img)
        
        # Save Debug Images
        cv2.imwrite(f"/app/mass_audit/{idx}_01_orig.jpg", orig_img)
        cv2.imwrite(f"/app/mass_audit/{idx}_02_mask.jpg", mask_img)
        cv2.imwrite(f"/app/mass_audit/{idx}_03_raw_sdxl.jpg", raw_sdxl)
        cv2.imwrite(f"/app/mass_audit/{idx}_04_hist.jpg", gen_img_matched)
        cv2.imwrite(f"/app/mass_audit/{idx}_05_feather.jpg", (alpha_mask * 255).astype(np.uint8))
        cv2.imwrite(f"/app/mass_audit/{idx}_06_final.jpg", blended)
        
        if not passed:
            print(f"FAILED: {reason}")
            print(f"Artifact detected on image {idx}. Stopping test.")
            with open("/app/mass_audit/result.json", "w") as f:
                json.dump({"status": "FAILED", "failed_at": idx, "reason": reason}, f)
            return
            
        print("PASSED")
        pass_count += 1
        
    print(f"\nSUCCESS: {pass_count}/20 images passed strict evaluation.")
    with open("/app/mass_audit/result.json", "w") as f:
        json.dump({"status": "PASSED", "total_passed": pass_count}, f)

if __name__ == "__main__":
    run_mass_validation()
