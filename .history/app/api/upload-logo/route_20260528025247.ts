import { NextResponse } from "next/server";

function getApiKey(): string {
  const token = process.env.UPLOADTHING_TOKEN!;
  const payload = JSON.parse(Buffer.from(token, "base64").toString());
  return payload.apiKey as string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const apiKey = getApiKey();

    // Step 1: Request a presigned upload URL from UploadThing
    const presignRes = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
      method: "POST",
      headers: {
        "x-uploadthing-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acl: "public-read",
        contentDisposition: "inline",
        files: [{ name: file.name, size: file.size, type: file.type }],
      }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.text();
      console.error("[upload-logo] presign failed:", err);
      return NextResponse.json({ error: "Presign failed" }, { status: 500 });
    }

    const presignData = await presignRes.json();
    const fileData = presignData.data?.[0];
    if (!fileData) return NextResponse.json({ error: "No presign data" }, { status: 500 });

    const { url: presignedUrl, fields, appUrl, key } = fileData;

    // Step 2: Upload file to the presigned URL
    const uploadBody = new FormData();
    if (fields) {
      for (const [k, v] of Object.entries(fields)) {
        uploadBody.append(k, v as string);
      }
    }
    uploadBody.append("file", file);

    const uploadRes = await fetch(presignedUrl, { method: "POST", body: uploadBody });
    if (!uploadRes.ok) {
      console.error("[upload-logo] upload failed:", uploadRes.status, await uploadRes.text());
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Final URL — prefer appUrl (CDN), fallback to utfs.io
    const finalUrl = appUrl ?? `https://utfs.io/f/${key}`;
    return NextResponse.json({ url: finalUrl });
  } catch (e) {
    console.error("[upload-logo]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
