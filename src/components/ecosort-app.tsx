import { useEffect, useRef, useState } from "react";
import {
  Battery,
  Camera,
  Coins,
  Cpu,
  Leaf,
  Newspaper,
  Recycle,
  Shirt,
  Trash2,
  Upload,
  Wine,
  X,
  type LucideIcon,
} from "lucide-react";
import { BINS, FINE_BIN, FINE_LABEL, binById, type BinId } from "@/lib/bins";
import { readHistory, writeHistory, type SortRecord } from "@/lib/history";
import { classifyCanvas, preloadModel, type BinScore } from "@/lib/waste-model";

const ICONS: Record<BinId, LucideIcon> = {
  plastic: Recycle,
  paper: Newspaper,
  glass: Wine,
  metal: Coins,
  organic: Leaf,
  textile: Shirt,
  hazardous: Battery,
  ewaste: Cpu,
  landfill: Trash2,
};

function percent(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that photo."));
    image.src = src;
  });
}

function paint(image: HTMLImageElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  ctx.drawImage(image, 0, 0, size, size);
  return canvas;
}

function formatWhen(at: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

export function EcosortApp() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const run = useRef(0);
  const [history, setHistory] = useState<SortRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scores, setScores] = useState<BinScore[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
    let cancelled = false;
    setModelProgress(0);
    preloadModel((fraction) => {
      if (!cancelled) setModelProgress(fraction);
    })
      .then(() => {
        if (!cancelled) setModelProgress(1);
      })
      .catch(() => {
        if (!cancelled) {
          setModelProgress(null);
          setError("The sorter could not load. Refresh the page and try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = history.find((row) => row.id === activeId) ?? null;
  const chosen = active ? binById(active.bin) : null;
  const Icon = chosen ? ICONS[chosen.id] : null;

  function persist(next: SortRecord[]) {
    const trimmed = next.slice(0, 40);
    setHistory(trimmed);
    writeHistory(trimmed);
  }

  async function sortFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Use a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.type === "image/heic" || file.type === "image/heif") {
      setError("This photo format is not supported. Use JPEG or PNG.");
      return;
    }
    if (file.size > 12_000_000) {
      setError("That photo is too large. Try one under 12 MB.");
      return;
    }

    const token = ++run.current;
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setError(null);
    setBusy(true);
    setScores(null);
    setEditing(false);
    setConfirmClear(false);

    try {
      const image = await loadImage(url);
      if (token !== run.current) return;
      const frame = paint(image, 224);
      const ranked = await classifyCanvas(frame);
      if (token !== run.current) return;
      const top = ranked[0];
      if (!top) throw new Error("No result.");
      const thumb = paint(image, 160).toDataURL("image/jpeg", 0.72);
      const row: SortRecord = {
        id: crypto.randomUUID(),
        at: Date.now(),
        modelFine: top.fine,
        modelConfidence: top.confidence,
        bin: top.bin,
        corrected: false,
        thumb,
      };
      setScores(ranked);
      setActiveId(row.id);
      setPreview(url);
      persist([row, ...readHistory().filter((item) => item.id !== row.id)]);
    } catch (cause) {
      if (token !== run.current) return;
      setError(cause instanceof Error ? cause.message : "Could not sort that photo.");
    } finally {
      if (token === run.current) setBusy(false);
    }
  }

  function onFiles(list: FileList | null) {
    const file = list?.[0];
    if (file) void sortFile(file);
  }

  function chooseBin(bin: BinId) {
    if (!active) return;
    const updated = history.map((row) =>
      row.id === active.id ? { ...row, bin, corrected: bin !== FINE_BIN[row.modelFine] } : row,
    );
    persist(updated);
  }

  function openSaved(row: SortRecord) {
    run.current += 1;
    setBusy(false);
    setError(null);
    setScores(null);
    setEditing(false);
    setActiveId(row.id);
    setPreview(row.thumb);
  }

  function removeRow(id: string) {
    const next = history.filter((row) => row.id !== id);
    if (activeId === id) {
      setActiveId(null);
      setScores(null);
      setPreview(null);
    }
    persist(next);
  }

  function clearAll() {
    persist([]);
    setActiveId(null);
    setScores(null);
    setPreview(null);
    setConfirmClear(false);
  }

  const modelLabel = active ? FINE_LABEL[active.modelFine] : null;
  const confidence = active ? percent(active.modelConfidence) : 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium tracking-wide text-accent">ECOSORT AI</p>
            <h1 className="font-display text-4xl leading-none font-medium tracking-tight sm:text-5xl">
              Waste, sorted.
            </h1>
            <p className="max-w-md text-base leading-normal text-muted">
              Photograph one item. The model names the material and which bin it belongs in.
            </p>
          </div>
          <p className="shrink-0 text-right text-sm text-muted tabular-nums">
            <span className="block font-display text-3xl leading-none font-medium text-ink">
              {history.length}
            </span>
            sorted here
          </p>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <section
            className={
              "flex flex-col gap-4 rounded-card border bg-surface p-5 " +
              (dragOver ? "border-accent" : "border-line")
            }
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              onFiles(event.dataTransfer.files);
            }}
          >
            <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-control bg-paper">
              {preview ? (
                <img src={preview} alt="Waste to sort" className="max-h-80 w-full object-contain" />
              ) : (
                <p className="max-w-xs px-6 text-center text-sm leading-normal text-muted">
                  Drop a photo here, or use the camera. One item, filling the frame, is the most accurate.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface text-sm font-medium text-ink"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="size-4" aria-hidden="true" />
                Take photo
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-accent text-sm font-medium text-accent-ink"
                onClick={() => uploadRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload
              </button>
            </div>
            <input
              ref={cameraRef}
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                onFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <input
              ref={uploadRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              onChange={(event) => {
                onFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="text-sm text-muted" aria-live="polite">
              {busy
                ? "Reading the photo…"
                : modelProgress !== null && modelProgress < 1
                  ? `Preparing the sorter ${percent(modelProgress)}%`
                  : "Runs on this device. Photos are not uploaded."}
            </p>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </section>

          <section className="flex min-h-full flex-col gap-5 rounded-card border border-line bg-surface p-5">
            {chosen && Icon && active && modelLabel ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted">{chosen.bin}</p>
                    <h2 className="font-display text-4xl leading-none font-medium tracking-tight">
                      {chosen.label}
                    </h2>
                  </div>
                  <span className="inline-flex size-12 items-center justify-center rounded-control bg-paper text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {active.corrected ? (
                    <p className="text-sm text-muted">
                      You chose this bin. The model saw {modelLabel} at {confidence}%.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted">Saw {modelLabel}</span>
                        <span className="font-medium tabular-nums">{confidence}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full bg-accent transition-[width] duration-300 ease-out"
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-base leading-normal text-ink">{chosen.tip}</p>
                {scores &&
                scores.some((score) => score.bin !== active.bin && score.confidence >= 0.08) ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted">Not this?</p>
                    <div className="flex flex-wrap gap-2">
                      {scores
                        .filter((score) => score.bin !== active.bin && score.confidence >= 0.08)
                        .slice(0, 3)
                        .map((score) => {
                          const option = binById(score.bin);
                          return (
                            <button
                              key={score.bin}
                              type="button"
                              className="inline-flex h-11 items-center rounded-control border border-line px-3 text-sm font-medium"
                              onClick={() => chooseBin(score.bin)}
                            >
                              {option.label}
                              <span className="ml-2 text-faint tabular-nums">
                                {percent(score.confidence)}%
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-accent"
                    onClick={() => setEditing((open) => !open)}
                  >
                    {editing ? "Hide bins" : "Change bin"}
                  </button>
                  {editing ? (
                    <div className="flex flex-wrap gap-2">
                      {BINS.filter((bin) => bin.id !== active.bin).map((bin) => (
                        <button
                          key={bin.id}
                          type="button"
                          className="inline-flex h-11 items-center rounded-control border border-line px-3 text-sm font-medium"
                          onClick={() => {
                            chooseBin(bin.id);
                            setEditing(false);
                          }}
                        >
                          {bin.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {active.corrected ? (
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-accent"
                    onClick={() => {
                      const original = FINE_BIN[active.modelFine];
                      const updated = history.map((row) =>
                        row.id === active.id ? { ...row, bin: original, corrected: false } : row,
                      );
                      persist(updated);
                    }}
                  >
                    Use the model’s bin
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="font-display text-3xl leading-none font-medium tracking-tight">Nine bins</h2>
                  <p className="text-sm leading-normal text-muted">
                    The result lands here. If it is wrong, you can switch the bin and that choice is saved.
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {BINS.map((bin) => {
                    const BinIcon = ICONS[bin.id];
                    return (
                      <li key={bin.id} className="flex items-center gap-3 rounded-control bg-paper px-3 py-3">
                        <BinIcon className="size-4 shrink-0 text-accent" aria-hidden="true" />
                        <span className="text-sm font-medium">{bin.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-medium tracking-tight">What you have sorted</h2>
            {history.length > 0 ? (
              confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-danger"
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-muted"
                    onClick={() => setConfirmClear(false)}
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-muted"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear
                </button>
              )
            ) : null}
          </div>

          {history.length === 0 ? (
            <p className="rounded-card border border-line bg-surface px-5 py-8 text-sm text-muted">
              Nothing saved yet. Each photo you sort stays in this browser.
            </p>
          ) : (
            <ul className="flex gap-3 overflow-x-auto pb-1">
              {history.map((row) => {
                const bin = binById(row.bin);
                const RowIcon = ICONS[row.bin];
                const selected = row.id === activeId;
                return (
                  <li key={row.id} className="w-40 shrink-0">
                    <div
                      className={
                        "flex flex-col overflow-hidden rounded-card border bg-surface " +
                        (selected ? "border-accent" : "border-line")
                      }
                    >
                      <button type="button" className="text-left" onClick={() => openSaved(row)}>
                        <img src={row.thumb} alt="" className="h-28 w-full object-cover" />
                        <span className="flex items-center gap-2 px-3 pt-3 text-sm font-medium">
                          <RowIcon className="size-4 text-accent" aria-hidden="true" />
                          {bin.label}
                        </span>
                        <span className="block px-3 pt-1 pb-3 text-xs text-faint tabular-nums">
                          {formatWhen(row.at)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center gap-1 border-t border-line text-xs font-medium text-muted"
                        onClick={() => removeRow(row.id)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm leading-normal text-faint">
            City rules differ. Treat this as material guidance, not a local ordinance.
          </p>
        </section>
      </div>
    </main>
  );
}
