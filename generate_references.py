import os
import replicate
import requests
import sys
from dotenv import load_dotenv

load_dotenv('/app/.env')

os.makedirs('/app/reference_styles', exist_ok=True)

styles = {
    1: "short textured crop fade haircut",
    2: "classic side part, elegant haircut",
    3: "modern pompadour with volume haircut",
    4: "clean buzz cut, military style haircut",
    5: "quiff with high volume haircut",
    6: "french crop fade haircut",
    7: "textured fringe haircut",
    8: "faux hawk haircut"
}

for style_id, prompt_desc in styles.items():
    output_path = f"/app/reference_styles/style_{style_id}.jpg"
    if os.path.exists(output_path):
        print(f"Skipping {style_id}, already exists.")
        continue
        
    print(f"Generating reference image for style {style_id}...")
    full_prompt = (
        f"A photorealistic, highly detailed portrait of a handsome man with a {prompt_desc}. "
        f"He is facing forward, looking directly at the camera, well-lit studio photography, "
        f"neutral background, sharp focus, 8k resolution, photorealistic face, realistic hair texture."
    )
    
    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": full_prompt,
                "negative_prompt": "ugly, distorted, poorly drawn, blurry, unnatural lighting",
                "width": 1024,
                "height": 1024,
                "refine": "expert_ensemble_refiner"
            }
        )
        
        replicate_url = list(output)[0] if type(output).__name__ == 'generator' else (output[0] if isinstance(output, list) else str(output))
        
        img_response = requests.get(replicate_url)
        if img_response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(img_response.content)
            print(f"Successfully saved {output_path}")
        else:
            print(f"Failed to download image for style {style_id}")
            
        import time
        time.sleep(11)
            
    except Exception as e:
        print(f"Failed to generate style {style_id}: {e}")

print("Reference generation complete.")
