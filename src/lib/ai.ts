import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateAutoAnswer(
  question: string,
  transcript?: string | null
): Promise<string> {
  const anthropic = getClient();

  const systemParts: string[] = [
    "당신은 홍익대학교 Claude AI 강좌의 한국어 교육 조교입니다.",
    "학생들의 질문에 정확하고 도움이 되는 답변을 한국어로 제공하세요.",
    "답변은 명확하고 이해하기 쉽게 작성하세요.",
  ];

  if (transcript) {
    systemParts.push(
      `\n다음은 관련 강의 녹취록입니다. 답변 시 참고하세요:\n\n${transcript}`
    );
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    system: systemParts.join("\n"),
    messages: [
      {
        role: "user",
        content: question,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function generateQuestionInsight(
  question: string,
  aiAnswer: string,
  instructorAnswer: string
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 400,
    system:
      "당신은 홍익대학교 Claude AI 강좌의 교육 분석 전문가입니다. " +
      "학생 질문과 그에 대한 AI 답변, 강사 답변을 종합하여 이 질문의 핵심 인사이트를 " +
      "3~5줄 이내로 간결하게 한국어로 정리하세요. " +
      "불필요한 수사 없이 학습 포인트·오해 지점·실무 팁을 bullet point로 제시하세요.",
    messages: [
      {
        role: "user",
        content: `질문: ${question}\n\nAI 답변: ${aiAnswer}\n\n강사 답변: ${instructorAnswer}\n\n이 질문의 핵심 인사이트를 간결히 정리해 주세요.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function generateInsights(
  questions: {
    content: string;
    ai_answer?: string | null;
    instructor_answer?: string | null;
  }[]
): Promise<string> {
  const anthropic = getClient();

  const questionsText = questions
    .map((q, i) => {
      let entry = `질문 ${i + 1}: ${q.content}`;
      if (q.ai_answer) entry += `\nAI 답변: ${q.ai_answer}`;
      if (q.instructor_answer) entry += `\n강사 답변: ${q.instructor_answer}`;
      return entry;
    })
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    system:
      "당신은 홍익대학교 Claude AI 강좌의 교육 분석 전문가입니다. " +
      "학생들의 질문을 분석하여 핵심 주제, 일반적인 오해, 주목할 만한 인사이트를 파악하세요. " +
      "결과를 한국어로 구조화하여 제공하세요.",
    messages: [
      {
        role: "user",
        content: `다음 학생 질문들을 분석하여 핵심 주제, 일반적인 오해, 주목할 만한 인사이트를 정리해 주세요:\n\n${questionsText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}
