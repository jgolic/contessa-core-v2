import OpenAI from "openai";
import { canGenerateDemoCrewPortraits } from "../../../src/lib/runtime_config.mjs";

function safeText(value = "") {
  return String(value).replace(/[<>]/g, "").slice(0, 160);
}

export async function POST(request) {
  try {
    if (!canGenerateDemoCrewPortraits()) {
      return Response.json(
        {
          error: "Demo portrait generation is disabled in this production deployment.",
        },
        { status: 403 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await request.json();
    const name = safeText(body?.name || "Crew Member");
    const position = safeText(body?.position || "Yacht Crew");
    const department = safeText(body?.department || "General");
    const vesselName = safeText(body?.vesselName || "Private Yacht");

    const prompt = `
Create a realistic studio ID portrait of a fictional professional superyacht crew member.

Subject:
${name}, ${position}, ${department} department onboard ${vesselName}.

Visual direction:
- realistic photographic portrait
- shoulders-up ID card composition
- premium yacht crew appearance
- subtle tasteful pirate styling
- elegant dark naval jacket
- refined pirate-inspired hat or nautical accessory
- clean neutral background
- professional soft studio lighting
- luxury maritime tone
- polished, serious, premium

Rules:
- no weapons
- no swords
- no guns
- no violence
- no skull symbols
- no scary expression
- no cartoon style
- no text in the image
- do not make it look like an official passport photo
- make it clearly suitable for a demo crew CV profile
`.trim();

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: "1024x1536",
    });

    const image = result?.data?.[0];

    if (!image?.b64_json) {
      return Response.json(
        { error: "Image generation did not return image data." },
        { status: 502 }
      );
    }

    return Response.json({
      imageDataUrl: `data:image/png;base64,${image.b64_json}`,
      disclaimer:
        "DEMO IMAGE — GENERATED FOR TESTING ONLY. NOT AN OFFICIAL CREW DOCUMENT.",
    });
  } catch (error) {
    console.error("Demo crew portrait generation failed:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Unable to generate demo crew portrait at this time.",
      },
      { status: 500 }
    );
  }
}
