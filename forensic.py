import sys
sys.path.append('/app/services/ai-service')
import cv2
import numpy as np
import os
import traceback

try:
    from ai_engine import AIEngine
    engine = AIEngine()
    
    uploads_dir = '/app/uploads'
    if not os.path.exists(uploads_dir):
        print(f"Uploads dir not found: {uploads_dir}")
        sys.exit(0)
        
    images = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('mask_') and not f.startswith('gen_')]
    
    if not images:
        print("No test images found in uploads.")
        sys.exit(0)
        
    test_image = os.path.join(uploads_dir, images[0])
    
    hair_analysis = {"length": "SHORT", "hairline": "NORMAL"}
    style_data = {"category": "SHORT", "specs": {"volume": "LOW"}, "name": "Classic Side Part"}
    
    output_mask = os.path.join(uploads_dir, 'forensic_mask_test.jpg')
    
    print(f"Running masking on {test_image}...")
    engine.build_dynamic_hair_mask(test_image, output_mask, hair_analysis, style_data)
    
    if not os.path.exists(output_mask):
        print("Mask was not generated.")
        sys.exit(1)
        
    mask = cv2.imread(output_mask, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        print("Mask image could not be read.")
        sys.exit(1)
        
    total_pixels = mask.shape[0] * mask.shape[1]
    masked_pixels = np.sum(mask > 128)
    percentage = (masked_pixels / total_pixels) * 100
    
    print(f"Test Image: {test_image}")
    print(f"Mask Percentage: {percentage:.2f}%")
    print(f"Mask saved to: {output_mask}")
    
except Exception as e:
    traceback.print_exc()
