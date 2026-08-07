import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis

# Global model instance
_face_app = None

def load_face_model():
    """
    Initializes the InsightFace model with the 'buffalo_l' pack.
    Configures it to use the fastest available provider (CUDA if available, else CPU).
    """
    global _face_app
    if _face_app is None:
        # We try to use CUDA if available, fallback to CPU
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        _face_app = FaceAnalysis(name='buffalo_l', providers=providers)
        # ctx_id=0 means GPU, -1 means CPU. We let the provider decide, or force CPU if no GPU.
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
        print("InsightFace model 'buffalo_l' loaded successfully.")
    return _face_app

def analyze_face(image: np.ndarray):
    """
    Analyzes an OpenCV image and extracts facial features.
    Returns:
        dict containing:
        - face_bbox: [x1, y1, x2, y2]
        - landmarks: list of 106 [x, y] coordinates
        - head_pose: {"yaw": float, "pitch": float, "roll": float}
        - face_embedding: 512D float array (numpy)
    """
    app = load_face_model()
    
    # InsightFace expects BGR images (same as cv2 default)
    faces = app.get(image)
    
    if not faces:
        raise ValueError("No faces detected in the image.")
        
    # Assume the largest face is the target
    target_face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
    
    # Bounding box
    face_bbox = target_face.bbox.tolist()
    
    # Landmarks 106 (buffalo_l provides either 106 or 2d/3d 68 depending on the specific models loaded, 
    # but the default landmark_3d_68 or landmark_2d_106 is accessible).
    # 'landmark_2d_106' is standard for buffalo_l.
    if hasattr(target_face, 'landmark_2d_106') and target_face.landmark_2d_106 is not None:
        landmarks = target_face.landmark_2d_106.tolist()
    elif hasattr(target_face, 'landmark_3d_68'):
        landmarks = target_face.landmark_3d_68.tolist() # Fallback
    else:
        landmarks = target_face.kps.tolist() # Basic 5 keypoints fallback
        
    # Head pose
    pose = target_face.pose # [pitch, yaw, roll]
    head_pose = {
        "pitch": float(pose[0]),
        "yaw": float(pose[1]),
        "roll": float(pose[2])
    }
    
    # Face embedding
    face_embedding = target_face.embedding.tolist() if target_face.embedding is not None else []

    return {
        "face_bbox": face_bbox,
        "landmarks": landmarks,
        "head_pose": head_pose,
        "face_embedding": face_embedding
    }
