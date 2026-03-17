import axios from "axios";

const CHAINHUB_BASE = process.env.CHAINHUB_API_URL!;
const CHAINHUB_API_KEY = process.env.CHAINHUB_API_KEY!;

export interface GenerateParams {
  prompt: string;
  image?: Uint8Array | Blob; // Không bắt buộc với text to image
  image_2?: Uint8Array | Blob;
  imageFileName?: string;
  image2FileName?: string;
  width?: number;
  height?: number;
  quality?: "sd" | "hd";
  orientation?: "portrait" | "landscape" | "square";
}

function toBlob(data: Uint8Array | Blob, type = "image/png"): Blob {
  if (data instanceof Blob) return data;
  return new Blob([data.buffer as ArrayBuffer], { type });
}

// ──────────────────────────────────────────────────────────
// Bước 1: Submit task → nhận task_id (EXPORT để generate route dùng)
// POST https://generate.chainhub.tech/xxxxxx
// Response: { task_id: "xxx", status: "PROCESSING", ... }
// ──────────────────────────────────────────────────────────
export async function submitTask(params: GenerateParams): Promise<string | null> {
  const {
    prompt,
    image,
    image_2,
    imageFileName = "image.png",
    image2FileName = "image_2.png",
    width = 1024,
    height = 1536,
    quality = "sd",
    orientation = "portrait",
  } = params;

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("width", String(width));
  formData.append("height", String(height));
  formData.append("quality", quality);
  formData.append("orientation", orientation);
  
  if (image) {
    formData.append("image", toBlob(image), imageFileName);
  }
  if (image_2) {
    formData.append("image_2", toBlob(image_2), image2FileName);
  }

  try {
    const res = await axios.post<{
      task_id: string;
      status: string;
      result: null;
      error: null | string;
    }>(CHAINHUB_BASE, formData, {
      headers: {
        Authorization: `Bearer ${CHAINHUB_API_KEY}`,
      },
      responseType: "json",
      timeout: 30_000,
    });

    const taskId = res.data?.task_id;
    if (!taskId) {
      console.error("[chainhub] Không có task_id trong response:", res.data);
      return null;
    }

    console.log(`[chainhub] Task submitted → task_id: ${taskId}`);
    return taskId;
  } catch (err: any) {
    console.error("[chainhub] Submit error:", err?.response?.status, err?.response?.data ?? err?.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// Bước 2: Poll trạng thái task
// GET https://generate.chainhub.tech/xxxxxxxx/{task_id}
// Response khi xong:
// {
//   task_id: "...", status: "COMPLETED",
//   result: { data: [{ url: "https://s3...", b64_json: null }] }
// }
// ──────────────────────────────────────────────────────────
interface PollResult {
  task_id: string;
  status: "PROCESSING" | "QUEUED" | "COMPLETED" | "FAILED" | string;
  result: {
    data: Array<{ url: string; b64_json: string | null }>;
    created: number;
  } | null;
  error: string | null;
}

async function pollTask(
  taskId: string,
  maxWaitMs = 300_000,   // 5 phút tối đa
  intervalMs = 3_000     // poll mỗi 3 giây
): Promise<string | null> {
  const statusUrl = `${CHAINHUB_BASE}/${taskId}`;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs));

    try {
      const res = await axios.get<PollResult>(statusUrl, {
        headers: { Authorization: `Bearer ${CHAINHUB_API_KEY}` },
        responseType: "json",
        timeout: 15_000,
      });

      const { status, result, error } = res.data;
      console.log(`[chainhub] Poll ${taskId}: status=${status}`);

      if (error) {
        console.error("[chainhub] Task error:", error);
        return null;
      }

      if (status === "COMPLETED") {
        const imageUrl = result?.data?.[0]?.url;
        if (imageUrl) {
          console.log(`[chainhub] COMPLETED → URL: ${imageUrl.slice(0, 80)}...`);
          return imageUrl; // ← S3 pre-signed URL (7 ngày)
        }
        console.error("[chainhub] COMPLETED nhưng không có URL:", result);
        return null;
      }

      if (status === "FAILED") {
        console.error("[chainhub] Task FAILED:", res.data);
        return null;
      }

      // status = "PROCESSING" | "QUEUED" → tiếp tục poll
    } catch (err: any) {
      console.error("[chainhub] Poll error:", err?.response?.status, err?.message);
    }
  }

  console.error(`[chainhub] Timeout sau ${maxWaitMs / 1000}s`);
  return null;
}

// ──────────────────────────────────────────────────────────
// pollOnce: Gọi status endpoint 1 lần (EXPORT để status route dùng)
// Hỗ trợ cả `chainhub.tech/images/edits` và `chainhub.tech/images/generations` vì /taskId nó là global
// Tuy nhiên endpoint đúng để tra cứu task là `/edits/:id` hoặc `/generations/:id` tuỳ thuộc vào ban đầu tạo ở đâu.
// (Giả sử cả 2 đều dùng chung 1 polling endpoint /edits hoặc phải gọi đúng type - ở đây tôi gọi GET trên CHAINHUB_BASE).
// CHAINHUB_BASE thường trỏ tới /images/edits, nhưng TaskID global thì có thể /images/edits/:taskId vẫn trả về nếu API thiết kế tốt,
// nếu không thì phải sửa CHAINHUB_BASE, nhưng tạm thời tôi sử dụng CHAINHUB_BASE/:taskId.
// ──────────────────────────────────────────────────────────
export async function pollOnce(
  taskId: string
): Promise<{ status: string; outputUrl?: string } | null> {
  const statusUrl = `${CHAINHUB_BASE}/${taskId}`;
  try {
    const res = await axios.get<PollResult>(statusUrl, {
      headers: { Authorization: `Bearer ${CHAINHUB_API_KEY}` },
      responseType: "json",
      timeout: 12_000,
    });
    const { status, result, error } = res.data;
    console.log(`[chainhub] pollOnce ${taskId}: status=${status}`);
    if (error) return { status: "FAILED" };
    if (status === "COMPLETED") {
      const outputUrl = result?.data?.[0]?.url;
      return { status, outputUrl };
    }
    return { status: status ?? "PROCESSING" };
  } catch (err: any) {
    console.error("[chainhub] pollOnce error:", err?.response?.status, err?.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// generateImageUrl: submit + poll loop (dự phòng)
// ──────────────────────────────────────────────────────────
export async function generateImageUrl(
  params: GenerateParams
): Promise<string | null> {
  const taskId = await submitTask(params);
  if (!taskId) return null;
  return await pollTask(taskId);
}

// ──────────────────────────────────────────────────────────
// generateImageRaw: download binary (dự phòng nếu cần upload lên R2)
// ──────────────────────────────────────────────────────────
export async function generateImageRaw(
  params: GenerateParams
): Promise<Uint8Array | null> {
  const imageUrl = await generateImageUrl(params);
  if (!imageUrl) return null;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error("[chainhub] Download thất bại:", imgRes.status);
      return null;
    }
    const buffer = await imgRes.arrayBuffer();
    console.log(`[chainhub] Downloaded ${buffer.byteLength} bytes`);
    return new Uint8Array(buffer);
  } catch (err) {
    console.error("[chainhub] Download error:", err);
    return null;
  }
}
