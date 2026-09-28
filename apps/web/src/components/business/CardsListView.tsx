"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Entity } from "@birlinq/api";
import { useHref } from "@birlinq/platform";
import { useCards } from "@birlinq/core";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageSpinner } from "@/components/ui/Spinner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  EmptyState,
  ErrorCard,
  IconCard,
  IconExternal,
  IconPlus,
  IconQr,
} from "@/components/dashboard/bits";
import { IconTrash } from "@/components/card/icons";
import { CardTile, LinkButton } from "@/components/business/bits";

export function CardsListView({ banner }: { banner?: ReactNode }) {
  return (
    <DashboardShell banner={banner}>
      <CardsList />
    </DashboardShell>
  );
}

/** Every card the owner has, newest first, one cursor page at a time. */
function CardsList() {
  const t = useTranslations("cards.list");
  const tc = useTranslations("common");
  const href = useHref();
  const {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    busyId,
    actionError,
    retry,
    loadMore,
    remove,
  } = useCards();
  const [confirm, setConfirm] = useState<Entity | null>(null);

  const confirmRemove = async () => {
    if (!confirm) return;
    const ok = await remove(confirm.id);
    if (ok) setConfirm(null);
    // On failure the row is already back (optimistic rollback) and the
    // modal stays open with the reason.
  };

  const removeError =
    actionError === "blocked"
      ? t("deleteBlocked")
      : actionError === "remove"
        ? t("deleteError")
        : null;

  const createButton = (
    <LinkButton variant="accent" href={href("/dashboard/cards/new")}>
      <IconPlus className="size-4" />
      {t("create")}
    </LinkButton>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-[13px] text-muted-2">{t("subtitle")}</p>
        </div>
        {!loading && !error && items.length > 0 && createButton}
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorCard
          message={tc("error")}
          retryLabel={tc("retry")}
          onRetry={retry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconCard className="size-6" />}
          title={t("empty")}
          hint={t("emptyHint")}
          cta={
            <LinkButton variant="accent" href={href("/dashboard/cards/new")}>
              {t("emptyCta")}
            </LinkButton>
          }
        />
      ) : (
        <>
          {actionError === "loadMore" && (
            <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
              {t("loadMoreError")}
            </p>
          )}
          {!confirm && removeError && (
            <p className="rounded-(--radius-btn) border border-danger/30 bg-danger/10 px-4 py-2.5 text-[13px] text-danger">
              {removeError}
            </p>
          )}

          {/* grid-cols-1 / min-w-0: see QrListView — a `truncate` line's
              min-content is the whole string. */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((entity) => (
              <li key={entity.id} className="flex min-w-0">
                <CardTile
                  entity={entity}
                  href={href(`/dashboard/cards/${entity.id}`)}
                >
                  {entity.alias && (
                    <LinkButton
                      href={href(`/p/${entity.alias}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternal />
                      {t("actions.open")}
                    </LinkButton>
                  )}
                  <LinkButton href={href(`/dashboard/cards/${entity.id}#qr`)}>
                    <IconQr className="size-4" />
                    {t("actions.qr")}
                  </LinkButton>
                  <LinkButton href={href(`/dashboard/cards/${entity.id}`)}>
                    {t("actions.edit")}
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-danger hover:text-danger"
                    disabled={busyId !== null}
                    onClick={() => setConfirm(entity)}
                  >
                    <IconTrash className="size-4" />
                    {t("actions.delete")}
                  </Button>
                </CardTile>
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button
              variant="secondary"
              onClick={loadMore}
              loading={loadingMore}
              className="mx-auto w-full sm:w-auto sm:min-w-56"
            >
              {t("loadMore")}
            </Button>
          )}
        </>
      )}

      {confirm && (
        <ConfirmModal
          title={t("deleteTitle")}
          text={t("deleteText")}
          confirmLabel={t("deleteConfirm")}
          cancelLabel={tc("cancel")}
          onConfirm={confirmRemove}
          onClose={() => setConfirm(null)}
          loading={busyId === confirm.id}
          danger
          error={removeError}
        />
      )}
    </div>
  );
}
