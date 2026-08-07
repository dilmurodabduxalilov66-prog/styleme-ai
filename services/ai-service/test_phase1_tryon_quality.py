import cv2
import numpy as np
import os
import sys

def test_identity_preservation(orig_path, gen_path, mask_path):
    print(f"--- Testing Identity Preservation ---")
    orig_img = cv2.imread(orig_path)
    gen_img = cv2.imread(gen_path)
    mask_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    
    if orig_img is None or gen_img is None or mask_img is None:
        print("[!] Test failed: Could not load images.")
        return False
        
    if orig_img.shape != gen_img.shape:
        gen_img = cv2.resize(gen_img, (orig_img.shape[1], orig_img.shape[0]))
    if orig_img.shape[:2] != mask_img.shape[:2]:
        mask_img = cv2.resize(mask_img, (orig_img.shape[1], orig_img.shape[0]))
        
    # Get inverted mask (protected region)
    protected_mask = cv2.bitwise_not(mask_img)
    
    # Extract protected regions from both images
    orig_protected = cv2.bitwise_and(orig_img, orig_img, mask=protected_mask)
    gen_protected = cv2.bitwise_and(gen_img, gen_img, mask=protected_mask)
    
    # Calculate MSE (Mean Squared Error) in the protected region
    diff = cv2.absdiff(orig_protected, gen_protected)
    non_zero_pixels = cv2.countNonZero(protected_mask)
    
    if non_zero_pixels == 0:
        print("[!] Warning: No protected region found.")
        return False
        
    mse = np.sum(diff**2) / (non_zero_pixels * 3)
    print(f"[*] MSE on protected region (Face, Body, Background): {mse:.4f}")
    
    max_pixel_diff = np.max(diff)
    print(f"[*] Max pixel difference in protected region: {max_pixel_diff}")
    
    if mse < 1.0 and max_pixel_diff < 5:
        print("[+] PASS: Face and background are perfectly preserved!")
        return True
    else:
        print("[-] FAIL: Identity drift detected outside hair region!")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python test_phase1_tryon_quality.py <orig_img> <gen_img> <mask_img>")
        sys.exit(1)
    
    test_identity_preservation(sys.argv[1], sys.argv[2], sys.argv[3])
