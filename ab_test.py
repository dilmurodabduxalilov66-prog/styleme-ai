import sys
sys.path.append('/app/services/ai-service')
import cv2
import os
import json
import replicate
import traceback
from dotenv import load_dotenv

load_dotenv('/app/.env')

import time

try:
    from ai_engine import AIEngine
    engine = AIEngine()
    
    # Get models explicitly
    model_b = replicate.models.get('fermatresearch/sdxl-controlnet-lora-inpaint')
    version_b = model_b.versions.list()[0].id
    
    uploads_dir = '/app/uploads'
    if not os.path.exists(uploads_dir):
        print(f"Uploads dir not found: {uploads_dir}")
        sys.exit(0)
        
    all_images = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('mask_') and not f.startswith('gen_') and not f.startswith('forensic_')]
    
    images = all_images[:3] # Limit to 3 for rate limits
    
    print(f"Starting A/B test on {len(images)} images...")
    
    results = []
    
    for i, img_name in enumerate(images):
        print(f"Processing image {i+1}/{len(images)}: {img_name}")
        test_image = os.path.join(uploads_dir, img_name)
        
        hair_analysis = {"length": "SHORT", "hairline": "NORMAL", "hair_color": "dark brown", "texture": "straight", "density": "medium"}
        style_data = {"category": "SHORT", "specs": {"volume": "LOW"}, "name": "Classic Side Part"}
        
        output_mask = os.path.join(uploads_dir, f'ab_mask_{img_name}')
        try:
            engine.build_dynamic_hair_mask(test_image, output_mask, hair_analysis, style_data)
        except Exception as e:
            print(f"  Mask error for {img_name}: {e}")
            continue
            
        full_prompt = "Classic Side Part"
        user_color = "dark brown"
        
        dynamic_prompt = (
            f"Photorealistic haircut transformation of the exact same person in the source image. "
            f"Transform ONLY the person's existing natural hair into {full_prompt}. "
            f"The hairstyle must grow naturally from the person's existing scalp and original hair roots. "
            f"Preserve the person's exact facial identity, face geometry, skin texture, eyes, eyebrows, nose, mouth, ears, neck, clothing and background. "
            f"Preserve the person's original natural hair color: {user_color}. "
            f"Preserve realistic scalp geometry, natural hairline, temple structure and ear positions. "
            f"The target haircut must be physically plausible for the person's current hair length, density and texture. "
            f"The hair must follow the actual skull curvature and natural hair growth direction. "
            f"The result must look exactly like the same person after receiving a professional haircut at a real barber shop. "
            f"This is a HAIRCUT TRANSFORMATION, not a wig, hairpiece, toupee, overlay or pasted hairstyle."
        )
        negative_prompt = (
            f"wig, toupee, hairpiece, pasted hair, floating hair, detached hair, helmet hair, "
            f"artificial hair cap, fake scalp, hard hairline, straight hairline, duplicate hair, "
            f"double hair layer, old hair visible underneath, duplicate face, second face, "
            f"duplicate ears, extra ears, double skin, distorted forehead, changed identity, "
            f"changed facial features, CGI hair, 3D hair, plastic hair, cartoon hair, "
            f"unrealistic density, unnatural volume, floating hairstyle"
        )
        
        url_A = ""
        url_B = ""
        
        try:
            print(f"  Running Pipeline A (SDXL Inpainting)...")
            output_A = replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={
                    "image": open(test_image, "rb"),
                    "mask": open(output_mask, "rb"),
                    "prompt": dynamic_prompt,
                    "negative_prompt": negative_prompt,
                    "prompt_strength": 0.80,
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "disable_safety_checker": True
                }
            )
            # Handle list, generator, or string
            url_A = list(output_A)[0] if type(output_A).__name__ == 'generator' else (output_A[0] if isinstance(output_A, list) else str(output_A))
        except Exception as e:
            print(f"  Pipeline A error: {e}")
            url_A = "ERROR"
            
        time.sleep(12)
            
        try:
            print(f"  Running Pipeline B (ControlNet Lora Inpaint)...")
            output_B = replicate.run(
                f"fermatresearch/sdxl-controlnet-lora-inpaint:{version_b}",
                input={
                    "image": open(test_image, "rb"),
                    "mask": open(output_mask, "rb"),
                    "prompt": dynamic_prompt,
                    "negative_prompt": negative_prompt,
                    "prompt_strength": 0.80,
                    "condition_scale": 0.5,
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5
                }
            )
            url_B = list(output_B)[0] if type(output_B).__name__ == 'generator' else (output_B[0] if isinstance(output_B, list) else str(output_B))
        except Exception as e:
            print(f"  Pipeline B error: {e}")
            url_B = "ERROR"
            
        time.sleep(12)
            
        results.append({
            "image": img_name,
            "pipeline_a": url_A,
            "pipeline_b": url_B
        })
        
    with open('/app/ab_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    print("A/B Test complete. Results saved to /app/ab_test_results.json")

except Exception as e:
    traceback.print_exc()
