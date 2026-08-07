import os
import cv2
import numpy as np
from ai_engine import AIEngine

def test_pipeline():
    engine = AIEngine()
    
    # We will use the existing images in uploads folder if any, or mock
    uploads = "uploads"
    if not os.path.exists(uploads):
        print("No uploads directory found.")
        return
        
    images = [f for f in os.listdir(uploads) if f.endswith(".jpg") and not f.startswith("mask_") and not "_style_" in f]
    if not images:
        print("No test images found.")
        return
        
    test_img = os.path.join(uploads, images[0])
    mask_path = os.path.join(uploads, "test_mask_output.jpg")
    
    print(f"Testing True Hair Mask on: {test_img}")
    try:
        engine.generate_face_mask(test_img, mask_path)
        print(f"Mask generated successfully at {mask_path}")
        
        # Verify mask logic (black background vs white hair)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        white_pixels = np.sum(mask == 255)
        black_pixels = np.sum(mask == 0)
        
        print(f"White pixels (Editable): {white_pixels}")
        print(f"Black pixels (Protected): {black_pixels}")
        
        if white_pixels > 0 and black_pixels > 0:
            print("PASS: Mask contains both protected and editable regions.")
        else:
            print("FAIL: Mask is entirely one color.")
            
    except Exception as e:
        print(f"Test failed with error: {e}")

if __name__ == "__main__":
    test_pipeline()
