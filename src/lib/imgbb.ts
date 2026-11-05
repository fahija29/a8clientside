// Shared ImgBB upload helper — book covers are hosted there so the MongoDB
// record only ever stores a public image URL, never base64 data.

const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

/**
 * Uploads a cover file to ImgBB and returns its hosted URL. ImgBB accepts
 * multipart forms, so the File is sent directly (never read into memory) and
 * only the returned URL — not base64 — is kept for the book record.
 */
export async function uploadCoverToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Image hosting is not configured — the ImgBB API key is missing."
    );
  }

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", file);

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("The cover upload to Imgbb failed. Please try again.");
  }

  const json = (await response.json()) as {
    data?: { url?: string; display_url?: string };
  };

  const url = json.data?.url ?? json.data?.display_url;

  if (!url) {
    throw new Error("The cover upload did not return a usable image URL.");
  }

  return url;
}
