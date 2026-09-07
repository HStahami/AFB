import os
import shutil

def sync():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    src = os.path.join(root, 'backend', 'app')
    dst = os.path.join(root, 'api', 'app')
    
    print(f"Syncing from {src} to {dst}...")
    
    for root_dir, dirs, files in os.walk(dst, topdown=False):
        for f in files:
            if f.endswith(('.py', '.pyc')):
                try:
                    os.remove(os.path.join(root_dir, f))
                except Exception:
                    pass
        for d in dirs:
            if d == '__pycache__':
                shutil.rmtree(os.path.join(root_dir, d), ignore_errors=True)
                
    for root_dir, dirs, files in os.walk(src):
        if '__pycache__' in root_dir:
            continue
        rel = os.path.relpath(root_dir, src)
        target_dir = os.path.join(dst, rel)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            if f.endswith('.py') and not f.endswith('.pyc'):
                shutil.copy2(os.path.join(root_dir, f), os.path.join(target_dir, f))
                
    print("Sync complete!")

if __name__ == '__main__':
    sync()
