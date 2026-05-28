import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Get file from formData
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get UploadThing token
    const rawToken = process.env.UPLOADTHING_TOKEN;

    if (!rawToken) {
      return NextResponse.json(
        { error: "UPLOADTHING_TOKEN missing" },
        { status: 500 }
      );
    }

    // Decode token
    let apiKey = "";

    try {
      const decoded = JSON.parse(
        Buffer.from(rawToken, "base64").toString("utf8")
      );

      apiKey = decoded.apiKey;

      console.log("[upload-logo] apiKey exists:", !!apiKey);
    } catch (err) {
      console.error("[upload-logo] token decode failed", err);

      return NextResponse.json(
        { error: "Invalid UploadThing token" },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key missing inside token" },
        { status: 500 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();

    const base64 = Buffer.from(bytes).toString("base64");

    // Upload request
    const uploadRes = await fetch(
      "https://uploadthing.com/api/uploadFiles",
      {
        method: "POST",
        headers: {
          "x-uploadthing-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [
            {
              name: file.name,
              size: file.size,
              type: file.type,
              data: base64,
            },
          ],
        }),
      }
    );

    const responseText = await uploadRes.text();

    console.log("[upload-logo] response:", responseText);

    if (!uploadRes.ok) {
      return NextResponse.json(
        {
          error: responseText,
        },
        {
          status: 500,
        }
      );
    }

    const json = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      data: json,
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
      {
        status: 500,
      }
    );
  }
}