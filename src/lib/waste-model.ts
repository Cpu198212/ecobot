import { FINE_BIN, FINES, type BinId, type FineId } from "@/lib/bins";
import { previewPathPrefix } from "@/lib/preview-path-prefix";

export type BinScore = {
  bin: BinId;
  fine: FineId;
  confidence: number;
};

function asTensor(raw: unknown): { data: () => Promise<ArrayLike<number>>; dispose: () => void } | null {
  if (Array.isArray(raw)) return asTensor(raw[0]);
  if (!raw || typeof raw !== "object") return null;
  const maybe = raw as { data?: unknown; dispose?: unknown };
  if (typeof maybe.data === "function" && typeof maybe.dispose === "function") {
    return maybe as { data: () => Promise<ArrayLike<number>>; dispose: () => void };
  }
  return null;
}

let loading: Promise<{ predict: (input: unknown) => unknown }> | null = null;

function modelUrl() {
  const prefix =
    typeof window === "undefined"
      ? ""
      : (previewPathPrefix(window.location.hostname, window.location.pathname) ?? "");
  return `${prefix}/models/wastenet/model.json`;
}

export function preloadModel(onProgress?: (fraction: number) => void) {
  if (!loading) {
    loading = (async () => {
      const tf = await import("@tensorflow/tfjs");
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      const model = await tf.loadGraphModel(modelUrl(), { onProgress });
      const warm = tf.zeros([1, 224, 224, 3]);
      const raw = model.predict(warm);
      const out = asTensor(raw);
      if (out) {
        await out.data();
        out.dispose();
      }
      warm.dispose();
      return model as { predict: (input: unknown) => unknown };
    })().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export async function classifyCanvas(canvas: HTMLCanvasElement): Promise<BinScore[]> {
  const tf = await import("@tensorflow/tfjs");
  const model = await preloadModel();
  const image = tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0);
  let output: { data: () => Promise<ArrayLike<number>>; dispose: () => void } | undefined;
  try {
    const raw = model.predict(image);
    output = asTensor(raw) ?? undefined;
    if (!output) throw new Error("The sorter returned an empty result.");
    const probs = Array.from(await output.data());
    const best = new Map<BinId, BinScore>();
    probs.forEach((confidence, index) => {
      const fine = FINES[index];
      if (!fine) return;
      const bin = FINE_BIN[fine];
      const current = best.get(bin);
      if (!current || confidence > current.confidence) {
        best.set(bin, { bin, fine, confidence });
      }
    });
    return [...best.values()].sort((a, b) => b.confidence - a.confidence);
  } finally {
    image.dispose();
    output?.dispose();
  }
}
