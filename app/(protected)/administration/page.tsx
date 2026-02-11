"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  Users,
  Pencil,
  X,
  Check,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHeaderActions } from "@/components/providers/header-actions-provider";

// ── Default card definition ─────────────────────────────────────────
const DEFAULT_CARDS = [
  {
    index: 0,
    name: "Employees",
    url: "/admin/employees",
    icon: Users,
    bgDark: "/images/dark-default.png",
    bgLight: "/images/light-default.png",
  },
];

export default function AdministrationPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { setLeftContent, setRightContent } = useHeaderActions();

  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBgDark, setEditBgDark] = useState("");
  const [editBgLight, setEditBgLight] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const darkFileRef = useRef<HTMLInputElement>(null);
  const lightFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // ── Set header ────────────────────────────────────────────────────
  useEffect(() => {
    setLeftContent(
      <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Administration
      </h1>
    );
    return () => {
      setLeftContent(null);
      setRightContent(null);
    };
  }, [setLeftContent, setRightContent]);

  // ── Fetch saved card-config from API (page = "administration") ────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/card-config?page=administration");
        if (res.ok) {
          const data = await res.json();
          if (data.cards && data.cards.length > 0) {
            // Merge saved config back onto default cards
            setCards(
              DEFAULT_CARDS.map((def) => {
                const saved = data.cards.find(
                  (c: any) => c.index === def.index
                );
                return {
                  ...def,
                  name: saved?.name || def.name,
                  bgDark: saved?.bgDark || def.bgDark,
                  bgLight: saved?.bgLight || def.bgLight,
                };
              })
            );
          }
        }
      } catch {
        // Non-critical — use defaults
      }
    };
    fetchConfig();
  }, []);

  // ── Open edit dialog ──────────────────────────────────────────────
  const openEdit = (card: any) => {
    setEditingCard(card);
    setEditName(card.name);
    setEditBgDark(card.bgDark || "");
    setEditBgLight(card.bgLight || "");
  };

  // ── Handle image upload (converts to base64 data URL) ─────────────
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Save card config ──────────────────────────────────────────────
  const saveCardConfig = async () => {
    if (!editingCard) return;
    setSaving(true);

    try {
      const res = await fetch("/api/card-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "administration",
          cards: [
            {
              index: editingCard.index,
              name: editName,
              bgDark: editBgDark,
              bgLight: editBgLight,
            },
          ],
        }),
      });

      if (res.ok) {
        // Update local state
        setCards((prev) =>
          prev.map((c) =>
            c.index === editingCard.index
              ? { ...c, name: editName, bgDark: editBgDark, bgLight: editBgLight }
              : c
          )
        );
        setEditingCard(null);
        toast.success("Card updated successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update card");
      }
    } catch {
      toast.error("Failed to save card settings");
    } finally {
      setSaving(false);
    }
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* ── Section Header ─────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground font-medium">
          Manage your organisation's core modules and settings.
        </p>
      </div>

      {/* ── Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const bgImage = isDark ? card.bgDark : card.bgLight;
          const Icon = card.icon;

          return (
            <div
              key={card.index}
              className="group relative rounded-[28px] overflow-hidden border border-border/40 dark:border-white/10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] aspect-[4/3]"
              onClick={() => router.push(card.url)}
            >
              {/* Background Image */}
              {bgImage && (
                <Image
                  src={bgImage}
                  alt={card.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Subtle top gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                {/* Icon badge */}
                <div className="absolute top-4 left-4">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:bg-white/20 transition-all duration-300">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Edit button */}
                <button
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(card);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Title area */}
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1 drop-shadow-lg">
                    {card.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-8 rounded-full bg-white/40 group-hover:w-12 group-hover:bg-white/70 transition-all duration-500" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] group-hover:text-white/80 transition-colors">
                      Module
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ Edit Dialog ════════ */}
      <Dialog
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
      >
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-base font-bold tracking-tight">
              Edit Card Settings
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                Display Name
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-10 rounded-xl border-border/50 focus-visible:ring-primary/30"
                placeholder="Card title"
              />
            </div>

            {/* Dark Background */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700" />
                Dark Mode Background
              </Label>
              <div className="flex items-center gap-3">
                {editBgDark && (
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-border/30 shrink-0">
                    <Image
                      src={editBgDark}
                      alt="Dark bg preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                      onClick={() => setEditBgDark("")}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => darkFileRef.current?.click()}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed",
                    "border-border/40 hover:border-primary/50 text-muted-foreground hover:text-foreground",
                    "transition-all cursor-pointer bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {editBgDark ? "Replace" : "Upload Image"}
                  </span>
                </button>
                <input
                  ref={darkFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setEditBgDark)}
                />
              </div>
            </div>

            {/* Light Background */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-100 border border-zinc-300" />
                Light Mode Background
              </Label>
              <div className="flex items-center gap-3">
                {editBgLight && (
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-border/30 shrink-0">
                    <Image
                      src={editBgLight}
                      alt="Light bg preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                      onClick={() => setEditBgLight("")}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => lightFileRef.current?.click()}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed",
                    "border-border/40 hover:border-primary/50 text-muted-foreground hover:text-foreground",
                    "transition-all cursor-pointer bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {editBgLight ? "Replace" : "Upload Image"}
                  </span>
                </button>
                <input
                  ref={lightFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setEditBgLight)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                Preview
              </Label>
              <div className="relative rounded-2xl overflow-hidden border border-border/30 aspect-[4/3] bg-muted/20">
                {(isDark ? editBgDark : editBgLight) ? (
                  <Image
                    src={isDark ? editBgDark : editBgLight}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h4 className="text-base font-black text-white tracking-tight drop-shadow-lg">
                    {editName || "Untitled"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-0.5 w-8 rounded-full bg-white/40" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">
                      Module
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setEditingCard(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl shadow-md shadow-primary/20"
                onClick={saveCardConfig}
                disabled={saving || !editName.trim()}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
