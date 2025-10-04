// client/services/imageServices.ts 

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";
import { ResponseProps } from "@/types";
import axios from "axios";

const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadFileToCloudinary = async (
  file: { uri?: string } | string,
  folderName: string
): Promise<ResponseProps> => {
  try {
    if (!file) return { success: true, data: null };

    // already upload file url
    if (typeof file == "string") return { success: true, data: file };

    if (file && file.uri) {
      // ready to upload
      const formData = new FormData();
      formData.append("file", {
        uri: file?.uri,
        type: "image/jpeg",
        name: file?.uri.split("/").pop() || "file.jpg",
      } as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folderName);

      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: response?.data?.secure_url };
    }

    return { success: true, data: null };
  } catch (error: any) {
    console.log("got error uploading the file", error);
    return { success: false, msg: error.message || "Could not upload file" };
  }
};

export const getAvatarPath = (file: any, isGroup = false) => {
  if (file && typeof file == "string") return file;

  if (file && typeof file == "object") return file.uri;

  if (isGroup) return require("../assets/images/defaultGroupAvatar.png");

  return require("../assets/images/defaultAvatar.png");
};
