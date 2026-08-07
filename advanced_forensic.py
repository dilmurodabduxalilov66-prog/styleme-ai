import os
import sys
import json
import cv2
import numpy as np
import requests
import replicate

sys.path.append('/app')
from ai_engine import AIEngine
from hairstyle_catalog import catalog

def run_forensic():
    uploads_dir = '/app/uploads'
    if not os.path.exists(uploads_dir):
        print("No uploads dir.")
        sys.exit(1)

    images = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('mask_') and not f.startswith('gen_') and not f.startswith('forensic_')]
    if not images:
        print("No images found.")
        sys.exit(1)

    source_image_name = images[0]
    source_image_path = os.path.join(uploads_dir, source_image_name)
    
    # 1. Mask Generation
    engine = AIEngine()
    hair_analysis = {"length": "SHORT", "hairline": "NORMAL", "color": "black", "texture": "straight", "density": "medium"}
    style_data = catalog.get_style(1)
    
    mask_path = os.path.join(uploads_dir, f"forensic_mask_{source_image_name}")
    print(f"[STAGE 1] Generating Mask for {source_image_name}...")
    engine.build_dynamic_hair_mask(source_image_path, mask_path, hair_analysis, style_data)
    
    # 2. Prompt Conditioning
    full_prompt = style_data.get("prompt", "modern haircut")
    negative_prompt = style_data.get("negative_prompt", "")
    
    dynamic_prompt = (
        f"Photorealistic haircut transformation of the exact same person in the source image. "
        f"Transform ONLY the person's existing natural hair into a {full_prompt}. "
        f"The hairstyle must grow naturally from the person's existing scalp and original hair roots. "
        f"Preserve the person's exact facial identity, face geometry, skin texture, eyes, eyebrows, nose, mouth, ears, neck, clothing and background. "
        f"Hair details: Color is black, texture is straight, density is medium, original length is short, hairline is normal. "
        f"Facial morphology: Face shape is oval, head proportion ratio is 1.4. "
        f"Preserve realistic scalp geometry, natural hairline, temple structure and ear positions. "
        f"The target haircut must be physically plausible for the person's current hair characteristics. "
        f"The hair must follow the actual skull curvature and natural hair growth direction. "
        f"The result must look exactly like the same person after receiving a professional haircut at a real barber shop. "
        f"This is a HAIRCUT TRANSFORMATION, not a wig, hairpiece, toupee, overlay or pasted hairstyle."
    )
    
    dynamic_negative_prompt = (
        f"wig, toupee, hairpiece, pasted hair, floating hair, detached hair, helmet hair, "
        f"artificial hair cap, fake scalp, hard hairline, straight hairline, duplicate hair, "
        f"double hair layer, old hair visible underneath, duplicate face, second face, "
        f"duplicate ears, extra ears, double skin, distorted forehead, changed identity, "
        f"changed facial features, CGI hair, 3D hair, plastic hair, cartoon hair, "
        f"unrealistic density, unnatural volume, floating hairstyle, {negative_prompt}"
    )

    print("[STAGE 2] Latent Diffusion Inpainting via Replicate...")
    replicate_inputs = {
        "image": open(source_image_path, "rb"),
        "prompt": dynamic_prompt,
        "negative_prompt": dynamic_negative_prompt,
        "prompt_strength": 0.80,
        "num_inference_steps": 30,
        "guidance_scale": 7.5,
        "disable_safety_checker": True
    }
    
    if os.path.exists(mask_path):
        replicate_inputs["mask"] = open(mask_path, "rb")
        
    output = replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input=replicate_inputs
    )
    
    replicate_url = None
    if isinstance(output, list) and len(output) > 0:
        first_out = output[0]
        if hasattr(first_out, 'url'): replicate_url = str(first_out.url)
        else: replicate_url = str(first_out)
    else:
        if hasattr(output, 'url'): replicate_url = str(output.url)
        else: replicate_url = str(output)
        
    raw_result_path = os.path.join(uploads_dir, f"forensic_raw_inpaint_{source_image_name}")
    img_response = requests.get(replicate_url)
    if img_response.status_code == 200:
        with open(raw_result_path, "wb") as f:
            f.write(img_response.content)
            
    print(f"[STAGE 3] Raw Inpaint Result Saved: {raw_result_path}")
    
    print("[STAGE 4] Blending and Histogram Matching...")
    result_path = os.path.join(uploads_dir, f"forensic_final_{source_image_name}")
    
    if os.path.exists(mask_path):
        orig_img = cv2.imread(source_image_path)
        gen_img = cv2.imread(raw_result_path)
        mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        
        if orig_img.shape != gen_img.shape:
            gen_img = cv2.resize(gen_img, (orig_img.shape[1], orig_img.shape[0]))
        if orig_img.shape[:2] != mask_img.shape[:2]:
            mask_img = cv2.resize(mask_img, (orig_img.shape[1], orig_img.shape[0]))
            
        mask_float = mask_img.astype(float) / 255.0
        mask_float = np.expand_dims(mask_float, axis=-1)
        
        gen_lab = cv2.cvtColor(gen_img, cv2.COLOR_BGR2LAB).astype(np.float32)
        orig_lab = cv2.cvtColor(orig_img, cv2.COLOR_BGR2LAB).astype(np.float32)
        
        for i in range(3):
            orig_mean, orig_std = cv2.meanStdDev(orig_lab[:,:,i])
            gen_mean, gen_std = cv2.meanStdDev(gen_lab[:,:,i], mask=mask_img)
            if gen_std[0][0] == 0: continue
            gen_lab[:,:,i] = ((gen_lab[:,:,i] - gen_mean[0][0]) * (orig_std[0][0] / gen_std[0][0])) + orig_mean[0][0]
            
        gen_lab = np.clip(gen_lab, 0, 255).astype(np.uint8)
        gen_img_matched = cv2.cvtColor(gen_lab, cv2.COLOR_LAB2BGR)
        
        blended = (gen_img_matched * mask_float) + (orig_img * (1.0 - mask_float))
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        cv2.imwrite(result_path, blended)
        print(f"[STAGE 5] Final Blended Result Saved: {result_path}")
        
    print("FORENSIC ANALYSIS COMPLETE.")

if __name__ == "__main__":
    run_forensic()
