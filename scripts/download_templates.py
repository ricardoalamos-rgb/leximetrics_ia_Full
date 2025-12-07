import os
import requests
import re
from urllib.parse import urlparse, parse_qs

# List of template URLs provided by the user
URLS = [
    "https://drive.google.com/file/d/1NLoh7AEHOVzjqJbzyDOv1ns8qP0awGJz/view?usp=drive_link",
    "https://drive.google.com/file/d/1I9diWUzckXpKR-v-WUtoxjY3neI7vNYY/view?usp=drive_link",
    "https://drive.google.com/file/d/123AsTXSbQ_R1WvSr965IbP2Y6rQIkins/view?usp=drive_link",
    "https://drive.google.com/file/d/11iwS7W5Bo15FCRF6fWSE0jvMe5h2JSnF/view?usp=drive_link",
    "https://drive.google.com/file/d/1KUUh_8PVhBZUKE9J14Cs74dfX85_7QAk/view?usp=drive_link",
    "https://drive.google.com/file/d/1hfff2oGjntGMCreWtuu5R-E8tuke06Vt/view?usp=drive_link",
    "https://drive.google.com/file/d/19qjp7yObJJQ6EXayuO3xHXWL0MKsOmTn/view?usp=drive_link",
    "https://drive.google.com/file/d/1bHB8W7jONaxGwo-fYPTodUH4P68NiMws/view?usp=drive_link",
    "https://drive.google.com/file/d/1nL-VsIveZm6RUSLdLTDP7YMQ77EcBlxD/view?usp=drive_link",
    "https://drive.google.com/file/d/1Q7k50S32-btDjqVWG4EJqbHekorFyoop/view?usp=drive_link",
    "https://drive.google.com/file/d/1lKdKQiEGh0qpeVHtajG8wii4d2X-wYsD/view?usp=drive_link",
    "https://docs.google.com/document/d/1X-uH-dzJzhjC5R5IRXV38cKMbBD0gTVT/edit?usp=drive_link&ouid=110054559173277585775&rtpof=true&sd=true",
    "https://docs.google.com/document/d/1O71gfu7ON1ByJcKDqoi3wtuRPTIZIIZa/edit?usp=drive_link&ouid=110054559173277585775&rtpof=true&sd=true",
    "https://drive.google.com/file/d/1_CgXM2wng7iPAdk5zuKIxe1MQRS--LBh/view?usp=drive_link",
    "https://drive.google.com/file/d/19hYQ3APcRBn1vTEdgiGHkJqK_BVwY6S8/view?usp=drive_link",
    "https://drive.google.com/file/d/1E8Zmmv0yIM8Aq4_N5rZPjeFBoP4GQNcn/view?usp=drive_link",
    "https://drive.google.com/file/d/1pxi4Ey4YmBsvDA6dEL1PgljaLdVRtweY/view?usp=sharing",
    "https://docs.google.com/document/d/1PZk_2Hh0bnvFj4BODhmiM29fnkgvBYLU/edit?usp=drive_link&ouid=110054559173277585775&rtpof=true&sd=true",
    "https://drive.google.com/file/d/1xuIZKj-8vUv9C2_GVq0tGQx0dkyb6MAB/view?usp=drive_link",
    "https://drive.google.com/file/d/1_Dbfzv1iwFjo9cyA8L0L0tGfvGpHa9eJ/view?usp=drive_link",
    "https://drive.google.com/file/d/1dFYnBFOo6iSloy5rMSfjB7u23KgV5UNt/view?usp=drive_link",
    "https://drive.google.com/file/d/1HYifUi9bNHwxRloyFv6CtxmRvVJ0KCZH/view?usp=drive_link",
    "https://drive.google.com/file/d/12ipxQTOQlnARIdAECfWuc3IPQYogAPz3/view?usp=drive_link",
    "https://docs.google.com/document/d/1jsUpitb3g3TKzjwfy1FZT4hYOqeTNnCq/edit?usp=drive_link&ouid=110054559173277585775&rtpof=true&sd=true"
]

DEST_DIR = "packages/db/templates"

def get_id_from_url(url):
    # Extract ID from /file/d/... or /document/d/...
    match = re.search(r'\/d\/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None

def download_file(file_id, dest_path):
    download_url = f'https://drive.google.com/uc?export=download&id={file_id}'
    try:
        response = requests.get(download_url, stream=True)
        # Check if we got a confirmation page (for large files)
        if "confirm" in response.cookies: # Obsolete method but sometimes useful, checking headers is better
            pass 
        
        # Simple download attempt
        if response.status_code == 200:
            # Try to get filename from Content-Disposition
            filename = None
            if "Content-Disposition" in response.headers:
                cd = response.headers["Content-Disposition"]
                match = re.search(r'filename="?([^"]+)"?', cd)
                if match:
                    filename = match.group(1)
            
            if not filename:
                filename = f"{file_id}.docx" # Default

            final_path = os.path.join(dest_path, filename)
            
            with open(final_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=32768):
                    if chunk:
                        f.write(chunk)
            print(f"✅ Downloaded: {filename}")
            return filename
        else:
            print(f"❌ Failed to download {file_id}: Status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error downloading {file_id}: {e}")
        return None

def main():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        
    print(f"⬇️ Downloading {len(URLS)} templates to {DEST_DIR}...")
    
    count = 0
    for url in URLS:
        fid = get_id_from_url(url)
        if fid:
            res = download_file(fid, DEST_DIR)
            if res:
                count += 1
        else:
            print(f"⚠️ Could not extract ID from {url}")

    print(f"✨ Finished. Downloaded {count}/{len(URLS)} files.")

if __name__ == "__main__":
    main()
