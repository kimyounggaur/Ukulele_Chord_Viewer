"""Split the local KS X 1001 + Latin variable font into a small app core and supplement.

Requires fonttools with Brotli support. The input is the tracked, custom-renamed
Lesson Designer Sans source font; generated faces stay disjoint through unicode-range.
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-assets/fonts/LessonDesignerSans-KSX1001-Latin.full.woff2"
OUTPUT_DIRECTORY = ROOT / "src/assets/fonts"
CORE_OUTPUT = OUTPUT_DIRECTORY / "LessonDesignerSans-Core.woff2"
SUPPLEMENT_OUTPUT = OUTPUT_DIRECTORY / "LessonDesignerSans-KSX1001-Supplement.woff2"
CSS_OUTPUT = OUTPUT_DIRECTORY / "lesson-designer-font.css"
TEXT_EXTENSIONS = {".css", ".html", ".json", ".ts", ".tsx"}


def app_codepoints() -> set[int]:
    paths = [ROOT / "index.html"]
    paths.extend(
        path
        for path in (ROOT / "src").rglob("*")
        if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS
    )
    text = "".join(path.read_text(encoding="utf-8") for path in paths)
    return {ord(character) for character in text} | set(range(0x20, 0x7F)) | {0x00A0}


def save_subset(codepoints: set[int], output_path: Path) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.hinting = False
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.notdef_glyph = True
    options.recommended_glyphs = True
    options.drop_tables += ["DSIG"]

    font = subset.load_font(str(SOURCE), options, lazy=False)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    subset.save_font(font, str(output_path), options)


if not SOURCE.exists():
    raise SystemExit(f"폰트 원본이 없습니다: {SOURCE.relative_to(ROOT)}")

OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
font = TTFont(SOURCE)
available = set(font.getBestCmap())
font.close()
core = available & app_codepoints()
supplement = available - core
if not core or not supplement or core & supplement or core | supplement != available:
    raise SystemExit("폰트 코드포인트 분할 검증에 실패했습니다.")

save_subset(core, CORE_OUTPUT)
save_subset(supplement, SUPPLEMENT_OUTPUT)

css = '''@font-face {
  font-family: "Lesson Designer Sans KS";
  src: url("./LessonDesignerSans-KSX1001-Supplement.woff2") format("woff2-variations");
  font-style: normal;
  font-weight: 45 930;
  font-display: swap;
}

@font-face {
  font-family: "Lesson Designer Sans";
  src: url("./LessonDesignerSans-Core.woff2") format("woff2-variations");
  font-style: normal;
  font-weight: 45 930;
  font-display: swap;
}
'''
CSS_OUTPUT.write_text(css, encoding="utf-8", newline="\n")

print(
    f"폰트 분할 완료: core {len(core)}자/{CORE_OUTPUT.stat().st_size:,}B, "
    f"supplement {len(supplement)}자/{SUPPLEMENT_OUTPUT.stat().st_size:,}B"
)
