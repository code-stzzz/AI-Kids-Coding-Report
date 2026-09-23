import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { encryptKey, decryptKey } from "../src/lib/ai/crypto";
import {
  changeSettings,
  settingsView,
  type StoredSettings,
} from "../src/lib/ai/server";
import { parseReport, validateBaseUrl } from "../src/lib/ai/validation";
import { invokeCompatible } from "../src/lib/ai/provider";
import {
  GET as getSettings,
  POST as saveSettings,
} from "../src/app/api/ai/settings/route";
import { POST as testConnection } from "../src/app/api/ai/test/route";
import { POST as generate } from "../src/app/api/ai/generate/route";

const userA = "10000000-0000-4000-8000-000000000001";
const userB = "10000000-0000-4000-8000-000000000002";
const secret = "test-provider-secret-12345678";
const empty: StoredSettings = {
  profiles: [],
  activeProfileId: null,
  revision: 0,
  storageReady: true,
};
const profile = {
  name: "测试接口",
  provider: "deepseek" as const,
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-flash",
  apiKey: secret,
};
const report = {
  progressDescription: "进步表现",
  improvementDescription: "提升方向",
  encouragementMessage: "鼓励寄语",
  improvementPlan1: "建议一",
  improvementPlan2: "建议二",
  improvementPlan3: "建议三",
};
const actualFetch = globalThis.fetch;
const originalEnv = { ...process.env };
type Row = {
  user_id: string;
  profiles: unknown[];
  active_profile_id: string | null;
  revision: number;
};
const rows = new Map<string, Row>();
let providerStatus = 200;
let providerContent = JSON.stringify(report);
let providerCalls = 0;

before(() => {
  process.env.AI_CONFIG_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://database.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.COZE_SUPABASE_URL = "https://database.example.test";
  process.env.COZE_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    if (url.hostname === "api.deepseek.com") {
      providerCalls++;
      assert.equal(headers.get("authorization"), `Bearer ${secret}`);
      assert.equal(init?.redirect, "error");
      assert.equal(headers.get("cookie"), null);
      assert.equal(headers.get("x-forwarded-for"), null);
      return Response.json(
        providerStatus === 200
          ? {
              choices: [{ message: { content: providerContent } }],
              usage: { total_tokens: 24 },
            }
          : { error: { message: `upstream secret ${secret}` } },
        { status: providerStatus },
      );
    }
    assert.equal(
      url.hostname,
      "database.example.test",
      "test must never contact a real service",
    );
    if (url.pathname === "/auth/v1/user") {
      const token = headers.get("authorization");
      const id =
        token === "Bearer user-a"
          ? userA
          : token === "Bearer user-b"
            ? userB
            : null;
      return id
        ? Response.json({
            id,
            aud: "authenticated",
            email: "teacher@example.test",
          })
        : Response.json({ message: "Invalid token" }, { status: 401 });
    }
    assert.equal(url.pathname, "/rest/v1/ai_provider_settings");
    assert.equal(headers.get("authorization"), "Bearer test-service-role");
    const userId = url.searchParams.get("user_id")?.replace(/^eq\./, "");
    if (!init?.method || init.method === "GET")
      return Response.json(
        userId && rows.has(userId) ? [rows.get(userId)] : [],
      );
    const row = JSON.parse(String(init?.body));
    if (init?.method === "POST") {
      if (rows.has(row.user_id))
        return Response.json({ code: "23505" }, { status: 409 });
      rows.set(row.user_id, row);
      return Response.json([{ user_id: row.user_id }], { status: 201 });
    }
    if (init?.method === "PATCH") {
      const current = rows.get(userId!);
      if (
        !current ||
        url.searchParams.get("revision") !== `eq.${current.revision}`
      )
        return Response.json([]);
      rows.set(userId!, { ...current, ...row });
      return Response.json([{ user_id: userId }]);
    }
    throw new Error("Unexpected database operation");
  };
});

after(() => {
  globalThis.fetch = actualFetch;
  for (const key of [
    "AI_CONFIG_ENCRYPTION_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "COZE_SUPABASE_URL",
    "COZE_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function request(body?: unknown, token = "user-a") {
  return new NextRequest("https://app.example.test/api/ai/settings", {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("encryption binds credentials to user and destination; ciphertext cannot be tampered with", () => {
  const first = encryptKey(secret, "user-a:provider-1");
  assert.notEqual(first, encryptKey(secret, "user-a:provider-1"));
  assert.equal(decryptKey(first, "user-a:provider-1"), secret);
  assert.throws(() => decryptKey(first, "user-b:provider-1"));
  assert.throws(() =>
    decryptKey(first.slice(0, -5) + "AAAAA", "user-a:provider-1"),
  );
});

test("settings preserve keys on editing; never expose ciphertext or plaintext; reject cross-user keys", () => {
  const saved = changeSettings(userA, empty, {
    action: "save",
    revision: 0,
    profile,
  });
  const view = settingsView(saved);
  assert.equal(view.profiles[0].keyHint, "5678");
  assert.ok(!JSON.stringify(view).includes(secret));
  assert.ok(!JSON.stringify(view).includes("ciphertext"));
  const updated = changeSettings(userA, saved, {
    action: "save",
    revision: 1,
    profile: { ...profile, id: saved.profiles[0].id, apiKey: "", name: "改名" },
  });
  assert.equal(updated.profiles[0].ciphertext, saved.profiles[0].ciphertext);
  assert.throws(() =>
    changeSettings(userB, saved, {
      action: "select",
      revision: 1,
      id: saved.profiles[0].id,
    }),
  );
  assert.throws(() =>
    changeSettings(userA, saved, { action: "select", revision: 0, id: null }),
  );
  assert.throws(() =>
    changeSettings(userA, saved, {
      action: "save",
      revision: 1,
      profile: {
        ...profile,
        id: saved.profiles[0].id,
        provider: "siliconflow",
        baseUrl: "https://api.siliconflow.cn/v1",
        apiKey: "",
      },
    }),
  );
});

test("endpoint validation rejects unsafe destinations and normalizes completion URLs", () => {
  for (const value of [
    "http://api.deepseek.com",
    "https://localhost/v1",
    "https://127.0.0.1",
    "https://169.254.169.254",
    "https://api.deepseek.com.evil.test",
    "https://user:secret@api.deepseek.com",
    "https://api.deepseek.com?token=secret",
    "https://api.deepseek.com:8443",
  ]) {
    assert.throws(() => validateBaseUrl("custom", value));
  }
  assert.equal(
    validateBaseUrl("deepseek", "https://api.deepseek.com/chat/completions/"),
    "https://api.deepseek.com",
  );
});

test("report parser accepts fenced JSON but rejects incomplete, null or non-text fields", () => {
  assert.deepEqual(
    parseReport("```json\n" + JSON.stringify(report) + "\n```"),
    report,
  );
  for (const content of [
    "null",
    "{}",
    JSON.stringify({ ...report, improvementPlan3: "" }),
    JSON.stringify({ ...report, progressDescription: 42 }),
  ])
    assert.throws(() => parseReport(content));
});

test("API verifies the token, enforces ownership, persists selection and uses it for report generation", async () => {
  assert.equal(
    (await getSettings(request(undefined, "forged-token"))).status,
    401,
  );
  const created = await saveSettings(
    request({ action: "save", revision: 0, profile }),
  );
  assert.equal(created.status, 200);
  const view = await created.json();
  assert.equal(view.profiles.length, 1);
  assert.ok(!JSON.stringify(view).includes(secret));
  assert.equal(
    (await (await getSettings(request(undefined, "user-b"))).json()).profiles
      .length,
    0,
  );
  assert.equal(
    (await testConnection(request({ id: view.profiles[0].id }, "user-b")))
      .status,
    404,
  );
  assert.equal(
    (
      await saveSettings(
        request(
          { action: "select", id: view.profiles[0].id, revision: 0 },
          "user-b",
        ),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await saveSettings(
        request({ action: "select", id: view.profiles[0].id, revision: 1 }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await saveSettings(
        request({ action: "delete", id: view.profiles[0].id, revision: 2 }),
      )
    ).status,
    400,
  );
  const testResult = await testConnection(request({ id: view.profiles[0].id }));
  assert.equal(testResult.status, 200);
  assert.equal((await testResult.json()).totalTokens, 24);
  const input = {
    languageName: "Python",
    courseUnitName: "U1",
    currentStageContent: "变量",
    studentName: "测试学生",
    radarDimensions: Array.from({ length: 6 }, () => ({
      name: "能力",
      score: 8,
    })),
  };
  assert.deepEqual(await (await generate(request(input))).json(), report);
  providerContent = '{"progressDescription":"incomplete"}';
  assert.equal((await generate(request(input))).status, 502);
  providerContent = JSON.stringify(report);
  providerStatus = 401;
  const failure = await generate(request(input));
  assert.equal(failure.status, 502);
  assert.ok(!(await failure.text()).includes(secret));
  providerStatus = 200;
  const callsBefore = providerCalls;
  assert.equal(
    (await generate(request({ ...input, radarDimensions: [] }))).status,
    400,
  );
  assert.equal(providerCalls, callsBefore);
  assert.equal(
    (await saveSettings(request({ action: "select", id: null, revision: 1 })))
      .status,
    409,
  );
  assert.equal(
    (await saveSettings(request({ action: "select", id: null, revision: 2 })))
      .status,
    200,
  );
  assert.equal(
    (
      await saveSettings(
        request({ action: "delete", id: view.profiles[0].id, revision: 3 }),
      )
    ).status,
    200,
  );
});

test("transport errors are sanitized and requests do not follow redirects", async () => {
  const connection = { ...profile, apiKey: secret };
  const failingFetch: typeof fetch = async (_url, options) => {
    assert.equal(options?.redirect, "error");
    throw new Error(`private network error containing ${secret}`);
  };
  await assert.rejects(
    invokeCompatible(
      connection,
      [{ role: "user", content: "test" }],
      failingFetch,
    ),
    (error) => error instanceof Error && !error.message.includes(secret),
  );
});
