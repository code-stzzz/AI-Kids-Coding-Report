"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/components/providers/UserProvider";
import { authFetch } from "@/lib/data-api";
import {
  AI_PRESETS,
  type AIProvider,
  type AISettingsView,
  type PublicAIProfile,
} from "@/lib/ai/catalog";

interface ProfileForm {
  id?: string;
  name: string;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
}
const newForm = (): ProfileForm => ({
  name: "我的 DeepSeek",
  provider: "deepseek",
  baseUrl: AI_PRESETS.deepseek.baseUrl,
  model: AI_PRESETS.deepseek.model,
  apiKey: "",
});

export default function AISettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [settings, setSettings] = useState<AISettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<ProfileForm>(newForm);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; text: string }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/api/ai/settings");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取配置失败");
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取配置失败，请重试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading) {
      if (user) void load();
      else setLoading(false);
    }
  }, [user, userLoading, load]);

  async function mutate(
    action: Record<string, unknown>,
    label: string,
  ): Promise<boolean> {
    if (!settings || busy) return false;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const response = await authFetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, revision: settings.revision }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) await load();
        throw new Error(data.error || "保存失败");
      }
      setSettings(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试。");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (await mutate({ action: "save", profile: form }, "save")) {
      setForm(newForm());
      setTestResults({});
      setNotice("接口已保存。可以先测试连接，再设为默认。");
    }
  }

  async function selectDefault(id: string | null) {
    if (await mutate({ action: "select", id }, `select-${id || "coze"}`))
      setNotice("默认接口已更新，后续生成报告将使用此接口。");
  }

  async function remove(id: string) {
    if (await mutate({ action: "delete", id }, `delete-${id}`)) {
      if (form.id === id) setForm(newForm());
      setNotice("接口配置已删除。");
    }
  }

  async function testConnection(id: string) {
    setBusy(`test-${id}`);
    setError("");
    setNotice("");
    setTestResults((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    try {
      const response = await authFetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "测试失败");
      const usage =
        data.totalTokens === null ? "" : ` · ${data.totalTokens} tokens`;
      setTestResults((previous) => ({
        ...previous,
        [id]: {
          ok: true,
          text: `连接成功 · ${(data.elapsedMs / 1000).toFixed(1)} 秒${usage}`,
        },
      }));
    } catch (err) {
      setTestResults((previous) => ({
        ...previous,
        [id]: {
          ok: false,
          text: err instanceof Error ? err.message : "测试失败，请重试。",
        },
      }));
    } finally {
      setBusy("");
    }
  }

  function edit(profile: PublicAIProfile) {
    setForm({
      id: profile.id,
      name: profile.name,
      provider: profile.provider,
      baseUrl: profile.baseUrl,
      model: profile.model,
      apiKey: "",
    });
    setError("");
    setNotice("");
    document
      .getElementById("profile-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeProvider(provider: AIProvider) {
    const preset = AI_PRESETS[provider];
    setForm((previous) => ({
      ...previous,
      provider,
      name: `我的 ${preset.name}`,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: "",
    }));
  }

  if (loading || userLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        正在读取 AI 接口…
      </div>
    );
  if (!user)
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h2 className="mb-4 text-xl font-semibold">登录后管理你的 AI 接口</h2>
        <Button asChild>
          <Link href="/auth">前往登录</Link>
        </Button>
      </div>
    );

  const ready = settings?.storageReady && settings?.encryptionReady;
  const active = settings?.profiles.find(
    (profile) => profile.id === settings.activeProfileId,
  );
  const activeName = !settings
    ? "暂时无法读取"
    : settings.activeProfileId
      ? active?.name || "需要重新选择"
      : "扣子内置模型";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
      <section className="mb-7 flex flex-col justify-between gap-6 rounded-2xl bg-slate-900 p-7 text-white sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-blue-200">
            <Settings2 className="h-4 w-4" />
            模型与连接
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">AI 接口管理</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            连接你自己的 AI 服务，为学习报告选择合适的模型。配置仅用于当前账号。
          </p>
        </div>
        <div className="min-w-48 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
          <p className="mb-2 text-xs text-slate-400">当前默认接口</p>
          <p className="flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {activeName}
          </p>
          <p className="mt-1 max-w-56 truncate text-xs text-slate-400">
            {active?.model ||
              (settings && !settings.activeProfileId ? "豆包 · 扣子提供" : "")}
          </p>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!!busy}
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CircleCheck className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}
      {settings && !ready && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          自定义接口管理尚未完成部署配置。请联系部署管理员启用配置存储和密钥加密后再添加接口。
          {!settings.activeProfileId && "当前仍使用扣子内置模型。"}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-label="已保存的接口" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              我的接口{" "}
              <span className="ml-1 text-sm font-normal text-slate-400">
                {settings?.profiles.length || 0} / 10
              </span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              disabled={!ready || !!busy}
              onClick={() => {
                setForm(newForm());
                document
                  .getElementById("profile-editor")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <Plus className="h-4 w-4" />
              添加接口
            </Button>
          </div>
          {settings && (
            <Card
              className={
                !settings.activeProfileId
                  ? "border-blue-300 bg-blue-50/40 shadow-none"
                  : "shadow-none"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">扣子内置模型</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        沿用当前扣子项目提供的豆包模型
                      </p>
                    </div>
                  </div>
                  {!settings.activeProfileId && (
                    <Badge className="bg-blue-600">默认</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    无需填写 API 密钥
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !settings.storageReady ||
                      !settings.activeProfileId ||
                      !!busy
                    }
                    onClick={() => void selectDefault(null)}
                  >
                    {!settings.activeProfileId ? (
                      <>
                        <Check className="h-4 w-4" />
                        使用中
                      </>
                    ) : (
                      "设为默认"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {settings?.profiles.map((profile) => (
            <Card
              key={profile.id}
              className={
                settings.activeProfileId === profile.id
                  ? "border-blue-300 shadow-none"
                  : "shadow-none"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-all font-semibold">
                        {profile.name}
                      </h3>
                      {settings.activeProfileId === profile.id && (
                        <Badge className="bg-blue-600">默认</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {AI_PRESETS[profile.provider].name}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        aria-label={`删除 ${profile.name}`}
                        title={
                          settings.activeProfileId === profile.id
                            ? "请先切换默认接口"
                            : "删除接口"
                        }
                        variant="ghost"
                        size="icon"
                        disabled={
                          !!busy || settings.activeProfileId === profile.id
                        }
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>删除这个接口？</AlertDialogTitle>
                        <AlertDialogDescription>
                          将删除“{profile.name}
                          ”的连接配置及保存的密钥。再次使用需要重新填写。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>保留</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void remove(profile.id)}
                        >
                          删除配置
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="my-4 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                  <p className="break-all">模型：{profile.model}</p>
                  <p className="break-all">地址：{profile.baseUrl}</p>
                  <p className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    密钥：•••• {profile.keyHint}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!busy || !ready}
                    onClick={() => void testConnection(profile.id)}
                  >
                    {busy === `test-${profile.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    测试连接
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!!busy || !ready}
                    onClick={() => edit(profile)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    className="ml-auto"
                    disabled={
                      !!busy ||
                      !ready ||
                      settings.activeProfileId === profile.id
                    }
                    onClick={() => void selectDefault(profile.id)}
                  >
                    {settings.activeProfileId === profile.id
                      ? "使用中"
                      : "设为默认"}
                  </Button>
                </div>
                {testResults[profile.id] && (
                  <p
                    role="status"
                    className={`mt-3 text-xs leading-5 ${testResults[profile.id].ok ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {testResults[profile.id].text}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {settings?.profiles.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
              <KeyRound className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                还没有添加自己的接口
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                选择平台，填写密钥和模型名称，即可开始使用。
              </p>
            </div>
          )}
          <p className="px-1 text-xs leading-6 text-slate-500">
            测试连接会发起一次简短的模型请求，按对应平台规则计费。生成报告时，所需的学生姓名与学习信息会发送至你选中的服务商。
          </p>
        </section>

        <Card id="profile-editor" className="scroll-mt-24 shadow-none">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {form.id ? "编辑接口" : "添加新接口"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  接口信息可在对应服务商的控制台获取。
                </p>
              </div>
              {form.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!busy}
                  onClick={() => setForm(newForm())}
                >
                  取消编辑
                </Button>
              )}
            </div>
            <form onSubmit={save} className="space-y-5">
              <fieldset
                disabled={!ready || !!busy}
                className="space-y-5 disabled:opacity-60"
              >
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">服务平台</Label>
                  <select
                    id="ai-provider"
                    value={form.provider}
                    onChange={(e) =>
                      changeProvider(e.target.value as AIProvider)
                    }
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  >
                    {Object.entries(AI_PRESETS).map(([id, preset]) => (
                      <option key={id} value={id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-name">接口名称</Label>
                  <Input
                    id="ai-name"
                    required
                    maxLength={60}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="例如：我的 DeepSeek"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-url">接口地址</Label>
                  <Input
                    id="ai-url"
                    type="url"
                    required
                    readOnly={form.provider !== "custom"}
                    maxLength={500}
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm({ ...form, baseUrl: e.target.value })
                    }
                    placeholder="https://你的接口域名/v1"
                  />
                  {form.provider === "custom" && (
                    <p className="text-xs leading-5 text-slate-500">
                      支持 Chat Completions
                      格式。首次使用其他域名时，请联系部署管理员开放。
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-model">模型名称</Label>
                  <Input
                    id="ai-model"
                    required
                    maxLength={160}
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                    placeholder={
                      form.provider === "siliconflow"
                        ? "复制平台提供的完整模型 ID"
                        : "填写你的账号可调用的模型名称"
                    }
                  />
                  {AI_PRESETS[form.provider].docs && (
                    <a
                      href={AI_PRESETS[form.provider].docs}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      查看平台官方文档 ↗
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-key">API 密钥</Label>
                  <Input
                    id="ai-key"
                    type="password"
                    autoComplete="new-password"
                    spellCheck={false}
                    required={!form.id}
                    maxLength={4096}
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm({ ...form, apiKey: e.target.value })
                    }
                    placeholder={
                      form.id
                        ? "留空保留原密钥；更换平台或地址需重新填写"
                        : "粘贴服务商提供的 API Key"
                    }
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    保存后加密存储，仅显示末四位。
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {busy === "save" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {form.id ? "保存修改" : "保存接口"}
                </Button>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
