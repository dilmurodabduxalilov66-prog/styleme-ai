import os
import sys
import time
import cv2
import numpy as np
import psutil
import json

from face_analysis import analyze_face

def draw_pose(img, head_pose, bbox):
    """ Draw a 3D axis representing the head pose """
    # head_pose: pitch, yaw, roll
    pitch = head_pose['pitch']
    yaw = head_pose['yaw']
    roll = head_pose['roll']
    
    tdx = (bbox[0] + bbox[2]) / 2
    tdy = (bbox[1] + bbox[3]) / 2
    size = (bbox[2] - bbox[0]) / 2

    # X-Axis pointing to right. drawn in red
    x1 = size * (np.cos(yaw) * np.cos(roll)) + tdx
    y1 = size * (np.cos(pitch) * np.sin(roll) + np.cos(roll) * np.sin(pitch) * np.sin(yaw)) + tdy

    # Y-Axis | drawn in green
    x2 = size * (-np.cos(yaw) * np.sin(roll)) + tdx
    y2 = size * (np.cos(pitch) * np.cos(roll) - np.sin(pitch) * np.sin(yaw) * np.sin(roll)) + tdy

    # Z-Axis (out of the screen) drawn in blue
    x3 = size * (np.sin(yaw)) + tdx
    y3 = size * (-np.cos(yaw) * np.sin(pitch)) + tdy

    cv2.line(img, (int(tdx), int(tdy)), (int(x1), int(y1)), (0, 0, 255), 3)
    cv2.line(img, (int(tdx), int(tdy)), (int(x2), int(y2)), (0, 255, 0), 3)
    cv2.line(img, (int(tdx), int(tdy)), (int(x3), int(y3)), (255, 0, 0), 2)

    return img

def main():
    uploads_dir = '/app/uploads'
    if not os.path.exists(uploads_dir):
        print(f"Directory {uploads_dir} not found.")
        sys.exit(1)
        
    images = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('mask_') and not f.startswith('gen_')]
    if not images:
        print("No test images found.")
        sys.exit(1)
        
    test_image_path = os.path.join(uploads_dir, images[0])
    print(f"Testing on image: {test_image_path}")
    
    img = cv2.imread(test_image_path)
    if img is None:
        print("Could not read image.")
        sys.exit(1)
        
    cv2.imwrite('/app/uploads/original.jpg', img)

    # Memory Tracking - Before
    process = psutil.Process(os.getpid())
    mem_before = process.memory_info().rss / 1024 / 1024 # MB

    # Warmup
    try:
        analyze_face(img)
    except Exception as e:
        print(f"Warmup Failed: {e}")
        sys.exit(1)

    # Benchmark Execution
    start_time = time.time()
    result = analyze_face(img)
    end_time = time.time()
    
    latency_ms = (end_time - start_time) * 1000

    # Memory Tracking - After
    mem_after = process.memory_info().rss / 1024 / 1024 # MB
    
    # Visualization: Landmarks
    img_landmarks = img.copy()
    bbox = result['face_bbox']
    
    cv2.rectangle(img_landmarks, (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (255, 0, 0), 2)
    
    for pt in result['landmarks']:
        cv2.circle(img_landmarks, (int(pt[0]), int(pt[1])), 2, (0, 255, 0), -1)
        
    cv2.imwrite('/app/uploads/landmarks.jpg', img_landmarks)
    
    # Visualization: Head Pose
    img_pose = img.copy()
    img_pose = draw_pose(img_pose, result['head_pose'], bbox)
    cv2.imwrite('/app/uploads/head_pose.jpg', img_pose)
    
    # Print Report Data
    report = {
        "latency_ms": latency_ms,
        "memory_used_mb": mem_after - mem_before,
        "total_memory_mb": mem_after,
        "face_bbox": result['face_bbox'],
        "landmarks_count": len(result['landmarks']),
        "head_pose": result['head_pose'],
        "face_embedding_size": len(result['face_embedding'])
    }
    
    print("--- BENCHMARK REPORT ---")
    print(json.dumps(report, indent=2))
    
if __name__ == "__main__":
    main()
