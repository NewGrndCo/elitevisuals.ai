import { NextResponse } from "next/server";
import { createPublicClient, getPrompt } from "@/lib-next/supabase";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token)
      return NextResponse.json({ error: "Sign in to reveal this prompt." }, { status: 401 });
    const { data, error } = await createPublicClient().auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous)
      return NextResponse.json(
        { error: "Your session expired. Please sign in again." },
        { status: 401 },
      );
    const prompt = await getPrompt((await params).slug);
    if (!prompt) return NextResponse.json({ error: "Prompt not found." }, { status: 404 });
    return NextResponse.json(
      { prompt: prompt.prompt_text },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load the prompt. Please retry." },
      { status: 503 },
    );
  }
}
