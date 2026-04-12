import { test as base, expect } from "@playwright/test";
import Anthropic from "@anthropic-ai/sdk";

type AiAssertOptions = {
  screenshot?: boolean;
  strict?: boolean;
};

type AiFixture = {
  aiAssert: (
    assertion: string,
    options?: AiAssertOptions
  ) => Promise<void>;
};

const cache = new Map<string, { pass: boolean; reason: string }>();

const SYSTEM_PROMPT = `Eres un evaluador de pruebas E2E para una aplicación web de psicología clínica (Psicobienestar).
La app está en español (Guatemala). Recibirás:
1. La URL actual de la página
2. El contenido de texto visible de la página
3. Una aserción en lenguaje natural a evaluar

Responde SOLO con JSON válido: { "pass": boolean, "reason": string }
- "pass" es true si la aserción se cumple con el contenido de la página
- "reason" explica brevemente tu evaluación (1-2 oraciones)
- Sé estricto: "pass" debe ser true solo si la aserción se cumple claramente
- Considera calidad UX, accesibilidad, tono y corrección semántica
- La app atiende pacientes buscando apoyo psicológico — el tono debe ser cálido, profesional y empático
- No penalices datos faltantes (ej: "sin citas") — solo evalúa lo que SÍ está presente
- Si se incluye una imagen, evalúa también aspectos visuales como layout, colores y diseño`;

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(36);
}

export const test = base.extend<AiFixture>({
  aiAssert: async ({ page }, use, testInfo) => {
    const enabled = process.env.AI_ASSERT_ENABLED !== "false";
    const client = enabled ? new Anthropic() : null;

    const aiAssert = async (
      assertion: string,
      options: AiAssertOptions = {}
    ) => {
      const { screenshot = false, strict = false } = options;

      if (!enabled || !client) {
        console.log(`[aiAssert] Skipped (disabled): "${assertion}"`);
        return;
      }

      const url = page.url();
      const textContent = await page.innerText("body").catch(() => "");
      const truncatedText = textContent.slice(0, 8000);
      const cacheKey = `${url}:${hashContent(truncatedText)}:${assertion}`;

      const cached = cache.get(cacheKey);
      if (cached) {
        if (!cached.pass) {
          throw new Error(
            `AI assertion failed: "${assertion}"\nReason: ${cached.reason}`
          );
        }
        return;
      }

      try {
        const messages: Anthropic.MessageParam[] = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `URL: ${url}\n\nContenido de la página:\n${truncatedText}\n\nAserción a evaluar: ${assertion}`,
              },
            ],
          },
        ];

        if (screenshot) {
          const screenshotBuffer = await page.screenshot({ fullPage: false });
          const base64Image = screenshotBuffer.toString("base64");
          messages[0].content = [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `URL: ${url}\n\nContenido de la página:\n${truncatedText}\n\nAserción a evaluar: ${assertion}`,
            },
          ];

          await testInfo.attach("ai-screenshot", {
            body: screenshotBuffer,
            contentType: "image/png",
          });
        }

        const response = await client.messages.create({
          model: "claude-haiku-4-20250414",
          max_tokens: 256,
          system: SYSTEM_PROMPT,
          messages,
        });

        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === "text"
        );

        if (!textBlock) {
          if (strict) {
            throw new Error("AI assertion returned no text response");
          }
          console.log(
            `[aiAssert] No text response from AI for: "${assertion}"`
          );
          return;
        }

        // Extract JSON from response (handle potential markdown wrapping)
        let jsonStr = textBlock.text.trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        const result = JSON.parse(jsonStr) as {
          pass: boolean;
          reason: string;
        };

        cache.set(cacheKey, result);

        if (!result.pass) {
          throw new Error(
            `AI assertion failed: "${assertion}"\nReason: ${result.reason}`
          );
        }

        console.log(
          `[aiAssert] PASS: "${assertion}" — ${result.reason}`
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.startsWith("AI assertion failed:")
        ) {
          throw err;
        }
        // API call failure
        if (strict) {
          throw err;
        }
        console.log(
          `[aiAssert] AI call failed (non-strict): "${assertion}" — ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    };

    await use(aiAssert);
  },
});

export { expect };