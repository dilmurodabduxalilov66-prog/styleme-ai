import os
import sys
import time
import cv2
import numpy as np
import psutil
import json

from face_analysis import analyze_face
from hair_segmentation import generate_sam2_masks

def get_mediapipe_mask(image):
    import mediapipe as mp
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    with mp_selfie_segmentation.SelfieSegmentation(model_selection=0) as selfie_seg:
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = selfie_seg.process(img_rgb)
        mask = (results.segmentation_mask > 0.1).astype(np.uint8) * 255
        return mask

def calculate_iou(mask1, mask2):
    intersection = np.logical_and(mask1 > 0, mask2 > 0).sum()
    union = np.logical_or(mask1 > 0, mask2 > 0).sum()
    return intersection / union if union > 0 else 0.0

def apply_color_mask(image, mask, color, alpha=0.5):
    colored_mask = np.zeros_like(image)
    colored_mask[mask > 0] = color
    return cv2.addWeighted(image, 1.0, colored_mask, alpha, 0)

def main():
    uploads_dir = '/app/uploads'
    if not os.path.exists(uploads_dir):
        print(f"Directory {uploads_dir} not found.")
        sys.exit(1)
        
    images = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('mask_') and not f.startswith('gen_') and not f.startswith('sam2_')]
    if not images:
        print("No test images found.")
        sys.exit(1)
        
    test_image_path = os.path.join(uploads_dir, images[0])
    img = cv2.imread(test_image_path)
    
    # 1. MediaPipe Profiling
    start_mp = time.time()
    mp_mask = get_mediapipe_mask(img)
    time_mp = (time.time() - start_mp) * 1000
    
    # 2. SAM2 Profiling
    face_data = analyze_face(img)
    start_sam2 = time.time()
    sam2_masks = generate_sam2_masks(img, face_data['landmarks'], face_data['face_bbox'])
    time_sam2 = (time.time() - start_sam2) * 1000
    
    # 3. Compute IoU for Hair Mask
    sam2_hair = sam2_masks['hair']
    iou = calculate_iou(mp_mask, sam2_hair)
    
    # 4. Generate Visualizations
    colors = {
        'hair': (0, 0, 255),       # Red
        'ear': (0, 255, 0),        # Green
        'forehead': (255, 0, 0),   # Blue
        'neck': (255, 255, 0),     # Cyan
        'shoulder': (255, 0, 255), # Magenta
        'beard': (0, 255, 255)     # Yellow
    }
    
    vis_sam2 = img.copy()
    for region, mask in sam2_masks.items():
        vis_sam2 = apply_color_mask(vis_sam2, mask, colors[region], alpha=0.6)
        
    cv2.imwrite('/app/uploads/sam2_masks.jpg', vis_sam2)
    
    # Side-by-side MP vs SAM2 Hair
    vis_mp = apply_color_mask(img.copy(), mp_mask, (0, 0, 255))
    vis_sam2_hair_only = apply_color_mask(img.copy(), sam2_hair, (0, 0, 255))
    
    comparison = np.hstack((vis_mp, vis_sam2_hair_only))
    cv2.imwrite('/app/uploads/mediapipe_vs_sam2.jpg', comparison)
    
    # Output Report
    report = {
        "execution_time_ms": {
            "mediapipe": time_mp,
            "sam2": time_sam2
        },
        "hair_iou": iou,
        "regions_detected": list(sam2_masks.keys())
    }
    
    print("--- BENCHMARK REPORT ---")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
