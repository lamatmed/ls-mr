import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const token = process.env.UPLOADTHING_TOKEN!;
    const bytes = await file.arrayBuffer();

    // Step 1: Request presigned URL — send full token as API key (UploadThing v7+)
    const presignRes = await fetch("https://api.uploadthing.com/v7/uploadFiles", {
      method: "POST",
      headers: {
        "x-uploadthing-api-key": token,
        "x-uploadthing-version": "7.7.3",
        "x-uploadthing-be-adapter": "server-sdk",
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
    console.log("[upload-logo] presign ok:", JSON.stringify(presignJson).slice(0, 400));

    const fileData = presignJson?.data?.[0];
    if (!fileData) return NextResponse.json({ error: "No file data returned" }, { status: 500 });

    const presignedUrl = fileData.presignedUrls?.[0] ?? fileData.presignedUrl ?? fileData.url;
    if (!presignedUrl) return NextResponse.json({ error: "No presigned URL" }, { status: 500 });

    // Step 2: Upload file bytes via PUT to presigned URL
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: bytes,
    });

    if (!uploadRes.ok) {
      console.error("[upload-logo] upload failed:", uploadRes.status, await uploadRes.text().catch(() => ""));
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
    }

    const finalUrl = fileData.fileUrl ?? fileData.appUrl ?? `https://utfs.io/f/${fileData.key}`;
    return NextResponse.json({ url: finalUrl });
  } catch (e) {
    console.error("[upload-logo]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
