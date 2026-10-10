# WRD Media: ScrollCraft frame prompts

One sequence is needed: **"The Build"**, the peak of the page. The gold line drawing on the site completes itself, then real photographs take over and the pergola goes from empty backyard to finished and lit at dusk.

The site already works without any of this (the scroll-drawn line art stands alone). These frames add the photographic payoff.

## Delivery spec (what I need back)

| Item | Spec |
|---|---|
| Aspect ratio | 16:9, landscape, at least 1920 px wide |
| Camera | Locked off, eye height about 5 ft, slight 3/4 angle to the pergola. Nothing moves except what is described. |
| People | None. No animals, no cars. |
| Text | None. No logos, no signage, no watermarks. |
| Subject placement | Pergola centered in the middle third of the frame (it gets cropped on phones). Sky and fence fill the rest. |
| Files | Route A: one MP4 (5-8 s) or the two keyframes. Route B: six PNG/JPG named `K1.png` to `K6.png`. |

Drop the files in `C:\Users\hwrdk\Projects\wrdmedia-site\prompts\delivered\` and tell me. I turn them into 72 WebP frames, switch `photoFrames` on in `script.js`, and push a preview.

## Style preamble (paste at the top of EVERY prompt, verbatim)

> Photorealistic architectural photograph, North Texas suburban backyard, Frisco style new-build home, shot on a full-frame camera with a 28mm lens at f/8, locked-off tripod, eye height. Poured concrete patio, cedar privacy fence, trimmed St. Augustine lawn, a young live oak at the left edge. Matte black powder-coated aluminum pergola with a flat louvered roof. Clean, premium, editorial real-estate quality. No people, no animals, no cars, no text, no logos, no watermarks. 16:9 landscape, pergola centered in the middle third of the frame.

## Route A: video (best result, fewest files)

Needs a tool that accepts a **first frame and a last frame** (sometimes called Start/End Frame or Keyframes).

### A1. First frame (blueprint)

> [PREAMBLE]
>
> Scene: late afternoon, soft overcast light. The patio is empty, with no pergola built yet. Floating in the air above the patio is a thin, glowing gold line drawing of the pergola, wireframe only, four posts, top beams and rafters, no fill, no shading, crisp 3 px lines like an architect's hologram. Faint silver dimension lines run along the base and the right post. The wireframe is perfectly aligned to the patio corners.

### A2. Last frame (built, lit)

> [PREAMBLE]
>
> Scene: the same exact camera position and framing as the first frame. The pergola is now fully built in matte black aluminum, louvers half open. Blue hour just after sunset, deep blue sky with a band of warm orange on the horizon. Warm 2700K string lights run along the rafters and glow, a warm light spills onto the patio, outdoor furniture in charcoal and cream under the roof. No gold wireframe remains. Everything else (fence, lawn, oak tree, house, patio edges) is identical to the first frame.

### A3. Motion prompt (paste with the two frames)

> Locked-off camera, no camera movement. The thin gold wireframe pulses once, then materializes into the real matte black aluminum pergola, post by post, then beams, then louvers. As the structure completes, the light shifts from late afternoon overcast to blue hour, and the string lights switch on one by one. Smooth, continuous, realistic, no cuts, no zoom. 6 seconds.

### Tools to try (verify the free limits yourself; they change often)

Research this session found third-party reports only, no official pricing pages, and some of them contradict each other. What they agree on:

- **Kling** (Start/End Frame): usually a small free daily or signup allowance, watermark and lower resolution on free.
- **Hailuo / MiniMax**: signup credits, image-to-video, first/last frame on some versions.
- **Luma Dream Machine**: limited free generations, keyframe support.
- **Google Flow / Veo** (through your Gemini account): best realism if your plan includes it. Use the "frames to video" mode.
- **Wan** (open weights): unlimited only if you run it yourself on a GPU.
- Aggregator sites that offer "first and last frame" with a free tier exist, but each has its own watermark and terms. Do not use a watermarked clip on the live site.

If a tool only does single-image-to-video, use Route B instead.

## Route B: stills only (Gemini or ChatGPT, no video tool)

Six keyframes. The trick to keep them consistent: generate K1 first, then for K2 to K6 **upload K1 as a reference and ask for an edit**, not a new picture. Tell it "same image, same camera, change only the following".

Prefix every prompt with the style preamble above (for K1) or with "Edit this image. Keep the camera, fence, lawn, tree, house and patio exactly identical. Change only:" (for K2 to K6).

| # | Moment | What changes |
|---|---|---|
| K1 | 0% | Empty patio, late afternoon overcast. Thin gold wireframe pergola hovering, lines only, silver dimension lines. |
| K2 | 20% | Same. The wireframe is brighter and the four posts are now solid matte black, the rest still gold lines. |
| K3 | 40% | Posts and beams solid black. Rafters and louvers still gold lines. Light has started to warm and dim slightly. |
| K4 | 60% | Fully built pergola, solid black, louvers closed. No gold left. Golden hour light, long shadows. |
| K5 | 80% | Same structure, louvers half open, sun just set, sky orange to blue. String lights just switched on, faint glow. |
| K6 | 100% | Blue hour, string lights fully lit and glowing warm, light spilling on the patio, furniture visible under the roof. |

I blend between these with frame interpolation. It is less smooth than real video but works.

## Optional extras (not required to ship)

1. **Share image** (1200x630): K6, cropped tight on the pergola with space on the left. No text in the image.
2. **Phone version** (9:16): only if the center crop of the 16:9 looks bad on a phone. Same prompts, add "9:16 portrait, pergola centered, sky above and lawn below".

## What I do after delivery

1. Extract or interpolate to 72 frames at 1600x900 WebP, quality 80 (about 2 MB total).
2. Put them in `assets/seq/001.webp` to `072.webp`.
3. Set `photoFrames: true` in `script.js`.
4. Check the scroll at 6 positions per act, desktop and phone, and push a preview.
