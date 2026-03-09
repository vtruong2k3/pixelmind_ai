import os
import requests

def download_bfl_background():
    # URL của ảnh nền (dạng webp) bfl.ai phần (Underwater)
    url = "https://cdn.sanity.io/images/2gpum2i6/production/1a6d33de3465ea3dadf8456cd9413b42b7a1f52d-2000x1081.webp"
    save_path = "bfl_banner_background.webp"
    
    print(f"[*] Đang requests tới CDN của bfl.ai: {url}")
    try:
        # Giả lập header của trình duyệt
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
            
        with open(save_path, 'wb') as f:
            f.write(response.content)
            
        print(f"[SUCCESS] Tải thành công! Ảnh được lưu tại: {os.path.abspath(save_path)}")
            
    except Exception as e:
        print(f"[ERROR] Đã xảy ra lỗi: {e}")

if __name__ == "__main__":
    download_bfl_background()
