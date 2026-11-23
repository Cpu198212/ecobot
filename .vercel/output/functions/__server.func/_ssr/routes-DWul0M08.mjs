import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Trash2, c as Newspaper, d as Coins, f as Camera, l as Leaf, n as Wine, o as Shirt, p as Battery, r as Upload, s as Recycle, t as X, u as Cpu } from "../_libs/lucide-react.mjs";
import { n as previewPathPrefix } from "./router-CbdjuSgX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DWul0M08.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BINS = [
	{
		id: "plastic",
		label: "Plastic",
		bin: "Plastics recycling",
		tip: "Empty it and give it a quick rinse. Leave the cap on if your city takes it."
	},
	{
		id: "paper",
		label: "Paper & cardboard",
		bin: "Paper recycling",
		tip: "Keep it dry and flatten boxes. Greasy food cardboard goes in general waste."
	},
	{
		id: "glass",
		label: "Glass",
		bin: "Glass recycling",
		tip: "Empty and rinse. Take the cap or cork off. No ceramics, mirrors, or light bulbs."
	},
	{
		id: "metal",
		label: "Metal",
		bin: "Metal recycling",
		tip: "Rinse cans. Clean foil can go in if you ball it up."
	},
	{
		id: "organic",
		label: "Organic",
		bin: "Compost",
		tip: "Food scraps and yard waste. Skip ordinary plastic bags."
	},
	{
		id: "textile",
		label: "Textile",
		bin: "Donation or textile recycling",
		tip: "Clean clothes and shoes can be donated. Worn-out fabric goes to a textile point."
	},
	{
		id: "hazardous",
		label: "Hazardous",
		bin: "Special collection",
		tip: "Batteries, paint, and chemicals need a drop-off. Never the trash or the recycling."
	},
	{
		id: "ewaste",
		label: "E-waste",
		bin: "Electronics drop-off",
		tip: "Phones, cables, and devices. Do not put them in a household bin."
	},
	{
		id: "landfill",
		label: "General waste",
		bin: "Residual bin",
		tip: "Mixed or contaminated items that cannot be recycled cleanly."
	}
];
var FINES = [
	"battery",
	"biological",
	"brown-glass",
	"cardboard",
	"clothes",
	"green-glass",
	"metal",
	"paper",
	"plastic",
	"shoes",
	"trash",
	"white-glass"
];
var FINE_LABEL = {
	battery: "Battery",
	biological: "Food waste",
	"brown-glass": "Brown glass",
	cardboard: "Cardboard",
	clothes: "Clothes",
	"green-glass": "Green glass",
	metal: "Metal",
	paper: "Paper",
	plastic: "Plastic",
	shoes: "Shoes",
	trash: "Residual trash",
	"white-glass": "Clear glass"
};
var FINE_BIN = {
	battery: "hazardous",
	biological: "organic",
	"brown-glass": "glass",
	cardboard: "paper",
	clothes: "textile",
	"green-glass": "glass",
	metal: "metal",
	paper: "paper",
	plastic: "plastic",
	shoes: "textile",
	trash: "landfill",
	"white-glass": "glass"
};
function binById(id) {
	const found = BINS.find((bin) => bin.id === id);
	if (!found) throw new Error(`Unknown bin ${id}`);
	return found;
}
function isBinId(value) {
	return typeof value === "string" && BINS.some((bin) => bin.id === value);
}
function isFineId(value) {
	return typeof value === "string" && FINES.includes(value);
}
var KEY = "ecosort.history.v1";
var MAX = 40;
function isRecord(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return typeof row.id === "string" && typeof row.at === "number" && isFineId(row.modelFine) && typeof row.modelConfidence === "number" && isBinId(row.bin) && typeof row.corrected === "boolean" && typeof row.thumb === "string";
}
function readHistory() {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isRecord).slice(0, MAX);
	} catch {
		return [];
	}
}
function writeHistory(rows) {
	localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
}
function asTensor(raw) {
	if (Array.isArray(raw)) return asTensor(raw[0]);
	if (!raw || typeof raw !== "object") return null;
	const maybe = raw;
	if (typeof maybe.data === "function" && typeof maybe.dispose === "function") return maybe;
	return null;
}
var loading = null;
function modelUrl() {
	return `${typeof window === "undefined" ? "" : previewPathPrefix(window.location.hostname, window.location.pathname) ?? ""}/models/wastenet/model.json`;
}
function preloadModel(onProgress) {
	if (!loading) loading = (async () => {
		const tf = await import("../_libs/@tensorflow/tfjs.mjs").then((n) => n.t);
		try {
			await tf.setBackend("webgl");
		} catch {
			await tf.setBackend("cpu");
		}
		await tf.ready();
		const model = await tf.loadGraphModel(modelUrl(), { onProgress });
		const warm = tf.zeros([
			1,
			224,
			224,
			3
		]);
		const out = asTensor(model.predict(warm));
		if (out) {
			await out.data();
			out.dispose();
		}
		warm.dispose();
		return model;
	})().catch((error) => {
		loading = null;
		throw error;
	});
	return loading;
}
async function classifyCanvas(canvas) {
	const tf = await import("../_libs/@tensorflow/tfjs.mjs").then((n) => n.t);
	const model = await preloadModel();
	const image = tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0);
	let output;
	try {
		output = asTensor(model.predict(image)) ?? void 0;
		if (!output) throw new Error("The sorter returned an empty result.");
		const probs = Array.from(await output.data());
		const best = /* @__PURE__ */ new Map();
		probs.forEach((confidence, index) => {
			const fine = FINES[index];
			if (!fine) return;
			const bin = FINE_BIN[fine];
			const current = best.get(bin);
			if (!current || confidence > current.confidence) best.set(bin, {
				bin,
				fine,
				confidence
			});
		});
		return [...best.values()].sort((a, b) => b.confidence - a.confidence);
	} finally {
		image.dispose();
		output?.dispose();
	}
}
var ICONS = {
	plastic: Recycle,
	paper: Newspaper,
	glass: Wine,
	metal: Coins,
	organic: Leaf,
	textile: Shirt,
	hazardous: Battery,
	ewaste: Cpu,
	landfill: Trash2
};
function percent(value) {
	return Math.round(Math.max(0, Math.min(1, value)) * 100);
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(/* @__PURE__ */ new Error("Could not read that photo."));
		image.src = src;
	});
}
function paint(image, size) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not read that photo.");
	ctx.drawImage(image, 0, 0, size, size);
	return canvas;
}
function formatWhen(at) {
	return new Intl.DateTimeFormat(void 0, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}).format(at);
}
function EcosortApp() {
	const cameraRef = (0, import_react.useRef)(null);
	const uploadRef = (0, import_react.useRef)(null);
	const run = (0, import_react.useRef)(0);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [scores, setScores] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [modelProgress, setModelProgress] = (0, import_react.useState)(null);
	const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setHistory(readHistory());
		let cancelled = false;
		setModelProgress(0);
		preloadModel((fraction) => {
			if (!cancelled) setModelProgress(fraction);
		}).then(() => {
			if (!cancelled) setModelProgress(1);
		}).catch(() => {
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
	function persist(next) {
		const trimmed = next.slice(0, 40);
		setHistory(trimmed);
		writeHistory(trimmed);
	}
	async function sortFile(file) {
		if (!file.type.startsWith("image/")) {
			setError("Use a JPEG, PNG, or WebP photo.");
			return;
		}
		if (file.type === "image/heic" || file.type === "image/heif") {
			setError("This photo format is not supported. Use JPEG or PNG.");
			return;
		}
		if (file.size > 12e6) {
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
			const ranked = await classifyCanvas(paint(image, 224));
			if (token !== run.current) return;
			const top = ranked[0];
			if (!top) throw new Error("No result.");
			const thumb = paint(image, 160).toDataURL("image/jpeg", .72);
			const row = {
				id: crypto.randomUUID(),
				at: Date.now(),
				modelFine: top.fine,
				modelConfidence: top.confidence,
				bin: top.bin,
				corrected: false,
				thumb
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
	function onFiles(list) {
		const file = list?.[0];
		if (file) sortFile(file);
	}
	function chooseBin(bin) {
		if (!active) return;
		persist(history.map((row) => row.id === active.id ? {
			...row,
			bin,
			corrected: bin !== FINE_BIN[row.modelFine]
		} : row));
	}
	function openSaved(row) {
		run.current += 1;
		setBusy(false);
		setError(null);
		setScores(null);
		setEditing(false);
		setActiveId(row.id);
		setPreview(row.thumb);
	}
	function removeRow(id) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-paper text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium tracking-wide text-accent",
								children: "ECOSORT AI"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl leading-none font-medium tracking-tight sm:text-5xl",
								children: "Waste, sorted."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-md text-base leading-normal text-muted",
								children: "Photograph one item. The model names the material and which bin it belongs in."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "shrink-0 text-right text-sm text-muted tabular-nums",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-3xl leading-none font-medium text-ink",
							children: history.length
						}), "sorted here"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid items-start gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-4 rounded-card border bg-surface p-5 " + (dragOver ? "border-accent" : "border-line"),
						onDragOver: (event) => {
							event.preventDefault();
							setDragOver(true);
						},
						onDragLeave: () => setDragOver(false),
						onDrop: (event) => {
							event.preventDefault();
							setDragOver(false);
							onFiles(event.dataTransfer.files);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-h-64 items-center justify-center overflow-hidden rounded-control bg-paper",
								children: preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: preview,
									alt: "Waste to sort",
									className: "max-h-80 w-full object-contain"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-xs px-6 text-center text-sm leading-normal text-muted",
									children: "Drop a photo here, or use the camera. One item, filling the frame, is the most accurate."
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface text-sm font-medium text-ink",
									onClick: () => cameraRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Take photo"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-12 items-center justify-center gap-2 rounded-control bg-accent text-sm font-medium text-accent-ink",
									onClick: () => uploadRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Upload"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: cameraRef,
								className: "sr-only",
								type: "file",
								accept: "image/*",
								capture: "environment",
								onChange: (event) => {
									onFiles(event.target.files);
									event.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: uploadRef,
								className: "sr-only",
								type: "file",
								accept: "image/jpeg,image/png,image/webp,image/*",
								onChange: (event) => {
									onFiles(event.target.files);
									event.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								"aria-live": "polite",
								children: busy ? "Reading the photo…" : modelProgress !== null && modelProgress < 1 ? `Preparing the sorter ${percent(modelProgress)}%` : "Runs on this device. Photos are not uploaded."
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-danger",
								children: error
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "flex min-h-full flex-col gap-5 rounded-card border border-line bg-surface p-5",
						children: chosen && Icon && active && modelLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-muted",
										children: chosen.bin
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-4xl leading-none font-medium tracking-tight",
										children: chosen.label
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex size-12 items-center justify-center rounded-control bg-paper text-accent",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "size-5",
										"aria-hidden": "true"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col gap-2",
								children: active.corrected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										"You chose this bin. The model saw ",
										modelLabel,
										" at ",
										confidence,
										"%."
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline justify-between gap-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted",
										children: ["Saw ", modelLabel]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium tabular-nums",
										children: [confidence, "%"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-1.5 overflow-hidden rounded-full bg-line",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-accent transition-[width] duration-300 ease-out",
										style: { width: `${confidence}%` }
									})
								})] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base leading-normal text-ink",
								children: chosen.tip
							}),
							scores && scores.some((score) => score.bin !== active.bin && score.confidence >= .08) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Not this?"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: scores.filter((score) => score.bin !== active.bin && score.confidence >= .08).slice(0, 3).map((score) => {
										const option = binById(score.bin);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "inline-flex h-11 items-center rounded-control border border-line px-3 text-sm font-medium",
											onClick: () => chooseBin(score.bin),
											children: [option.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "ml-2 text-faint tabular-nums",
												children: [percent(score.confidence), "%"]
											})]
										}, score.bin);
									})
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "self-start text-sm font-medium text-accent",
									onClick: () => setEditing((open) => !open),
									children: editing ? "Hide bins" : "Change bin"
								}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: BINS.filter((bin) => bin.id !== active.bin).map((bin) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "inline-flex h-11 items-center rounded-control border border-line px-3 text-sm font-medium",
										onClick: () => {
											chooseBin(bin.id);
											setEditing(false);
										},
										children: bin.label
									}, bin.id))
								}) : null]
							}),
							active.corrected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "self-start text-sm font-medium text-accent",
								onClick: () => {
									const original = FINE_BIN[active.modelFine];
									persist(history.map((row) => row.id === active.id ? {
										...row,
										bin: original,
										corrected: false
									} : row));
								},
								children: "Use the model’s bin"
							}) : null
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl leading-none font-medium tracking-tight",
								children: "Nine bins"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-normal text-muted",
								children: "The result lands here. If it is wrong, you can switch the bin and that choice is saved."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
							children: BINS.map((bin) => {
								const BinIcon = ICONS[bin.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-3 rounded-control bg-paper px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BinIcon, {
										className: "size-4 shrink-0 text-accent",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: bin.label
									})]
								}, bin.id);
							})
						})] })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl font-medium tracking-tight",
								children: "What you have sorted"
							}), history.length > 0 ? confirmClear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-danger",
									onClick: clearAll,
									children: "Clear all"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-muted",
									onClick: () => setConfirmClear(false),
									children: "Keep"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium text-muted",
								onClick: () => setConfirmClear(true),
								children: "Clear"
							}) : null]
						}),
						history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-card border border-line bg-surface px-5 py-8 text-sm text-muted",
							children: "Nothing saved yet. Each photo you sort stays in this browser."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "flex gap-3 overflow-x-auto pb-1",
							children: history.map((row) => {
								const bin = binById(row.bin);
								const RowIcon = ICONS[row.bin];
								const selected = row.id === activeId;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "w-40 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col overflow-hidden rounded-card border bg-surface " + (selected ? "border-accent" : "border-line"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "text-left",
											onClick: () => openSaved(row),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: row.thumb,
													alt: "",
													className: "h-28 w-full object-cover"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-2 px-3 pt-3 text-sm font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowIcon, {
														className: "size-4 text-accent",
														"aria-hidden": "true"
													}), bin.label]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block px-3 pt-1 pb-3 text-xs text-faint tabular-nums",
													children: formatWhen(row.at)
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "inline-flex h-11 items-center justify-center gap-1 border-t border-line text-xs font-medium text-muted",
											onClick: () => removeRow(row.id),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
												className: "size-3.5",
												"aria-hidden": "true"
											}), "Remove"]
										})]
									})
								}, row.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-normal text-faint",
							children: "City rules differ. Treat this as material guidance, not a local ordinance."
						})
					]
				})
			]
		})
	});
}
var SplitComponent = EcosortApp;
//#endregion
export { SplitComponent as component };
