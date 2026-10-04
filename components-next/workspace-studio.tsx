"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  ImageIcon,
  Play,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
type Mode = "Cover" | "Motion" | "Logo" | "Promo" | "Flyer" | "Enhance";
type Preset = { title: string; description: string; imageUrl: string | null };
type Asset = { name: string; url: string };
const tools: { mode: Mode; label: string; hint: string; fields: string[] }[] = [
  {
    mode: "Cover",
    label: "Cover art",
    hint: "Your next release starts here.",
    fields: ["Artist name", "Release title"],
  },
  {
    mode: "Motion",
    label: "Transitions",
    hint: "Connect two frames with a visual transition.",
    fields: [],
  },
  {
    mode: "Logo",
    label: "Logo",
    hint: "Give your name a memorable identity.",
    fields: ["Brand name", "Tagline (optional)"],
  },
  {
    mode: "Promo",
    label: "Promo graphic",
    hint: "Make your announcement stand out.",
    fields: ["Headline", "Call to action"],
  },
  {
    mode: "Flyer",
    label: "Flyer",
    hint: "All the details. One striking design.",
    fields: ["Event name", "Date and time", "Location"],
  },
  {
    mode: "Enhance",
    label: "Enhance image",
    hint: "Give your image a cleaner finish.",
    fields: [],
  },
];
export function WorkspaceStudio({ motionPresets }: { motionPresets: Preset[] }) {
  const [mode, setMode] = useState<Mode>("Cover");
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [preset, setPreset] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  const tool = tools.find((item) => item.mode === mode)!;
  const slots =
    mode === "Motion"
      ? ["First frame", "Last frame"]
      : [mode === "Enhance" ? "Original image" : "Reference image"];
  const field = (name: string) => `${mode}:${name}`;
  function upload(key: string, file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    ) {
      setMessage("Choose a JPG, PNG, or WebP image smaller than 15 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setAssets((current) => ({ ...current, [key]: { name: file.name, url } }));
    setMessage("");
  }
  function save() {
    try {
      localStorage.setItem(
        "elitevisuals-workspace-draft",
        JSON.stringify({ mode, values, preset }),
      );
      setMessage("Brief saved on this device. Uploaded images stay in this session.");
    } catch {
      setMessage("This browser could not save the brief. You can download it instead.");
    }
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            tool: tool.label,
            settings: Object.fromEntries(
              Object.entries(values).filter(([key]) => key.startsWith(`${mode}:`)),
            ),
            preset: mode === "Motion" ? preset : undefined,
            images: slots.map((slot) => assets[field(slot)]?.name).filter(Boolean),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "elitevisuals-creative-brief.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem("elitevisuals-workspace-draft") || "null");
      if (!saved || !tools.some((item) => item.mode === saved.mode)) {
        setMessage("No saved brief on this device yet.");
        return;
      }
      setMode(saved.mode);
      setValues(saved.values || {});
      setPreset(saved.preset || "");
      setMessage("Saved brief restored. Add your images again to continue.");
    } catch {
      setMessage("The saved brief could not be restored.");
    }
  }
  return (
    <section className="ev-studio" aria-label="Elite Visual Workspace">
      <header className="ev-studio-top">
        <div>
          <span className="ev-eyebrow">ELITE VISUAL WORKSPACE</span>
          <h1>Your ideas. Ready to create.</h1>
        </div>
        <div className="ev-draft-actions">
          <button type="button" onClick={restore}>
            Open saved brief
          </button>
          <button
            type="button"
            onClick={() => {
              setAssets({});
              setValues({});
              setPreset("");
              setMessage("");
            }}
          >
            <Plus size={16} /> New brief
          </button>
        </div>
      </header>
      <nav className="ev-tools" aria-label="Creative tools">
        {tools.map((item) => (
          <button
            type="button"
            key={item.mode}
            aria-pressed={mode === item.mode}
            className={mode === item.mode ? "selected" : ""}
            onClick={() => {
              setMode(item.mode);
              setMessage("");
            }}
          >
            {item.mode === "Motion" ? (
              <Play size={16} />
            ) : item.mode === "Enhance" ? (
              <Sparkles size={16} />
            ) : (
              <ImageIcon size={16} />
            )}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="ev-studio-body">
        <form
          className="ev-controls"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="ev-tool-heading">
            <h2>{tool.label}</h2>
            <p>{tool.hint}</p>
          </div>
          <fieldset>
            <legend>
              <span>1</span> {mode === "Motion" ? "Add your two frames" : "Add your image"}
            </legend>
            <p className="ev-help">
              {mode === "Motion"
                ? "Choose where the transition starts and ends."
                : mode === "Enhance"
                  ? "Upload the photo you want to improve."
                  : "Add a photo or reference. Optional for logos."}
            </p>
            <div className="ev-upload-row">
              {slots.map((slot) => (
                <label
                  className="ev-upload"
                  key={field(slot)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    upload(field(slot), event.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label={`Upload ${slot.toLowerCase()}`}
                    onChange={(event) => upload(field(slot), event.target.files?.[0])}
                  />
                  <Upload size={20} />
                  <strong>{slot}</strong>
                  <small>{assets[field(slot)]?.name || "Choose or drop image"}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>2</span> {mode === "Motion" ? "Choose your transition" : "Make it yours"}
            </legend>
            {mode === "Motion" ? (
              <>
                <input
                  aria-label="Search transitions"
                  placeholder={`Search ${motionPresets.length} transitions…`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="ev-presets">
                  {motionPresets
                    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
                    .map((item) => (
                      <button
                        type="button"
                        key={item.title}
                        aria-pressed={preset === item.title}
                        className={preset === item.title ? "selected" : ""}
                        onClick={() => setPreset(item.title)}
                      >
                        {item.imageUrl && (
                          <span style={{ backgroundImage: `url(${item.imageUrl})` }} />
                        )}
                        <strong>{item.title}</strong>
                        {preset === item.title && <Check size={14} />}
                      </button>
                    ))}
                  {!motionPresets.some((item) =>
                    item.title.toLowerCase().includes(search.toLowerCase()),
                  ) && <p className="ev-help">No transitions match. Try another search.</p>}
                </div>
                <label>
                  Length
                  <select
                    value={values[field("Length")] || "5 seconds"}
                    onChange={(event) =>
                      setValues({ ...values, [field("Length")]: event.target.value })
                    }
                  >
                    <option>5 seconds</option>
                    <option>10 seconds</option>
                  </select>
                </label>
              </>
            ) : (
              tool.fields.map((name) => (
                <label key={name}>
                  {name}
                  <input
                    value={values[field(name)] || ""}
                    onChange={(event) =>
                      setValues({ ...values, [field(name)]: event.target.value })
                    }
                    placeholder={name}
                  />
                </label>
              ))
            )}
            {mode !== "Motion" && (
              <label>
                {mode === "Enhance" ? "What should we improve?" : "Where will you use it?"}
                <select
                  value={values[field("Format")] || ""}
                  onChange={(event) =>
                    setValues({ ...values, [field("Format")]: event.target.value })
                  }
                >
                  <option value="">Choose an option</option>
                  {(mode === "Enhance"
                    ? ["Sharper details", "Larger image", "Cleaner photo"]
                    : mode === "Cover"
                      ? ["Single cover", "Album cover", "EP cover"]
                      : mode === "Logo"
                        ? ["Artist identity", "Business identity", "Personal brand"]
                        : ["Instagram post", "Instagram Story", "Printed flyer"]
                  ).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            )}
          </fieldset>
          {mode !== "Enhance" && (
            <fieldset>
              <legend>
                <span>3</span> Add your direction
              </legend>
              <label>
                {mode === "Motion"
                  ? "How should one frame become the next?"
                  : "Tell us about your idea"}
                <textarea
                  rows={3}
                  value={values[field("Direction")] || ""}
                  onChange={(event) =>
                    setValues({ ...values, [field("Direction")]: event.target.value })
                  }
                  placeholder={
                    mode === "Motion"
                      ? "Example: dissolve into glowing particles, then reveal the last frame."
                      : "Describe the mood, colors, and anything you want included."
                  }
                />
              </label>
            </fieldset>
          )}
          <button className="ev-primary" type="submit">
            Save creative brief <ArrowRight size={17} />
          </button>
          <p className="ev-help ev-service-note">
            Generation is being connected. You can prepare and save your brief now.
          </p>
          {message && (
            <p className="ev-message" role="status">
              {message}
            </p>
          )}
        </form>
        <div className="ev-preview-area">
          <div className="ev-preview-heading">
            <div>
              <h2>{mode === "Motion" ? "Your transition frames" : "Your image preview"}</h2>
              <p>Your uploaded content appears here.</p>
            </div>
            <span>Preview</span>
          </div>
          <div className={`ev-preview ${mode === "Motion" ? "motion" : ""}`}>
            {slots.map((slot) => (
              <div className="ev-preview-slot" key={field(slot)}>
                {assets[field(slot)] ? (
                  <>
                    <img src={assets[field(slot)].url} alt={slot} />
                    <button
                      type="button"
                      aria-label={`Remove ${slot}`}
                      onClick={() =>
                        setAssets((current) => {
                          const next = { ...current };
                          delete next[field(slot)];
                          return next;
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="ev-preview-empty">
                    <ImageIcon size={32} strokeWidth={1} />
                    <strong>
                      {mode === "Motion" ? slot : "A little space for your next big idea."}
                    </strong>
                    <p>
                      {mode === "Motion"
                        ? "Add this frame in step 1."
                        : "Upload an image to see it here."}
                    </p>
                  </div>
                )}
                {mode === "Motion" && <span className="ev-frame-label">{slot}</span>}
              </div>
            ))}
          </div>
          <div className="ev-preview-footer">
            <span>{mode === "Motion" ? preset || "Choose a transition to begin" : tool.hint}</span>
            <button type="button" onClick={download}>
              <Download size={15} /> Download brief
            </button>
          </div>
          <div className="ev-tip">
            <Sparkles size={18} />
            <p>
              <strong>A little guidance goes a long way.</strong>{" "}
              {mode === "Motion"
                ? "Choose a preset, then describe only the details you want to change."
                : "Simple descriptions work best. Tell us the feeling and the details that matter."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
