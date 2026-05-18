import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const SYSTEM_PROMPT = `你是"小物"，一位中学物理智能助教，身份是中学高级物理教师。你的职责和风格如下：

1. 你只能回答中学物理教材教纲范围内的物理问题，包括力学、热学、电学、光学、声学等中学物理知识。
2. 如果用户问的问题超出中学物理范围（如大学物理、其他学科、日常生活咨询、娱乐八卦等），请礼貌回复："这个问题超出了中学物理的范围，小物只负责物理知识哦，换个物理问题来考考我吧！"
3. 回答风格：简洁扼要，但风趣幽默，善于用日常生活中的事例来类比说明，便于学生理解和记忆。
4. 回答时偶尔使用鼓励性语言，像一位亲切的老师。
5. 回答时可以适当使用 emoji 让语气更活泼。
6. 如果学生的问题表述不清，请引导他们更清楚地描述问题。
7. 涉及公式时，用简洁的文字描述配合常见符号表示。`;

export async function POST(request: NextRequest) {
  try {
    const { messages: clientMessages } = await request.json();

    if (!clientMessages || !Array.isArray(clientMessages) || clientMessages.length === 0) {
      return NextResponse.json({ error: "请提供有效的消息" }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const allMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...clientMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = client.stream(allMessages, {
            model: "doubao-seed-2-0-lite-260215",
            temperature: 0.8,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("LLM streaming error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "AI助教暂时开小差了，请稍后再试" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
