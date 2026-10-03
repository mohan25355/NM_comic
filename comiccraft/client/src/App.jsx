import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  generateComic,
  loadComics,
  removeComic,
  saveComic,
} from "./stories.js";

const DEFAULT_FORM = {
  prompt: "A brave fox explores an enchanted forest and discovers a hidden promise.",
  character: "Ari",
  setting: "Forest",
  tone: "Light-hearted",
  style: "Classic Anime",
  link: "",
};

const TONES = [
  { name: "Light-hearted", note: "Bright + warm", color: "tone-yellow", icon: "☀" },
  { name: "Dramatic", note: "Deep + bold", color: "tone-red", icon: "◆" },
  { name: "Poetic", note: "Dreamy + soft", color: "tone-blue", icon: "✦" },
  { name: "Funny", note: "Playful + loud", color: "tone-pink", icon: "✺" },
];

const SETTINGS = ["Forest", "School", "Space", "City", "Floating Islands"];
const STYLES = ["Classic Anime", "Manga Ink", "Retro Shoujo", "Chibi Adventure"];

const SPARKS = [
  {
    title: "The sky library",
    prompt: "A curious student finds a library floating above the clouds.",
    icon: "☁",
  },
  {
    title: "Midnight ramen",
    prompt: "A tired street chef serves one final bowl to a mysterious spirit.",
    icon: "ラ",
  },
  {
    title: "The tiny dragon",
    prompt: "A tiny dragon tries to hide its first flame during a rainy festival.",
    icon: "龍",
  },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeFilename(name) {
  return (name || "comiccraft-story")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function formatDate(timestamp) {
  if (!timestamp) return "Saved just now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function PanelArt({ panel, index, comic }) {
  return (
    <div className={`panel-art art-${(index % 4) + 1}`}>
      <div className="art-grid" />
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✧</span>
      <span className="art-spark spark-three">•</span>
      <div className="art-sun" />
      <div className="art-character" aria-hidden="true">
        <div className="art-hair" />
        <div className="art-face">
          <span className="art-eye eye-left" />
          <span className="art-eye eye-right" />
          <span className="art-mouth" />
        </div>
        <div className="art-collar" />
      </div>
      <div className="art-copy">
        <span>{comic.style}</span>
        <strong>{comic.character}</strong>
        <p>{panel.scene}</p>
      </div>
    </div>
  );
}

function CreateView({ form, updateForm, onGenerate, onSpark, loading, loadingStage }) {
  return (
    <main className="page-wrap create-page">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="eyebrow">ComicCraft Studio</span>
            <span className="local-pill"><span /> Local generation</span>
          </div>
          <h1>
            Turn one bright idea into a <em>classic anime adventure.</em>
          </h1>
          <p className="hero-lede">
            Shape your hero, set the mood, and let the story unfold panel by panel.
            ComicCraft keeps the creative controls simple and the finished page yours.
          </p>
          <div className="hero-note">
            <span className="hero-note-number">01</span>
            <span>Idea to ink in five panels</span>
            <span className="hero-note-line" />
            <span>PNG + PDF ready</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <span className="hero-kanji">物語</span>
          <span className="hero-star star-a">✦</span>
          <span className="hero-star star-b">✧</span>
          <div className="hero-sun" />
          <div className="hero-card hero-card-back">✦ 01 / SKETCH</div>
          <div className="hero-card hero-card-front">
            <span className="hero-card-tag">Your next story</span>
            <strong>Begins here.</strong>
            <div className="hero-card-line" />
            <small>CREATE · EDIT · EXPORT</small>
          </div>
        </div>
      </section>

      <section className="creator-layout">
        <aside className="story-rail">
          <div className="rail-intro">
            <span className="rail-kicker">The story recipe</span>
            <h2>Make it feel like yours.</h2>
            <p>Every choice becomes part of the finished comic.</p>
          </div>
          <ol className="step-list">
            <li className="is-active"><span>01</span><div><strong>Build the idea</strong><small>Prompt + hero</small></div></li>
            <li><span>02</span><div><strong>Choose the feeling</strong><small>Tone + setting</small></div></li>
            <li><span>03</span><div><strong>Pick the look</strong><small>Anime art direction</small></div></li>
            <li><span>04</span><div><strong>Export your issue</strong><small>PNG + PDF</small></div></li>
          </ol>
          <div className="rail-quote">
            <span>“</span>
            <p>A story is a door. Your character is the one who turns the handle.</p>
            <small>— COMICCRAFT FIELD NOTES</small>
          </div>
        </aside>

        <form className="creator-card" onSubmit={(event) => { event.preventDefault(); onGenerate(); }}>
          <div className="card-heading">
            <div className="section-number">01</div>
            <div><span className="card-kicker">Start with a spark</span><h2>Build your story</h2></div>
            <span className="required-note">All fields guide the scene</span>
          </div>

          <label className="field field-prompt">
            <span className="field-label">Story prompt <b>required</b></span>
            <textarea
              value={form.prompt}
              onChange={(event) => updateForm("prompt", event.target.value)}
              placeholder="A brave fox explores an enchanted forest..."
              rows={4}
              maxLength={280}
            />
            <span className="field-counter">{form.prompt.length} / 280</span>
          </label>

          <div className="form-grid two-up">
            <label className="field">
              <span className="field-label">Main character</span>
              <input value={form.character} onChange={(event) => updateForm("character", event.target.value)} placeholder="Ari" maxLength={40} />
              <span className="field-hint">Who carries the story?</span>
            </label>
            <label className="field">
              <span className="field-label">Setting</span>
              <select value={form.setting} onChange={(event) => updateForm("setting", event.target.value)}>
                {SETTINGS.map((setting) => <option key={setting}>{setting}</option>)}
              </select>
              <span className="field-hint">Where does it unfold?</span>
            </label>
          </div>

          <fieldset className="choice-fieldset">
            <legend className="field-label">Story tone</legend>
            <div className="tone-grid">
              {TONES.map((tone) => (
                <button
                  key={tone.name}
                  type="button"
                  className={`tone-choice ${tone.color} ${form.tone === tone.name ? "is-selected" : ""}`}
                  onClick={() => updateForm("tone", tone.name)}
                  aria-pressed={form.tone === tone.name}
                >
                  <span className="tone-icon">{tone.icon}</span>
                  <span><strong>{tone.name}</strong><small>{tone.note}</small></span>
                  <i />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="choice-fieldset style-fieldset">
            <legend className="field-label">Art direction</legend>
            <div className="style-row">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`style-choice ${form.style === style ? "is-selected" : ""}`}
                  onClick={() => updateForm("style", style)}
                  aria-pressed={form.style === style}
                >
                  <span className="style-preview">{style === "Classic Anime" ? "✦" : style === "Manga Ink" ? "〆" : style === "Retro Shoujo" ? "♡" : "☆"}</span>
                  <span>{style}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <details className="advanced-source">
            <summary>Use an optional open-source story feed</summary>
            <label className="field">
              <span className="field-label">Public JSON URL <span>optional</span></span>
              <input type="url" value={form.link} onChange={(event) => updateForm("link", event.target.value)} placeholder="https://example.com/stories.json" />
              <span className="field-hint">The built-in story engine remains available if the feed is unavailable.</span>
            </label>
          </details>

          <div className="form-actions">
            <div className="form-status"><span className="status-dot" /> Five-panel local studio mode</div>
            <button className="primary-button" type="submit" disabled={loading || !form.prompt.trim()}>
              <span>{loading ? "Crafting your issue" : "Generate my comic"}</span>
              <b>{loading ? "..." : "↗"}</b>
            </button>
          </div>
          {loading && <div className="inline-progress"><span className="loader-mark">✦</span><span>{loadingStage}</span><i /></div>}
        </form>
      </section>

      <section className="spark-section">
        <div className="section-title-row"><div><span className="card-kicker">Need a starting point?</span><h2>Story sparks</h2></div><span className="title-rule" /></div>
        <div className="spark-grid">
          {SPARKS.map((spark) => (
            <button key={spark.title} type="button" className="spark-card" onClick={() => onSpark(spark.prompt)}>
              <span className="spark-icon">{spark.icon}</span><span><strong>{spark.title}</strong><small>{spark.prompt}</small></span><b>↗</b>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function PreviewView({ comic, sheet, saved, onBack, onSave, onPng, onPdf, editLine, editNarration }) {
  return (
    <main className="page-wrap preview-page">
      <div className="preview-topline">
        <button className="text-button" type="button" onClick={onBack}>← Back to studio</button>
        <span className="preview-index">02 / INKED PREVIEW</span>
      </div>
      <section className="preview-header">
        <div>
          <div className="eyebrow-row"><span className="eyebrow">Your comic preview</span><span className="issue-pill">Issue 01 · {comic.style}</span></div>
          <h1>{comic.title}</h1>
          <p>{comic.summary}</p>
          <div className="meta-row"><span>♡ {comic.character}</span><span>⌂ {comic.setting}</span><span>✦ {comic.tone}</span><span>▦ {comic.panels.length} panels</span></div>
        </div>
        <div className="preview-actions">
          <button className={`outline-button ${saved ? "is-saved" : ""}`} type="button" onClick={onSave}>{saved ? "Saved ✓" : "Save issue"}</button>
          <button className="outline-button" type="button" onClick={onPng}>PNG</button>
          <button className="primary-button compact" type="button" onClick={onPdf}>Download PDF <b>↓</b></button>
        </div>
      </section>

      <section className="comic-sheet" ref={sheet}>
        <div className="sheet-masthead"><span>COMICCRAFT</span><span>CLASSIC ANIME EDITION</span><span>VOL. 01 · {comic.tone.toUpperCase()}</span></div>
        <div className="sheet-cover">
          <span className="cover-kicker">A new story by {comic.character}</span>
          <h2>{comic.title}</h2>
          <p>{comic.prompt}</p>
          <div className="cover-seal">CC<br /><small>ORIGINAL</small></div>
          <div className="cover-lines" />
        </div>
        <div className="panel-grid">
          {comic.panels.map((panel, index) => (
            <article className={`comic-panel ${index === 0 ? "panel-wide" : ""}`} key={`${panel.scene}-${index}`}>
              <div className="panel-visual"><span className="panel-number">0{index + 1}</span><PanelArt panel={panel} index={index} comic={comic} /></div>
              <div className="panel-content">
                <div className="panel-heading"><span>Panel {index + 1}</span><strong>{panel.title || (index === comic.panels.length - 1 ? "To be continued" : "The next turn")}</strong></div>
                <textarea className="narration-input" value={panel.narration || ""} onChange={(event) => editNarration(index, event.target.value)} aria-label={`Panel ${index + 1} narration`} />
                <p className="panel-caption"><b>Caption</b> {panel.caption || "A moment in the story."}</p>
                <div className="dialogue-box">
                  <span className="speech-tail" />
                  {panel.dialogue.map((line, dialogueIndex) => (
                    <label className="dialogue-row" key={`${line.speaker}-${dialogueIndex}`}>
                      <span>{line.speaker}</span>
                      <input value={line.text} onChange={(event) => editLine(index, dialogueIndex, event.target.value)} aria-label={`${line.speaker} dialogue`} />
                    </label>
                  ))}
                </div>
                <details className="panel-details">
                  <summary>View image prompt reference</summary>
                  <p>{panel.imagePrompt || panel.scene}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
        <div className="sheet-footer"><span>Made in ComicCraft Studio</span><span>✦ ✦ ✦</span><span>Turn the page.</span></div>
      </section>
      <p className="preview-tip"><span>✦</span> Everything in the white panels is editable. Change the narration or dialogue, then save or export your issue.</p>
    </main>
  );
}

function LibraryView({ comics, onOpen, onDelete, onNew }) {
  return (
    <main className="page-wrap library-page">
      <section className="library-header">
        <div><span className="eyebrow">03 / YOUR ARCHIVE</span><h1>Saved issues</h1><p>Your stories, ready whenever the next chapter finds you.</p></div>
        <button className="primary-button compact" type="button" onClick={onNew}>Create a new comic <b>↗</b></button>
      </section>
      {comics.length === 0 ? (
        <div className="empty-library"><div className="empty-mark">✦</div><h2>Your archive is waiting.</h2><p>Save a finished comic from the preview page and it will appear here.</p><button className="outline-button" type="button" onClick={onNew}>Start your first issue</button></div>
      ) : (
        <div className="library-grid">
          {comics.map((item) => (
            <article className="library-card" key={item.id}>
              <div className="library-card-art"><span>0{item.panels?.length || 5}</span><strong>{item.character || "Ari"}</strong><i>✦</i></div>
              <div className="library-card-body"><div className="library-card-top"><span>{item.style || "Classic Anime"}</span><small>{formatDate(item.savedAt)}</small></div><h2>{item.title}</h2><p>{item.summary}</p><div className="library-card-actions"><button className="outline-button compact" type="button" onClick={() => onOpen(item)}>Open issue</button><button className="delete-button" type="button" onClick={() => onDelete(item.id)}>Delete</button></div></div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function ExportSuccessView({ comic, onNew, onPreview }) {
  return (
    <main className="page-wrap export-page">
      <section className="export-success-card">
        <div className="export-burst" aria-hidden="true"><span>✓</span></div>
        <span className="eyebrow">04 / EXPORT COMPLETE</span>
        <h1>Your issue is ready.</h1>
        <p><strong>{comic.title}</strong> has been exported as a PDF with all {comic.panels.length} panels, narration, captions, and dialogue.</p>
        <div className="export-meta"><span>PDF downloaded</span><span>{comic.style}</span><span>{comic.panels.length} panels</span></div>
        <div className="export-actions"><button className="primary-button" type="button" onClick={onNew}>Go create another comic <b>↗</b></button><button className="outline-button" type="button" onClick={onPreview}>Back to preview</button></div>
      </section>
    </main>
  );
}

export default function App() {
  const [view, setView] = useState("create");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [comic, setComic] = useState(null);
  const [comics, setComics] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("Preparing your story");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const sheet = useRef(null);

  useEffect(() => setComics(loadComics()), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const newComic = () => {
    setComic(null);
    setSaved(false);
    setError("");
    setView("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generate = async () => {
    if (!form.prompt.trim()) {
      setError("Add a story prompt so the studio has a starting point.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      setLoadingStage("Sketching a five-panel outline");
      await wait(320);
      setLoadingStage("Writing narration and dialogue");
      await wait(320);
      setLoadingStage("Painting your anime panels");
      const result = await generateComic(form);
      await wait(420);
      setComic(result);
      setSaved(false);
      setView("preview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (generationError) {
      setError(generationError.message || "The studio could not finish this issue.");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    try {
      const savedComic = saveComic(comic);
      setComic(savedComic);
      setComics(loadComics());
      setSaved(true);
      setToast("Issue saved to your archive.");
    } catch (saveError) {
      setError(saveError.message || "This issue could not be saved.");
    }
  };

  const editLine = (panelIndex, dialogueIndex, text) => {
    setComic((current) => ({
      ...current,
      panels: current.panels.map((panel, index) => index !== panelIndex ? panel : {
        ...panel,
        dialogue: panel.dialogue.map((line, lineIndex) => lineIndex === dialogueIndex ? { ...line, text } : line),
      }),
    }));
    setSaved(false);
  };

  const editNarration = (panelIndex, narration) => {
    setComic((current) => ({ ...current, panels: current.panels.map((panel, index) => index === panelIndex ? { ...panel, narration } : panel) }));
    setSaved(false);
  };

  const downloadPng = async () => {
    if (!sheet.current) return;
    try {
      const url = await toPng(sheet.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fffaf1" });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename(comic.title)}.png`;
      link.click();
      setToast("PNG export downloaded.");
    } catch (exportError) {
      setError(exportError.message || "PNG export failed. Try again from the preview.");
    }
  };

  const downloadPdf = async () => {
    if (!sheet.current) return;
    try {
      const element = sheet.current;
      const url = await toPng(element, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fffaf1" });
      const pdf = new jsPDF({ orientation: element.offsetWidth > element.offsetHeight ? "l" : "p", unit: "px", format: [element.offsetWidth, element.offsetHeight] });
      pdf.addImage(url, "PNG", 0, 0, element.offsetWidth, element.offsetHeight);
      pdf.save(`${safeFilename(comic.title)}.pdf`);
      setView("success");
    } catch (exportError) {
      setError(exportError.message || "PDF export failed. Try again from the preview.");
    }
  };

  const openSaved = (item) => {
    setComic(item);
    setForm((current) => ({ ...current, prompt: item.prompt || current.prompt, character: item.character || current.character, setting: item.setting || current.setting, tone: item.tone || current.tone, style: item.style || current.style }));
    setSaved(true);
    setView("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSaved = (id) => {
    removeComic(id);
    setComics(loadComics());
    setToast("Issue removed from your archive.");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={newComic} aria-label="ComicCraft home">
          <span className="brand-mark">✦</span><span><strong>ComicCraft</strong><small>AI story studio</small></span>
        </button>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={`nav-tab ${view !== "library" ? "is-active" : ""}`} type="button" onClick={newComic}>New comic</button>
          <button className={`nav-tab ${view === "library" ? "is-active" : ""}`} type="button" onClick={() => setView("library")}>Archive <span>{comics.length}</span></button>
        </nav>
        <div className="topbar-status"><span className="status-dot" /> Studio online <span className="topbar-divider" /> v1.0</div>
      </header>

      {view === "library" && <LibraryView comics={comics} onOpen={openSaved} onDelete={deleteSaved} onNew={newComic} />}
      {view === "create" && <CreateView form={form} updateForm={updateForm} onGenerate={generate} onSpark={(prompt) => updateForm("prompt", prompt)} loading={loading} loadingStage={loadingStage} />}
      {view === "preview" && comic && <PreviewView comic={comic} sheet={sheet} saved={saved} onBack={() => setView("create")} onSave={save} onPng={downloadPng} onPdf={downloadPdf} editLine={editLine} editNarration={editNarration} />}
      {view === "success" && comic && <ExportSuccessView comic={comic} onNew={newComic} onPreview={() => setView("preview")} />}

      {error && <div className="error-toast" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError("")}>×</button></div>}
      {toast && <div className="success-toast" role="status"><span>✓</span>{toast}</div>}
      {loading && view !== "create" && <div className="generation-overlay"><div className="generation-modal"><span className="loader-mark">✦</span><span className="eyebrow">ComicCraft is working</span><h2>{loadingStage}</h2><div className="modal-progress"><i /><i /><i /></div><p>Building a cohesive five-panel issue around your idea.</p></div></div>}
    </div>
  );
}
