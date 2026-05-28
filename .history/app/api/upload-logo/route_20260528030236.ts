import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file" },
        { status: 400 }
      );
    }

    const rawToken = process.env.UPLOADTHING_TOKEN!;

    const decoded = JSON.parse(
      Buffer.from(rawToken, "base64").toString("utf8")
    );

    const apiKey = decoded.apiKey;

    // Convert file to base64
    const bytes = await file.arrayBuffer();

    const base64 = Buffer.from(bytes).toString("base64");

    // Upload directly
    const res = await fetch(
      "https://uploadthing.com/api/uploadFiles",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [
            {
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64,
            },
          ],
        }),
      }
    );

    const text = await res.text();

    console.log(text);

    if (!res.ok) {
      return NextResponse.json(
        { error: text },
        { status: 500 }
      );
    }

    const json = JSON.parse(text);

    return NextResponse.json({
      success: true,
      data: json,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}