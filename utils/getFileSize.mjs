import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;
const RECORDED_DIR = path.join(__dirname, "../recorded");

const formatFileSize = (sizeInBytes) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (sizeInBytes >= GB) {
    return (sizeInBytes / GB).toFixed(2) + " GB";
  } else if (sizeInBytes >= MB) {
    return (sizeInBytes / MB).toFixed(2) + " MB";
  } else if (sizeInBytes >= KB) {
    return (sizeInBytes / KB).toFixed(2) + " KB";
  } else {
    return sizeInBytes + " B";
  }
};

const getFileSizes = async (files) => {
  const result = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(RECORDED_DIR, file);
      const stats = await fs.promises.stat(filePath);

      return {
        name: file,
        size: formatFileSize(stats.size),
      };
    })
  );

  return result;
};

export default getFileSizes;
