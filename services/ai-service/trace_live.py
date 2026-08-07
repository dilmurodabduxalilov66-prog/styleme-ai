import os
import cv2
import numpy as np
import replicate
import requests

def trace_live_image():
    task_id = "9f5df36d-b1a9-44af-8a4f-a6f61c363b17"
    orig_path = f"/app/uploads/{task_id}.jpg"
    mask_path = f"/app/uploads/mask_{task_id}.jpg"
    
    if not os.path.exists(orig_path) or not os.path.exists(mask_path):
        print("Source files not found.")
        return
        
    os.makedirs("/app/trace_output", exist_ok=True)
    
    # 1. Call Replicate to get REAL raw SDXL output
    print("Calling Replicate API...")
    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "image": open(orig_path, "rb"),
                "mask": open(mask_path, "rb"),
                "prompt": "Professional portrait of a person with a short, modern fringe haircut, photorealistic, 8k",
                "negative_prompt": "bald, bad anatomy, deformed",
                "prompt_strength": 0.80,
                "num_inference_steps": 30,
                "guidance_scale": 7.5
            }
        )
        
        replicate_url = output[0].url if hasattr(output[0], 'url') else str(output[0])
        img_response = requests.get(replicate_url)
        raw_sdxl_path = "/app/trace_output/03_raw_sdxl.jpg"
        with open(raw_sdxl_path, "wb") as f:
            f.write(img_response.content)
            
    except Exception as e:
        print(f"Replicate failed: {e}")
        return

    orig_img = cv2.imread(orig_path)
    mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    gen_img = cv2.imread(raw_sdxl_path)
    
    if orig_img.shape != gen_img.shape:
        gen_img = cv2.resize(gen_img, (orig_img.shape[1], orig_img.shape[0]))
    if orig_img.shape[:2] != mask_img.shape[:2]:
        mask_img = cv2.resize(mask_img, (orig_img.shape[1], orig_img.shape[0]))
    
    cv2.imwrite("/app/trace_output/01_original.jpg", orig_img)
    cv2.imwrite("/app/trace_output/02_mask.jpg", mask_img)

    # Replicate EXACT BUGGY LOGIC from main.py Lines 463-485
    mask_float = mask_img.astype(float) / 255.0
    mask_float = np.expand_dims(mask_float, axis=-1)
    cv2.imwrite("/app/trace_output/05_alpha_mask_binary.jpg", (mask_float * 255).astype(np.uint8))
    
    gen_lab = cv2.cvtColor(gen_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    orig_lab = cv2.cvtColor(orig_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    
    for i in range(3):
        # EXACT BUG IN main.py Line 472:
        orig_mean, orig_std = cv2.meanStdDev(orig_lab[:,:,i]) 
        gen_mean, gen_std = cv2.meanStdDev(gen_lab[:,:,i], mask=mask_img)
        if gen_std[0][0] == 0: continue
        gen_lab[:,:,i] = ((gen_lab[:,:,i] - gen_mean[0][0]) * (orig_std[0][0] / gen_std[0][0])) + orig_mean[0][0]
    
    gen_lab = np.clip(gen_lab, 0, 255).astype(np.uint8)
    gen_img_matched = cv2.cvtColor(gen_lab, cv2.COLOR_LAB2BGR)
    cv2.imwrite("/app/trace_output/04_histogram_matched.jpg", gen_img_matched)
    
    blended = (gen_img_matched * mask_float) + (orig_img * (1.0 - mask_float))
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    cv2.imwrite("/app/trace_output/06_final_blended.jpg", blended)
    
    print("Trace complete. Images saved to /app/trace_output/")

if __name__ == "__main__":
    trace_live_image()
