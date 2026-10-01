#!/usr/bin/env python3
"""Extract a .pptx into something an agent can audit: one Markdown file + the media.

Usage: python extract_pptx.py <deck.pptx> <out_dir>

Writes <out_dir>/slides.md (per slide, in presentation order: every text run grouped by shape, speaker notes,
and the images the slide uses) and copies the media to <out_dir>/media/. Standard library only.
"""
import os
import posixpath
import re
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
R_ID = "{%s}id" % NS["r"]
R_EMBED = "{%s}embed" % NS["r"]


def rels(z, part):
    """Relationship id -> absolute part path for a part (e.g. ppt/slides/slide1.xml)."""
    d, f = posixpath.split(part)
    path = posixpath.join(d, "_rels", f + ".rels")
    if path not in z.namelist():
        return {}
    out = {}
    for r in ET.fromstring(z.read(path)).findall("rel:Relationship", NS):
        if r.get("TargetMode") == "External":
            out[r.get("Id")] = r.get("Target")
        else:
            out[r.get("Id")] = posixpath.normpath(posixpath.join(d, r.get("Target")))
    return out


def shape_texts(root):
    """Text per shape: list of paragraphs (runs joined), skipping empty ones."""
    shapes = []
    for sp in root.iter("{%s}sp" % NS["p"]):
        paras = []
        for p in sp.iter("{%s}p" % NS["a"]):
            t = "".join(x.text or "" for x in p.iter("{%s}t" % NS["a"])).strip()
            if t:
                paras.append(t)
        if paras:
            shapes.append(paras)
    for tbl in root.iter("{%s}tbl" % NS["a"]):
        for tr in tbl.iter("{%s}tr" % NS["a"]):
            cells = ["".join(x.text or "" for x in tc.iter("{%s}t" % NS["a"])).strip() for tc in tr.iter("{%s}tc" % NS["a"])]
            if any(cells):
                shapes.append(["| " + " | ".join(cells) + " |"])
    return shapes


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(out, "media"), exist_ok=True)
    z = zipfile.ZipFile(src)

    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    prels = rels(z, "ppt/presentation.xml")
    order = [prels[s.get(R_ID)] for s in pres.find("p:sldIdLst", NS).findall("p:sldId", NS)]

    copied = set()
    lines = [f"# {os.path.basename(src)}", "", f"{len(order)} slides. Media in `media/`.", ""]
    for i, part in enumerate(order, 1):
        root = ET.fromstring(z.read(part))
        srels = rels(z, part)
        lines += [f"## Slide {i:02d}", ""]
        for paras in shape_texts(root):
            lines += ["- " + paras[0]] + [f"  {p}" for p in paras[1:]]
        imgs = []
        for blip in root.iter("{%s}blip" % NS["a"]):
            target = srels.get(blip.get(R_EMBED))
            if target and target in z.namelist():
                name = posixpath.basename(target)
                imgs.append(name)
                if name not in copied:
                    with z.open(target) as fsrc, open(os.path.join(out, "media", name), "wb") as fdst:
                        shutil.copyfileobj(fsrc, fdst)
                    copied.add(name)
        if imgs:
            lines += ["", "Images: " + ", ".join(f"`media/{n}`" for n in dict.fromkeys(imgs))]
        notes = [t for t in srels.values() if re.search(r"notesSlides/notesSlide\d+\.xml$", t)]
        if notes and notes[0] in z.namelist():
            nroot = ET.fromstring(z.read(notes[0]))
            ntext = [p for paras in shape_texts(nroot) for p in paras if not re.fullmatch(r"\d+", p)]
            if ntext:
                lines += ["", "Notes:", ""] + [f"> {t}" for t in ntext]
        lines.append("")

    with open(os.path.join(out, "slides.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{len(order)} slides, {len(copied)} media files -> {out}")


if __name__ == "__main__":
    main()
