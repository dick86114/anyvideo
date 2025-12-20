## Implementation Plan

### Overview
Modify the existing `handleDownload` function to package all parsed content into a single zip file, including videos, images, and a manifest file.

### Implementation Steps

1. **Install Required Library**
   - Add `jszip` library to handle zip file creation
   - Command: `npm install jszip` in the frontend directory

2. **Import Library**
   - Add `import JSZip from 'jszip'` to `ContentParsing.jsx`

3. **Modify `handleDownload` Function**
   - Replace current single-file download with zip packaging
   - Create a JSZip instance
   - Create a manifest.json file with content metadata
   - Download all media files sequentially
   - Add files to zip with proper organization:
     - Main media file in root directory
     - Additional images in `images/` subdirectory
     - manifest.json in root directory
   - Update progress state during download
   - Generate and download the zip file

4. **File Organization**
   ```
   zip-file-name/
   ├── manifest.json          # Content metadata
   ├── main-media.mp4         # Main video file (if applicable)
   └── images/                # Additional images directory
       ├── image1.jpg
       ├── image2.jpg
       └── ...
   ```

5. **Manifest File Structure**
   ```json
   {
     "title": "Content Title",
     "author": "Content Author",
     "platform": "xiaohongshu",
     "media_type": "video",
     "download_date": "2025-12-20T10:00:00Z",
     "files": [
       {
         "name": "main-media.mp4",
         "type": "video",
         "url": "original-url",
         "size": "10.5MB"
       },
       {
         "name": "images/image1.jpg",
         "type": "image",
         "url": "original-url",
         "size": "2.3MB"
       }
     ]
   }
   ```

6. **Progress Feedback**
   - Update `downloadProgress` state for each file downloaded
   - Show progress percentage and current file being processed
   - Display success/failure message after download completes

### Expected Behavior
- Clicking "下载当前文件" (Download Current File) will:
  1. Show progress bar with percentage
  2. Create a zip package containing all parsed content
  3. Download the zip file to the user
  4. Show success message upon completion
- The zip file will maintain proper organization and include all media files and a manifest

### Technical Considerations
- Ensure proper error handling for failed downloads
- Preserve original file formats and quality
- Support for both video and image content types
- Compatibility with modern browsers
- Proper cleanup of temporary data