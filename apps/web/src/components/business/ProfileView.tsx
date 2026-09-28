"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LIMITS, type User } from "@birlinq/api";
import { useHref, usePlatform } from "@birlinq/platform";
import { useAuth, useProfile, type UseProfile } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IconChevronRight, SectionLabel } from "@/components/dashboard/bits";
import {
  PASSWORD_MIN,
  PHONE_RE,
  normalizePhone,
} from "@/components/auth/helpers";
import {
  SaveRow,
  type SectionFeedback,
} from "@/components/business/sections/shared";

export function ProfileView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <Profile />
    </DashboardShell>
  );
}

/** The four documents, in the order the footer lists them. Routes match the keys. */
const LEGAL_DOCS = ["privacy", "terms", "offer", "consent"] as const;

type ProfileForm = "account" | "password";

/** Tags a write with the form that made it, so only that form shows the outcome. */
type Run = (write: () => Promise<boolean>) => Promise<boolean>;

/**
 * The account page — product-neutral, reached from the profile pill of
 * either product. Two forms over one hook: `useProfile` has a single `busy`
 * and one `actionError`, so the outcome is remembered together with the
 * form that made the last write and the other form stays quiet.
 */
function Profile() {
  const t = useTranslations("dashboard.profile");
  const tc = useTranslations("common");
  const tl = useTranslations("legal");
  const router = useRouter();
  const href = useHref();
  const { isMock } = usePlatform();
  const { logoutAll } = useAuth();
  const profile = useProfile();
  const { user } = profile;
  const [last, setLast] = useState<{
    form: ProfileForm;
    feedback: SectionFeedback;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // The shell renders its children only once the session is loaded, so
  // this is a type guard more than a state — but a session that dies
  // mid-visit passes through here for one render on its way to /login.
  if (!user) return <PageSpinner />;

  const feedbackFor = (form: ProfileForm): SectionFeedback =>
    last?.form === form ? last.feedback : null;

  const runAs =
    (form: ProfileForm): Run =>
    async (write) => {
      setLast(null);
      const ok = await write();
      setLast({ form, feedback: ok ? "saved" : "error" });
      return ok;
    };

  /**
   * Ends every session of this user, this one included — the API revokes
   * the whole refresh chain — so the only place left to go is the login
   * page. The preview tree has no session to lose; it goes home.
   */
  const signOutEverywhere = async () => {
    setLoggingOut(true);
    try {
      await logoutAll();
    } finally {
      router.replace(href(isMock ? "/" : "/login"));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-[13px] text-muted-2">{t("subtitle")}</p>
      </div>

      <Block title={t("sections.account")}>
        <AccountForm
          profile={profile}
          user={user}
          feedback={feedbackFor("account")}
          run={runAs("account")}
        />
      </Block>

      <Block title={t("sections.password")}>
        <PasswordForm
          profile={profile}
          feedback={feedbackFor("password")}
          run={runAs("password")}
        />
      </Block>

      <Block title={t("sections.sessions")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">{t("logoutAllTitle")}</p>
            <p className="mt-0.5 text-[12px] text-muted-2">
              {t("logoutAllHint")}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={loggingOut}
            onClick={() => setConfirmOpen(true)}
          >
            {t("logoutAll")}
          </Button>
        </div>
      </Block>

      <section>
        <SectionLabel>{t("sections.legal")}</SectionLabel>
        <Card className="flex flex-col !p-0">
          <p className="px-5 pt-4 text-[13px] text-muted-2">{t("legalHint")}</p>
          <ul className="mt-3 flex flex-col">
            {LEGAL_DOCS.map((doc) => (
              <li key={doc} className="border-t border-card-border">
                <Link
                  href={`/${doc}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#16233d]"
                >
                  {tl(`docs.${doc}`)}
                  <IconChevronRight className="size-4 shrink-0 text-muted-2" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {confirmOpen && (
        <ConfirmModal
          title={t("logoutAllTitle")}
          text={t("logoutAllHint")}
          confirmLabel={t("logoutAll")}
          cancelLabel={tc("cancel")}
          onConfirm={signOutEverywhere}
          onClose={() => setConfirmOpen(false)}
          loading={loggingOut}
          danger
        />
      )}
    </div>
  );
}

/** Label + card, the shape of the editor's `Section` without its anchor ids. */
function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <Card className="flex flex-col gap-4">{children}</Card>
    </section>
  );
}

interface AccountFields {
  name: string;
  phone: string;
  currentPassword: string;
}

interface AccountErrors {
  name?: string;
  phone?: string;
  currentPassword?: string;
}

function fromUser(user: User): AccountFields {
  return { name: user.name, phone: user.phone ?? "", currentPassword: "" };
}

/**
 * Name and phone. The phone is a login identifier, so changing or removing
 * it asks for the current password and signs the other devices out
 * (D-043); the password field appears only once the number differs from
 * the stored one. The email is shown but cannot be edited here.
 */
function AccountForm({
  profile,
  user,
  feedback,
  run,
}: {
  profile: UseProfile;
  user: User;
  feedback: SectionFeedback;
  run: Run;
}) {
  const t = useTranslations("dashboard.profile");
  const [form, setForm] = useState<AccountFields>(() => fromUser(user));
  const [dirty, setDirty] = useState(false);
  const [local, setLocal] = useState<AccountErrors>({});
  const [saving, setSaving] = useState(false);

  // Follow the session user while untouched — after a save the hook
  // re-reads it, and the form (password field included) resets from it.
  useEffect(() => {
    if (!dirty) setForm(fromUser(user));
  }, [user, dirty]);

  const update = (patch: Partial<AccountFields>) => {
    setForm((cur) => ({ ...cur, ...patch }));
    setDirty(true);
  };

  const storedPhone = user.phone ?? "";
  const nextPhone = normalizePhone(form.phone);
  const phoneChanged = nextPhone !== storedPhone;
  const removingPhone = phoneChanged && nextPhone === "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    const next: AccountErrors = {};
    if (!name) next.name = t("errors.nameRequired");
    else if (name.length < LIMITS.profileNameMin)
      next.name = t("errors.nameMin", { n: LIMITS.profileNameMin });
    if (nextPhone !== "" && !PHONE_RE.test(nextPhone))
      next.phone = t("errors.invalidPhone");
    if (phoneChanged && !form.currentPassword)
      next.currentPassword = t("errors.currentRequired");
    setLocal(next);
    if (next.name || next.phone || next.currentPassword) return;

    setSaving(true);
    const ok = await run(() =>
      profile.updateProfile({
        name,
        ...(phoneChanged
          ? {
              phone: nextPhone === "" ? null : nextPhone,
              current_password: form.currentPassword,
            }
          : {}),
      })
    );
    if (ok) setDirty(false);
    setSaving(false);
  };

  const failed = feedback === "error";
  const serverError = (key: string) =>
    failed ? (profile.fieldErrors[key] ?? null) : null;
  const nameError = local.name ?? serverError("name");
  const phoneError = local.phone ?? serverError("phone");
  const currentError =
    local.currentPassword ??
    (failed && profile.actionError === "wrongCurrent"
      ? t("wrongPassword")
      : serverError("current_password"));
  const formError = !failed
    ? null
    : profile.actionError === "rateLimited"
      ? t("errors.rateLimited")
      : profile.actionError === "save"
        ? t("saveError")
        : profile.actionError === "validation" &&
            !nameError &&
            !phoneError &&
            !currentError
          ? t("errors.generic")
          : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        label={t("fields.name")}
        value={form.name}
        onChange={(e) => update({ name: e.target.value })}
        maxLength={LIMITS.name}
        autoComplete="name"
        error={nameError}
      />
      <Input
        label={t("fields.phone")}
        type="tel"
        inputMode="tel"
        value={form.phone}
        onChange={(e) => update({ phone: e.target.value })}
        autoComplete="tel"
        hint={t("fields.phoneHint")}
        error={phoneError}
      />
      {phoneChanged && (
        <div className="flex flex-col gap-4 rounded-(--radius-btn) border border-warn/30 bg-warn/10 p-4">
          <p className="text-[13px] text-warn">
            {removingPhone ? t("phoneRemoveNote") : t("phoneChangeNote")}
          </p>
          <Input
            label={t("fields.currentPassword")}
            type="password"
            value={form.currentPassword}
            onChange={(e) => update({ currentPassword: e.target.value })}
            maxLength={LIMITS.password}
            autoComplete="current-password"
            hint={t("fields.currentPasswordHint")}
            error={currentError}
          />
        </div>
      )}
      <Input
        label={t("fields.email")}
        type="email"
        value={user.email ?? ""}
        readOnly
        disabled
        autoComplete="email"
        hint={t("fields.emailHint")}
        className="opacity-60"
      />
      <SaveRow
        label={t("save")}
        loading={saving}
        disabled={profile.busy !== null && !saving}
        feedback={dirty ? null : feedback}
        savedMessage={t("saved")}
        errorMessage={formError}
      />
    </form>
  );
}

interface PasswordFields {
  current: string;
  next: string;
  confirm: string;
}

interface PasswordErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

const EMPTY_PASSWORDS: PasswordFields = { current: "", next: "", confirm: "" };

/**
 * Current, new and its repeat. On success the other devices are signed
 * out while this session keeps its tokens, so the form simply clears and
 * says so.
 */
function PasswordForm({
  profile,
  feedback,
  run,
}: {
  profile: UseProfile;
  feedback: SectionFeedback;
  run: Run;
}) {
  const t = useTranslations("dashboard.profile");
  const [form, setForm] = useState<PasswordFields>(EMPTY_PASSWORDS);
  const [dirty, setDirty] = useState(false);
  const [local, setLocal] = useState<PasswordErrors>({});
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<PasswordFields>) => {
    setForm((cur) => ({ ...cur, ...patch }));
    setDirty(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: PasswordErrors = {};
    if (!form.current) next.current = t("errors.currentRequired");
    if (form.next.length < PASSWORD_MIN)
      next.next = t("errors.passwordMin", { n: PASSWORD_MIN });
    if (form.confirm !== form.next)
      next.confirm = t("errors.passwordMismatch");
    setLocal(next);
    if (next.current || next.next || next.confirm) return;

    setSaving(true);
    const ok = await run(() =>
      profile.changePassword({
        current_password: form.current,
        password: form.next,
      })
    );
    if (ok) {
      setForm(EMPTY_PASSWORDS);
      setDirty(false);
    }
    setSaving(false);
  };

  const failed = feedback === "error";
  const serverError = (key: string) =>
    failed ? (profile.fieldErrors[key] ?? null) : null;
  const currentError =
    local.current ??
    (failed && profile.actionError === "wrongCurrent"
      ? t("wrongPassword")
      : serverError("current_password"));
  const nextError = local.next ?? serverError("password");
  const formError = !failed
    ? null
    : profile.actionError === "rateLimited"
      ? t("errors.rateLimited")
      : profile.actionError === "save"
        ? t("errors.generic")
        : profile.actionError === "validation" && !currentError && !nextError
          ? t("errors.generic")
          : null;
  const shown = dirty ? null : feedback;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        label={t("fields.currentPassword")}
        type="password"
        value={form.current}
        onChange={(e) => update({ current: e.target.value })}
        maxLength={LIMITS.password}
        autoComplete="current-password"
        error={currentError}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("fields.newPassword")}
          type="password"
          value={form.next}
          onChange={(e) => update({ next: e.target.value })}
          maxLength={LIMITS.password}
          autoComplete="new-password"
          error={nextError}
        />
        <Input
          label={t("fields.confirmPassword")}
          type="password"
          value={form.confirm}
          onChange={(e) => update({ confirm: e.target.value })}
          maxLength={LIMITS.password}
          autoComplete="new-password"
          error={local.confirm ?? null}
        />
      </div>
      <SaveRow
        label={t("changePassword")}
        loading={saving}
        disabled={profile.busy !== null && !saving}
        feedback={shown}
        savedMessage={t("passwordChanged")}
        errorMessage={formError}
      />
      {shown === "saved" && (
        <p className="-mt-2 text-[12px] text-muted-2">{t("passwordChangedHint")}</p>
      )}
    </form>
  );
}
