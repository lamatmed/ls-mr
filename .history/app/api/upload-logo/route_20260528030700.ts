import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const uploaded = await utapi.uploadFiles(file);

    if (uploaded.error) {
      return NextResponse.json(
        { error: uploaded.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploaded.data?.ufsUrl,
      key: uploaded.data?.key,
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