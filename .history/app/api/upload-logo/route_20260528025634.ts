import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Decode UploadThing token
    const rawToken = process.env.UPLOADTHING_TOKEN!;

    const decoded = JSON.parse(
      Buffer.from(rawToken, "base64").toString("utf-8")
    );

    const apiKey = decoded.apiKey;

    // Convert file to bytes
    const bytes = await file.arrayBuffer();

    // STEP 1: Request presigned URL
    const presignRes = await fetch(
      "https://uploadthing.com/api/uploadFiles",
      {
        method: "POST",
        headers: {
          "x-uploadthing-api-key": apiKey,
          "x-uploadthing-version": "7.7.3",
          "x-uploadthing-be-adapter": "server-sdk",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [
            {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: Date.now(),
            },
          ],
          contentDisposition: "inline",
        }),
      }
    );

    if (!presignRes.ok) {
      const err = await presignRes.text();

      console.error(
        "[upload-logo] presign failed:",
        presignRes.status,
        err
      );

      return NextResponse.json(
        { error: "Presign failed: " + err },
        { status: 500 }
      );
    }

    const presignJson = await presignRes.json();

    console.log(
      "[upload-logo] presign ok:",
      JSON.stringify(presignJson).slice(0, 400)
    );

    const fileData = presignJson?.data?.[0];

    if (!fileData) {
      return NextResponse.json(
        { error: "No file data returned" },
        { status: 500 }
      );
    }

    // Get presigned URL
    const presignedUrl =
      fileData.presignedUrls?.[0] ??
      fileData.presignedUrl ??
      fileData.url;

    if (!presignedUrl) {
      return NextResponse.json(
        { error: "No presigned URL returned" },
        { status: 500 }
      );
    }

    // STEP 2: Upload file to storage
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text().catch(() => "");

      console.error(
        "[upload-logo] upload failed:",
        uploadRes.status,
        uploadErr
      );

      return NextResponse.json(
        { error: "Upload to storage failed" },
        { status: 500 }
      );
    }

    // Final file URL
    const finalUrl =
      fileData.fileUrl ??
      fileData.appUrl ??
      `https://utfs.io/f/${fileData.key}`;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      key: fileData.key,
    });
  } catch (error) {
    console.error("[upload-logo]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}