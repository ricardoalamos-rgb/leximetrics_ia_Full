import os
import requests
import re
import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL_NAME

# Local Data Path inside container
DATA_DIR = "/app/data/templates"

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

def get_id_from_url(url):
    match = re.search(r'\/d\/([a-zA-Z0-9_-]+)', url)
    if match: return match.group(1)
    return None

def download_file(file_id, dest_path):
    download_url = f'https://drive.google.com/uc?export=download&id={file_id}'
    try:
        response = requests.get(download_url, stream=True)
        filename = f"{file_id}.pdf"
        if response.status_code == 200:
            if "Content-Disposition" in response.headers:
                cd = response.headers["Content-Disposition"]
                match = re.search(r'filename="?([^"]+)"?', cd)
                if match: filename = match.group(1)
            
            final_path = os.path.join(dest_path, filename)
            if os.path.exists(final_path):
                print(f"File exists: {filename}")
                return filename

            with open(final_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=32768):
                    if chunk: f.write(chunk)
            print(f"Downloaded: {filename}")
            return filename
    except Exception as e:
        print(f"Error downloading {file_id}: {e}")
    return None

def run_ingestion():
    print("🚀 Starting Background Ingestion...")
    
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)

    print(f"Downloading {len(URLS)} resources...")
    for url in URLS:
        fid = get_id_from_url(url)
        if fid: download_file(fid, DATA_DIR)
        
    print("Initializing Chroma...")
    try:
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )
        collection = client.get_or_create_collection(name="libros", embedding_function=embedding_fn)
    except Exception as e:
        print(f"Chroma Init Error: {e}")
        return

    files = sorted(os.listdir(DATA_DIR))
    print(f"Found {len(files)} files to ingest.")
    
    count = 0
    chunks_total = 0
    
    for f in files:
        if f.startswith("."): continue
        file_path = os.path.join(DATA_DIR, f)
        text = ""
        try:
            if f.lower().endswith('.pdf'):
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            else:
                pass # skip non-pdf for now
        except Exception:
            continue
            
        if not text.strip(): continue
        
        # Simple Chunking
        chunk_size = 1000
        overlap = 100
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i:i+chunk_size]
            if len(chunk) > 50: chunks.append(chunk)

        if chunks:
            ids = [f"{f}-{i}" for i in range(len(chunks))]
            metadatas = [{"source": f, "page_chunk": i, "type": "book"} for i in range(len(chunks))]
            try:
                collection.upsert(documents=chunks, metadatas=metadatas, ids=ids)
                chunks_total += len(chunks)
                count += 1
            except Exception as e:
                print(f"Error upserting {f}: {e}")

    print(f"✅ Ingestion Complete: {count} books, {chunks_total} chunks.")
