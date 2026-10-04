"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileImage,
  Folder,
  Image as ImageIcon,
  Layers,
  Play,
  Plus,
  Sparkles,
  Type,
  WandSparkles,
} from "lucide-react";

type Mode = "Cover" | "Motion" | "Logo" | "Promo" | "Flyer" | "Enhance";

const modes: { name: Mode; icon: typeof ImageIcon }[] = [
  { name: "Cover", icon: ImageIcon },
  { name: "Motion", icon: Play },
  { name: "Logo", icon: Type },
  { name: "Promo", icon: WandSparkles },
  { name: "Flyer", icon: FileImage },
  { name: "Enhance", icon: Sparkles },
];

const projects = [
  { title: "Midnight Echoes", type: "Cover art", state: "Ready", className: "workspace-art-cover" },
  {
    title: "Butterfly Dreams",
    type: "Motion",
    state: "Creating",
    className: "workspace-art-motion",
  },
  { title: "New release", type: "Promo", state: "Ready", className: "workspace-art-promo" },
];

export function WorkspaceStudio() {
  const [mode, setMode] = useState<Mode>("Cover");
  const [idea, setIdea] = useState(
    "A dreamy, cinematic music cover with purple butterfly effects.",
  );
  const [uploadName, setUploadName] = useState("");
  const [firstFrameName, setFirstFrameName] = useState("");
  const [lastFrameName, setLastFrameName] = useState("");
  const [created, setCreated] = useState(false);

  const modeDescription = useMemo(() => {
    const descriptions: Record<Mode, string> = {
      Cover: "Turn your idea into polished cover art.",
      Motion: "Bring your still visuals to life with guided motion.",
      Logo: "Build a memorable mark for your artist or brand.",
      Promo: "Create a social-ready post for your next release.",
      Flyer: "Design a clear, beautiful flyer in a few steps.",
      Enhance: "Improve sharpness, detail, and image quality.",
    };
    return descriptions[mode];
  }, [mode]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    setUploadName(event.target.files?.[0]?.name || "");
  }

  function frameUpload(setName: (name: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => setName(event.target.files?.[0]?.name || "");
  }

  return (
    <section className="workspace-shell" aria-label="Elite Visual Workspace">
      <aside className="workspace-rail" aria-label="Workspace navigation">
        <button className="workspace-rail-item active" type="button">
          <Sparkles size={18} />
          <span>Create</span>
        </button>
        <button className="workspace-rail-item" type="button">
          <Folder size={18} />
          <span>Projects</span>
        </button>
        <button className="workspace-rail-item" type="button">
          <Layers size={18} />
          <span>Presets</span>
        </button>
        <button className="workspace-rail-item" type="button">
          <ImageIcon size={18} />
          <span>Assets</span>
        </button>
      </aside>

      <div className="workspace-main">
        <div className="workspace-project-bar">
          <div>
            <span className="workspace-kicker">Current project</span>
            <h2>Midnight Echoes</h2>
          </div>
          <div className="workspace-project-actions">
            <button className="workspace-quiet-button" type="button">
              Save
            </button>
            <button className="workspace-quiet-button" type="button">
              Export
            </button>
          </div>
        </div>

        <div className="workspace-canvas" aria-label="Project preview">
          <div className="workspace-cover-preview">
            <div className="workspace-orbit" />
            <div className="workspace-sparkle">✦</div>
            <div className="workspace-cover-copy">
              <span>NEW RELEASE</span>
              <strong>
                Midnight
                <br />
                Echoes
              </strong>
            </div>
          </div>
          <div className="workspace-motion-preview">
            <div className="workspace-frame workspace-frame-one">
              <span>First frame</span>
            </div>
            <ArrowRight className="workspace-frame-arrow" size={22} />
            <div className="workspace-frame workspace-frame-two">
              <span>Last frame</span>
            </div>
            <div className="workspace-player">
              <Play size={13} fill="currentColor" />
              <span />
              <small>0:00 / 0:05</small>
            </div>
          </div>
        </div>

        <div className="workspace-mode-tabs" role="tablist" aria-label="Creation modes">
          {modes.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={mode === name}
              className={mode === name ? "active" : ""}
              onClick={() => {
                setMode(name);
                setCreated(false);
              }}
            >
              <Icon size={16} />
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="workspace-timeline">
          <div className="workspace-timeline-heading">
            <span>
              <Folder size={16} /> Project timeline
            </span>
            <small>Everything from your idea, in one place.</small>
          </div>
          <div className="workspace-output-row">
            {projects.map((project) => (
              <div className="workspace-output" key={project.title}>
                <div className={`workspace-output-thumb ${project.className}`} />
                <div>
                  <strong>{project.title}</strong>
                  <small>{project.type}</small>
                </div>
                <span
                  className={`workspace-status ${project.state === "Ready" ? "ready" : "creating"}`}
                >
                  {project.state === "Ready" ? <Check size={12} /> : <Sparkles size={12} />}
                  {project.state}
                </span>
              </div>
            ))}
            <button className="workspace-new-output" type="button">
              <Plus size={18} /> New output
            </button>
          </div>
        </div>
      </div>

      <form
        className="workspace-create-panel"
        onSubmit={(event) => {
          event.preventDefault();
          setCreated(true);
        }}
      >
        <div className="workspace-panel-heading">
          <WandSparkles size={20} />
          <div>
            <h2>Create with EliteVisuals</h2>
            <p>{modeDescription}</p>
          </div>
        </div>
        {mode === "Motion" ? (
          <div className="workspace-frame-uploads">
            <label className="workspace-upload compact">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={frameUpload(setFirstFrameName)}
              />
              <ImageIcon size={19} />
              <strong>{firstFrameName || "First frame"}</strong>
              <span>{firstFrameName ? "Ready" : "Upload starting image"}</span>
            </label>
            <label className="workspace-upload compact">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={frameUpload(setLastFrameName)}
              />
              <ImageIcon size={19} />
              <strong>{lastFrameName || "Last frame"}</strong>
              <span>{lastFrameName ? "Ready" : "Upload ending image"}</span>
            </label>
          </div>
        ) : (
          <label className="workspace-upload">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} />
            <ImageIcon size={22} />
            <strong>{uploadName || "Upload an image"}</strong>
            <span>
              {uploadName ? "Image ready to use" : "Drop an image here, or click to upload"}
            </span>
          </label>
        )}
        <label className="workspace-field-label" htmlFor="workspace-output">
          What are you making?
        </label>
        <button className="workspace-select" id="workspace-output" type="button">
          <ImageIcon size={16} />
          <span>{mode === "Cover" ? "Cover art" : `${mode} creation`}</span>
          <ChevronDown size={16} />
        </button>
        <label className="workspace-field-label" htmlFor="workspace-idea">
          {mode === "Motion" ? "Describe the motion" : "Describe your idea"}
        </label>
        <textarea
          id="workspace-idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          rows={4}
          placeholder={
            mode === "Motion"
              ? "Tell us how the first image should become the last..."
              : "Tell us what you want to create..."
          }
        />
        <span className="workspace-field-label">Visual style</span>
        <div className="workspace-style-row">
          {[
            ["Cinematic", "workspace-style-cinematic"],
            ["Dreamy", "workspace-style-dreamy"],
            ["Luxury", "workspace-style-luxury"],
          ].map(([label, className], index) => (
            <button
              type="button"
              className={`workspace-style ${className} ${index === 0 ? "selected" : ""}`}
              key={label}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button className="button button-solid workspace-create-button" type="submit">
          {created ? (
            <>
              <Check size={17} /> Added to project
            </>
          ) : (
            <>
              <Sparkles size={17} /> Create <ArrowRight size={17} />
            </>
          )}
        </button>
        <button className="workspace-more-options" type="button">
          More options <ChevronDown size={15} />
        </button>
      </form>
    </section>
  );
}
