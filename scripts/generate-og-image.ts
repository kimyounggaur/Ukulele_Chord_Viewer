import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 12_000;
const projectDirectory = process.cwd();
const chordImagePath = resolve(projectDirectory, "public", "chords", "major", "c.png");
const outputPath = resolve(projectDirectory, "public", "og-image.png");

const background = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="1200" height="630" fill="#e8ecf3"/>
    <circle cx="72" cy="70" r="122" fill="#f4c5d8"/>
    <circle cx="652" cy="625" r="190" fill="#cbdaf0"/>
    <rect x="52" y="48" width="664" height="534" rx="44" fill="#f8f9fc"/>
    <rect x="76" y="76" width="246" height="42" rx="21" fill="#263449"/>
    <text x="199" y="104" text-anchor="middle" fill="#ffffff" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="21" font-weight="700" letter-spacing="1">LESSON DESIGNER</text>
    <text x="82" y="214" fill="#263449" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="66" font-weight="800">우쿨렐레 코드</text>
    <text x="82" y="299" fill="#263449" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="82" font-weight="900">뷰어</text>
    <text x="84" y="356" fill="#5a687c" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="27" font-weight="600">찾고, 듣고, 수업에 바로 쓰는</text>
    <text x="84" y="395" fill="#5a687c" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="27" font-weight="600">112개 코드 운지 라이브러리</text>
    <rect x="82" y="454" width="150" height="50" rx="25" fill="#f4c5d8"/>
    <rect x="244" y="454" width="137" height="50" rx="25" fill="#cbdaf0"/>
    <rect x="393" y="454" width="137" height="50" rx="25" fill="#d7e9df"/>
    <text x="157" y="487" text-anchor="middle" fill="#263449" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="21" font-weight="700">112개 코드</text>
    <text x="312" y="487" text-anchor="middle" fill="#263449" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="21" font-weight="700">소리 재생</text>
    <text x="461" y="487" text-anchor="middle" fill="#263449" font-family="Arial, 'Malgun Gothic', sans-serif" font-size="21" font-weight="700">수업 세트</text>
    <rect x="752" y="48" width="396" height="534" rx="44" fill="#f8f9fc" stroke="#ffffff" stroke-width="5"/>
    <circle cx="838" cy="132" r="48" fill="#f4c5d8"/>
    <text x="838" y="150" text-anchor="middle" fill="#263449" font-family="Arial, sans-serif" font-size="52" font-weight="900">C</text>
    <text x="910" y="124" fill="#263449" font-family="Arial, sans-serif" font-size="31" font-weight="800">Major</text>
    <text x="910" y="157" fill="#5a687c" font-family="Arial, sans-serif" font-size="22" font-weight="700">G C E A · 0003</text>
    <rect x="784" y="208" width="332" height="292" rx="30" fill="#e8ecf3"/>
    <rect x="804" y="522" width="292" height="10" rx="5" fill="#cbdaf0"/>
  </svg>
`);

const chordImage = await sharp(chordImagePath, { failOn: "error" })
  .resize({ width: 312, height: 234, fit: "contain" })
  .png()
  .toBuffer();

await sharp(background)
  .composite([{ input: chordImage, left: 794, top: 238 }])
  .removeAlpha()
  .png({
    compressionLevel: 9,
    effort: 10,
    palette: true,
    // Four colors keep the social card crisp while preserving the strict 3 MB site budget.
    colours: 4,
    dither: 0,
  })
  .toFile(outputPath);

const metadata = await sharp(outputPath, { failOn: "error" }).metadata();
const { size } = await stat(outputPath);
assert.equal(metadata.format, "png");
assert.equal(metadata.width, WIDTH);
assert.equal(metadata.height, HEIGHT);
assert.ok(size <= MAX_BYTES, `OG 이미지 ${size.toLocaleString()}B가 ${MAX_BYTES.toLocaleString()}B를 초과합니다.`);

console.log(`✓ OG 이미지 생성: ${WIDTH}×${HEIGHT}, ${size.toLocaleString()}B`);
