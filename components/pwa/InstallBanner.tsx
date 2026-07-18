"use client";

import { Download, Share2, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallBanner() {
  const { showAndroid, showIos, install, dismiss } = usePwaInstall();

  if (!showAndroid && !showIos) return null;

  return (
    <div className="fixed bottom-20 inset-x-3 z-50 max-w-sm mx-auto">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-lg flex gap-3 items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            App installeren
          </p>
          {showIos ? (
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Tik op <Share2 className="inline w-3 h-3 mx-0.5" /> en kies{" "}
              <strong>&ldquo;Zet op beginscherm&rdquo;</strong>
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Installeer voor snellere toegang vanaf je telefoon
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex gap-2 items-start">
          {showAndroid && (
            <button
              type="button"
              onClick={install}
              className="text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-white px-3 py-1.5 rounded-lg"
            >
              Installeren
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 text-[var(--muted)] rounded-lg"
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
