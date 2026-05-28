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
    const bytes = await file.arrayBuffer();

    // Step 1: Request presigned URL via UploadThing REST API v7
    const presignRes = await fetch("https://api.uploadthing.com/v7/uploadFiles", {
      method: "POST",
      headers: {
        "x-uploadthing-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acl: "public-read",
        files: [{ name: file.name, type: file.type, size: file.size, customId: null }],
      }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.text();
      console.error("[upload-logo] presign failed:", presignRes.status, err);
      return NextResponse.json({ error: "Presign failed: " + err }, { status: 500 });
    }

    const presignJson = await presignRes.json();
    console.log("[upload-logo] presign response:", JSON.stringify(presignJson).slice(0, 300));

    const fileData = presignJson?.data?.[0];
    if (!fileData) {
      return NextResponse.json({ error: "No file data in response" }, { status: 500 });
    }

    const presignedUrl = fileData.presignedUrls?.[0] ?? fileData.presignedUrl ?? fileData.url;
    if (!presignedUrl) {
      return NextResponse.json({ error: "No presigned URL in response" }, { status: 500 });
    }

    // Step 2: Upload file bytes directly via PUT
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text().catch(() => "");
      console.error("[upload-logo] upload failed:", uploadRes.status, uploadErr);
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
    }

    const finalUrl = fileData.fileUrl ?? fileData.appUrl ?? `https://utfs.io/f/${fileData.key}`;
    return NextResponse.json({ url: finalUrl });
  } catch (e) {
    console.error("[upload-logo]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
