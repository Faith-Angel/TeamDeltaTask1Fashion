import os
from PIL import Image
from pathlib import Path

def convert_and_rename_images(root_dir):
    """
    1. Convert all .jfif files to .jpg
    2. Rename all images in each folder to image_001, image_002, etc.
    """
    converted_count = 0
    renamed_count = 0
    error_count = 0
    
    # Walk through all subdirectories
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip the root directory itself, only process subfolders
        if dirpath == root_dir:
            continue
            
        # Get all image files in current folder (both .jfif and .jpg)
        image_files = []
        for filename in filenames:
            lower_name = filename.lower()
            if lower_name.endswith(('.jfif', '.jpg', '.jpeg', '.png')):
                image_files.append(filename)
        
        if not image_files:
            continue
            
        # Sort files to ensure consistent ordering
        image_files.sort()
        
        print(f"\n📁 Processing: {os.path.basename(dirpath)} - Found {len(image_files)} images")
        
        # First pass: Convert .jfif to .jpg
        temp_files = {}
        for filename in image_files:
            if filename.lower().endswith('.jfif'):
                jfif_path = os.path.join(dirpath, filename)
                base_name = os.path.splitext(filename)[0]
                temp_jpg_path = os.path.join(dirpath, f"{base_name}_temp.jpg")
                
                try:
                    with Image.open(jfif_path) as img:
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        img.save(temp_jpg_path, 'JPEG', quality=95)
                    
                    # Store mapping for renaming later
                    temp_files[filename] = temp_jpg_path
                    converted_count += 1
                    print(f"  ✅ Converted: {filename}")
                    
                except Exception as e:
                    error_count += 1
                    print(f"  ❌ Error converting {filename}: {str(e)}")
        
        # Get all files again (now includes converted .jpg files)
        final_files = []
        for filename in os.listdir(dirpath):
            lower_name = filename.lower()
            if lower_name.endswith(('.jpg', '.jpeg', '.png')):
                # Skip temporary files from conversion
                if '_temp.jpg' not in filename:
                    final_files.append(filename)
        
        # Also add the converted files
        for original, temp_path in temp_files.items():
            temp_filename = os.path.basename(temp_path)
            if temp_filename not in final_files:
                final_files.append(temp_filename)
        
        final_files.sort()
        
        # Second pass: Rename all images to image_001, image_002, etc.
        for index, filename in enumerate(final_files, start=1):
            old_path = os.path.join(dirpath, filename)
            
            # Determine extension
            ext = os.path.splitext(filename)[1]
            new_filename = f"image_{index:03d}{ext}"
            new_path = os.path.join(dirpath, new_filename)
            
            # Handle duplicate names
            counter = 1
            while os.path.exists(new_path) and old_path != new_path:
                new_filename = f"image_{index:03d}_{counter}{ext}"
                new_path = os.path.join(dirpath, new_filename)
                counter += 1
            
            if old_path != new_path:
                try:
                    os.rename(old_path, new_path)
                    renamed_count += 1
                    print(f"  🔄 Renamed: {filename} → {new_filename}")
                    
                    # If this was a temp file, we need to update the temp mapping
                    # (but we handle this in the next step)
                except Exception as e:
                    error_count += 1
                    print(f"  ❌ Error renaming {filename}: {str(e)}")
        
        # Clean up any remaining temporary files
        for filename in os.listdir(dirpath):
            if '_temp.jpg' in filename:
                try:
                    os.remove(os.path.join(dirpath, filename))
                    print(f"  🧹 Removed temp file: {filename}")
                except:
                    pass
    
    print(f"\n📊 Summary:")
    print(f"  ✅ Converted: {converted_count} files")
    print(f"  🔄 Renamed: {renamed_count} files")
    print(f"  ❌ Errors: {error_count}")

def create_metadata_csv(root_dir, output_path="seed_data/metadata.csv"):
    """
    Generate a metadata.csv file based on the folder structure
    """
    import pandas as pd
    import re
    
    data = []
    image_count = 0
    
    # Define category mapping based on folder names
    category_map = {
        '01_traditional_clothing': 'clothing',
        '02_modern_clothing': 'clothing',
        '03_traditional_hairstyles': 'hairstyle',
        '04_modern_hairstyles': 'hairstyle',
        '05_accessories': 'accessory',
        '06_portfolio_samples': 'portfolio'
    }
    
    traditional_map = {
        '01_traditional_clothing': True,
        '02_modern_clothing': False,
        '03_traditional_hairstyles': True,
        '04_modern_hairstyles': False,
        '05_accessories': False,
        '06_portfolio_samples': False
    }
    
    # Walk through all subdirectories
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if dirpath == root_dir:
            continue
            
        folder_name = os.path.basename(dirpath)
        category = category_map.get(folder_name, 'other')
        traditional = traditional_map.get(folder_name, False)
        
        # Get all image files
        for filename in filenames:
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                # Extract ID from filename (image_001, image_002, etc.)
                match = re.search(r'image_(\d+)', filename)
                if match:
                    img_id = f"img_{int(match.group(1)):03d}"
                else:
                    image_count += 1
                    img_id = f"img_{image_count:03d}"
                
                # Create relative path
                relative_path = os.path.join('seed_data', 'images', folder_name, filename)
                
                data.append({
                    'id': img_id,
                    'filepath': relative_path.replace('\\', '/'),  # Use forward slashes for consistency
                    'category': category,
                    'traditional': traditional,
                    'region': 'Unknown',  # You can update this manually
                    'occasion': 'Unknown',  # You can update this manually
                    'price_range': 'Unknown'  # You can update this manually
                })
    
    # Create DataFrame and save
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"\n📄 Created metadata.csv with {len(df)} entries at: {output_path}")
    return df

if __name__ == "__main__":
    # Path to your images directory
    images_path = r"C:\Users\USER\Desktop\MC's work\AWS-reDeploy-team-Delta\TeamDeltaTask1Fashion\ml-service\seed_data\images"
    
    # Check if directory exists
    if not os.path.exists(images_path):
        print(f"❌ Directory not found: {images_path}")
        print("Please check the path and try again.")
    else:
        print("🔄 Starting conversion and renaming process...")
        convert_and_rename_images(images_path)
        print("\n" + "="*50)
        print("📊 Generating metadata.csv...")
        create_metadata_csv(images_path)
        print("\n✅ Complete! Your images are ready for CLIP processing!")