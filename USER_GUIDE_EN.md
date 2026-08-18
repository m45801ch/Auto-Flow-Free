# Auto Flow Free User Guide (English)

**Auto Flow Free** (formerly Flow Automation) is a Chrome extension that automates batch video and image generation on Google Flow (labs.google/fx/tools/flow) and automatically downloads the results. You only need to prepare a list of prompts — the extension handles creating projects, filling in content, submitting jobs, tracking progress, and downloading deliverables, all without manual interaction.

---

## Key Features

| Feature | Description |
| --- | --- |
| Queue Support | Add multiple prompts at once; they are processed automatically one by one. |
| Text-to-Video | Batch-generate videos from text descriptions; supports importing .txt, .xlsx, and .csv files. |
| Frame-to-Video | Generate videos starting from static images; supports using the Start frame or both Start and End frames per prompt. |
| Components-to-Video | Animate characters or UI components; supports auto-matching character images by filename. |
| Text-to-Image | Batch-generate images from text descriptions. |
| Image-to-Image | Transform and enhance images with AI using text prompts. |
| Agent Automation | Run automation tasks with Google Flow's AI agent controls. |
| Chain Prompt | Automatically uses the last frame of the previous video as the input image for the next prompt, chaining an entire story together. |
| Resume from Checkpoint | Continue from where you left off after an interruption; the last-frame copy of each segment is preserved. |
| Live Preview Panel | Preview chained images and videos in real time; supports drag-to-reorder, manual frame replacement, automatic color-transition detection, and auto-retry on failure. |
| One-Click Project Export | Package the entire chain (prompt settings, segment videos, last-frame images) into a ZIP download. |
| Auto Download | Videos (720p / 1080p / 4K) and images (1K / 2K / 4K) are downloaded automatically and organized per project into their own folders. |
| Narration Script Import | Import .txt / .csv narration scripts and auto-map each segment to its prompt; built-in 30 Google Chirp 3 HD voices. |
| Character & Voice Auto-Matching | Auto-add character images based on filename and tokenized matching; voices are auto-selected when speaker names appear in prompts. |
| Debug Log Report | Records the status of every task (upload, success, failure, retry) with an accurate log count, auto-scroll, copy, clear, and one-click export to TXT; failures are shown in red. |
| Side Panel | Opens as a resizable split panel on the right side of the browser when you click the toolbar icon; width is adjustable by dragging. |
| Dual Themes | Light Provence (pink / black / white) is the default theme; you can switch to Dark (green / black / white); all text remains clearly readable. |
| Multilingual UI | Traditional Chinese, Simplified Chinese, and English; switch languages via the unified Language dropdown in Settings. |
| GitHub Repository | The GitHub button in the top-right corner opens the project repository (https://github.com/m45801ch/Auto-Flow-Free) in a new tab. |
| Version Badge | The current version number (e.g. v1.9.1) is displayed at the very top of the UI, next to the GitHub button. |
| Full i18n Coverage | All UI text in every language (dropdown options, hints, tooltips) comes from the language dictionaries; the English UI has been fully verified to contain no residual Chinese characters. |

---

## Installation

This extension is distributed as a developer build. Install it as follows:

1. Download and unzip `flow-automation.zip`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the unzipped folder.
5. After loading, click the **Reload** icon on the extension card to make sure you are on the latest version.

Once installed, click the puzzle icon in the Chrome toolbar and **pin** Auto Flow Free for easy access.

---

## Getting Started

1. **Open Google Flow**: Go to [Google Flow](https://labs.google/fx/tools/flow) and create or open a project. The extension only works on Flow project pages. If you are not on a Flow page, a modal will appear and lock the interface; it disappears automatically once you return to Flow.
2. **Open the extension**: Click the Auto Flow Free icon in the Chrome toolbar; the interface opens as a split panel on the right side.
3. **Choose a mode**: Pick one of the six generation modes in the Control tab.
4. **Enter prompts**: Paste prompts into the input box (separate segments with blank lines) or import a file.
5. **Click Run**: Batch processing begins. Please do not close the Flow page.

---

## The Six Generation Modes

### 1. Text-to-Video

1. Select **Text to Video** in the Control tab.
2. Paste prompts into the input box (separate segments with blank lines), or click **Import prompts .txt / .csv** to import a file.
3. Configure video length in Settings (4s / 6s / 8s / 10s / 4s-merge / 6s-merge).
4. Click **Run** to start batch generation.

> **Example prompts** (two segments separated by a blank line):
> ```
> In a misty mountain valley at dawn, a flock of white sheep slowly
> crosses a hanging bridge as the camera pushes forward along it.
>
> On an old railway in the afternoon sun, a vintage steam locomotive
> whistles around a bend, golden light washing over its carriages.
> ```

### 2. Frame-to-Video

1. Select **Frame to Video**.
2. Click the upload area to select images (multiple supported).
3. Enter a prompt for each image (separate with blank lines).
4. In Settings, choose whether each segment uses only the Start frame or both Start and End frames.
5. Click **Run**.

### 3. Components-to-Video

1. Select **Components to Video**.
2. Upload character / component images.
3. Enter prompts describing the animation.
4. Optionally enable **Auto-add character images** (auto-match by filename) and use **Scan Characters** to sync project characters.
5. Optionally enable **Auto-add voice by speaker**; set a **Default speaker** as fallback.
6. Set the max number of input images per prompt (1–10) and the number of outputs per prompt.
7. Click **Run**.

### 4. Text-to-Image

1. Select **Text to Image**.
2. Enter detailed image descriptions (separate with blank lines).
3. Adjust the aspect ratio (16:9 / 9:16 / 1:1 / 3:4 / 4:3) and image model in Settings.
4. Click **Run**.

### 5. Image-to-Image

1. Select **Image to Image**.
2. Upload source images.
3. Enter transformation prompts.
4. Optionally enable **Auto-add character images** (auto-match by filename).
5. Click **Run**.

### 6. Agent Automation

1. Select **Agent Automation**.
2. Enter prompts describing the agent instructions.
3. Character controls and auto-add voice by speaker are supported.
4. Click **Run**.

---

## Chain Prompt

Chain Prompt is the core feature of this extension. Once enabled, the system automatically feeds the last frame of the previous video into the next prompt as its input image, letting you stitch multiple short videos into one continuous story.

The **Live Preview Panel** automatically generates a copy of each segment's last frame plus playable previews of the generated videos while running. You can:

- **Drag cards** to reorder segments;
- Click **Replace Frame** to manually swap a segment's input image;
- The system **automatically detects color transitions** between adjacent segments and retries when the transition is discontinuous;
- **Resume from checkpoint**: after an interruption, processing continues from the last completed segment instead of restarting;
- When done, click **Export Project** to download the whole chain (prompt settings, segment videos, last-frame images) as a ZIP file.

---

## Narration Script Import

Save your narration script as a .txt or .csv file, then click **Import Narration** to batch-import it; the system maps each segment to the corresponding prompt in order. The built-in **Default Speaker** dropdown offers 30 Google Chirp 3 HD voices. With **Auto-add voice by speaker** enabled, speaker names mentioned in prompts are automatically matched to the corresponding voice.

---

## Settings

### General Settings

| Option | Description |
| --- | --- |
| Default Mode | The default generation mode for new videos. |
| Default Aspect Ratio | Dropdown: 16:9 / 9:16 / 1:1 / 3:4 / 4:3. |
| Outputs per Prompt | Number of images/videos to generate per prompt. |
| Concurrent Prompts | Process 1–6 prompts simultaneously (merge modes run one task at a time). |
| Random Delay | Add random wait times between submissions to avoid rate limits. |

### Models & Duration

| Option | Description |
| --- | --- |
| Model (Video) | Veo 3.1 Lite / Lite [Lower Priority] / Fast / Quality / Omni Flash (requires Pro or Ultra plan), and more. |
| Image Model | Nano Banana Pro / Nano Banana 2 / Nano Banana 2 Lite. |
| Default Video Option | 4s / 6s / 8s / 10s / 4s-merge (Ultra) / 6s-merge (Ultra). |
| Default Image Mode | New Image / Last Image. |
| Max Input Images | Maximum input images used per prompt (1–10). |

### Download & Advanced Settings

| Option | Description |
| --- | --- |
| Auto Download Quality (Video) | 720p / 1080p (requires Ultra/Pro plan) / 4K (requires Ultra/Pro plan). |
| Auto Download Quality (Image) | No download / 1K / 2K / 4K (requires Ultra plan). |
| Save to Folder | Name a subfolder inside Chrome's Downloads folder to organize outputs per project. |
| Auto Rename Files | Automatically rename downloaded files with clear prefixes and project paths. |
| Remove Watermark | Opens the watermark-removal website in a new tab. |
| Theme | Light Provence (pink / black / white) is the default; switch to Dark (green / black / white). |
| Aspect Ratio | Dropdown: 16:9 / 9:16 / 1:1 / 3:4 / 4:3. |
| Language | Traditional Chinese / Simplified Chinese / English via a dropdown. |

The **Download Settings** section explains that videos are downloaded to Chrome's Downloads folder, with a dedicated subfolder per project; click the gear icon to open Chrome's download settings quickly. All settings sync automatically across all browser tabs.

---

## Other Features

- **Debug Log Report tab**: Records the execution status of every task (upload, success, failure, retry) with an accurate entry count, auto-scroll, copy, clear, and one-click export (TXT file with timestamp); failures are highlighted in red.
- **Non-Flow page modal**: When you are not on a Flow project page, a modal locks the interface; it disappears automatically when you return to Flow. All Flow language variants (Traditional Chinese, Simplified Chinese, English, etc.) are supported.
- **Clear Cache / Report Error**: If you encounter an unusual activity error, click **Clear Cache** to attempt a fix.

---

## Troubleshooting

| Issue | Cause & Solution |
| --- | --- |
| Extension not working | Make sure you are on a Google Flow project page (`labs.google/fx/tools/flow/project/...`, in any language variant). |
| Unusual Activity / Verification Error | 1. Click **Clear Cache** in the Control tab. 2. Try creating a new project. 3. Try a new browser profile. 4. Verify manual creation works first. |
| Video/Image not downloading | Disable Chrome's download prompt: Chrome Settings → Downloads → turn off "Ask where to save each file before downloading". |
| Policy Error | Google flagged the prompt or image; the tool skips it automatically and continues with the next task. |
| Screen Zoomed Out | The extension zooms out automatically to locate UI buttons while running; do not adjust browser zoom manually. |

---

## Privacy & Data

All tasks run entirely inside your browser sandbox. Prompts, assets, and settings are stored locally in Chrome Local Storage (used to sync settings across tabs) and are never sent to any external server.

---

*This extension is an independent project and is not affiliated with, endorsed by, or connected to Google or the Google Flow team.*
