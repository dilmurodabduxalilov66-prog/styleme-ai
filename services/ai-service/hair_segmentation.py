import os
import cv2
import numpy as np
import torch
try:
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
except ImportError:
    pass

_sam2_predictor = None

def init_sam2():
    global _sam2_predictor
    if _sam2_predictor is None:
        checkpoint_path = "/app/models/sam2_hiera_tiny.pt"
        model_cfg = "sam2_hiera_t.yaml"
        
        # Ensure the model directory exists
        os.makedirs("/app/models", exist_ok=True)
        
        # If running on CPU, use appropriate device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        if not os.path.exists(checkpoint_path):
            print("SAM2 Checkpoint not found. Please download sam2_hiera_tiny.pt")
            return None
            
        print(f"Loading SAM2 model on {device}...")
        sam2_model = build_sam2(model_cfg, checkpoint_path, device=device)
        _sam2_predictor = SAM2ImagePredictor(sam2_model)
        
    return _sam2_predictor

def get_prompts_from_landmarks(landmarks, bbox):
    """
    Map 106 InsightFace landmarks to semantic regions.
    Returns a dict with positive points and negative points for each region.
    Note: 106 landmarks mapping:
    - Jawline: 0-32
    - Eyebrows: 33-42
    - Nose: 43-51
    - Eyes: 52-71
    - Mouth: 72-105
    """
    prompts = {}
    
    # 1. Hair: Positive points above eyebrows, Negative points on eyes/nose/mouth
    # Approximate top of head by moving up from eyebrows
    left_eyebrow = landmarks[33:38]
    right_eyebrow = landmarks[38:43]
    top_y = min([p[1] for p in left_eyebrow + right_eyebrow])
    center_x = (bbox[0] + bbox[2]) / 2
    
    hair_pos = [[center_x, top_y - (bbox[3] - bbox[1])*0.15], 
                [center_x - (bbox[2]-bbox[0])*0.2, top_y - (bbox[3] - bbox[1])*0.1],
                [center_x + (bbox[2]-bbox[0])*0.2, top_y - (bbox[3] - bbox[1])*0.1]]
    hair_neg = [landmarks[46], landmarks[72]] # tip of nose, mouth
    prompts["hair"] = (hair_pos, hair_neg)
    
    # 2. Ear: Points 0, 1 (left) and 31, 32 (right)
    ear_pos = [landmarks[0], landmarks[32]]
    ear_neg = [landmarks[46], landmarks[72], [center_x, top_y - (bbox[3] - bbox[1])*0.15]]
    prompts["ear"] = (ear_pos, ear_neg)
    
    # 3. Forehead: Between eyebrows and hairline
    forehead_pos = [[center_x, top_y - (bbox[3] - bbox[1])*0.05]]
    forehead_neg = [landmarks[46], hair_pos[0]]
    prompts["forehead"] = (forehead_pos, forehead_neg)
    
    # 4. Neck: Below jaw (point 16 is chin)
    chin = landmarks[16]
    neck_pos = [[chin[0], chin[1] + (bbox[3] - bbox[1])*0.15]]
    neck_neg = [landmarks[46], hair_pos[0]]
    prompts["neck"] = (neck_pos, neck_neg)
    
    # 5. Shoulder: Further below and wider
    shoulder_pos = [[chin[0] - (bbox[2]-bbox[0])*0.8, chin[1] + (bbox[3] - bbox[1])*0.4],
                    [chin[0] + (bbox[2]-bbox[0])*0.8, chin[1] + (bbox[3] - bbox[1])*0.4]]
    shoulder_neg = [landmarks[46], neck_pos[0]]
    prompts["shoulder"] = (shoulder_pos, shoulder_neg)
    
    # 6. Beard: Jawline (2 to 30) and chin
    beard_pos = [landmarks[8], landmarks[16], landmarks[24]]
    beard_neg = [landmarks[52], landmarks[61], neck_pos[0]] # Eyes and neck
    prompts["beard"] = (beard_pos, beard_neg)
    
    return prompts

def generate_sam2_masks(image: np.ndarray, landmarks: list, bbox: list):
    """
    Generates 6 distinct semantic masks using SAM2 based on facial landmarks.
    """
    predictor = init_sam2()
    if not predictor:
        raise RuntimeError("SAM2 predictor failed to initialize.")
        
    predictor.set_image(image)
    
    region_prompts = get_prompts_from_landmarks(landmarks, bbox)
    results = {}
    
    for region, (pos_pts, neg_pts) in region_prompts.items():
        input_point = np.array(pos_pts + neg_pts)
        input_label = np.array([1]*len(pos_pts) + [0]*len(neg_pts))
        
        masks, scores, logits = predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=False,
        )
        
        # mask is shape (1, H, W). Convert to (H, W) uint8
        binary_mask = (masks[0] > 0).astype(np.uint8) * 255
        results[region] = binary_mask
        
    return results
